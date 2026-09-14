import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { PaseoApi } from "@getpaseo/client";
import type { PluginHookAgent } from "@getpaseo/plugin/server";
import { titleStyleSettings, type TitleStyleSettings } from "../shared/settings";

const MAX_TITLE_CHARS = 80;
const PROMPT_SOURCE_MAX_CHARS = 600;
const GENERATE_TIMEOUT_MS = 30_000;
// A title that changed during generation within this window is the built-in
// English generator landing, not a user rename.
const BUILTIN_WINDOW_MS = 60_000;
const OUR_AGENT_TITLE = "会话标题生成";

const processed = new Set<string>();
const inFlight = new Set<string>();
const ourTitles = new Map<string, string>();

function settingsFilePath(): string {
  const home = process.env.PASEO_HOME || path.join(homedir(), ".paseo");
  return path.join(home, "plugin-settings", "title-style", `${titleStyleSettings.id}.json`);
}

export async function readSettings(): Promise<TitleStyleSettings> {
  try {
    const raw = await readFile(settingsFilePath(), "utf8");
    const envelope = JSON.parse(raw) as { values?: unknown };
    return titleStyleSettings.schema.parse(envelope.values ?? {});
  } catch {
    return titleStyleSettings.schema.parse({});
  }
}

async function resolveModel(
  paseo: PaseoApi,
  override: string,
): Promise<{ provider: string; model?: string; thinkingOptionId?: string } | null> {
  if (override) {
    const [provider, ...rest] = override.split("/");
    if (!provider) return null;
    return { provider, model: rest.join("/") || undefined };
  }
  const { config } = await paseo.config.get();
  const metadata = (
    config as {
      metadataGeneration?: {
        providers?: Array<{ provider: string; model?: string; thinkingOptionId?: string }>;
      };
    }
  ).metadataGeneration;
  return metadata?.providers?.find((entry) => entry.provider) ?? null;
}

async function fetchFirstPrompt(
  paseo: PaseoApi,
  agentId: string,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await paseo.agents.ref(agentId).timeline.refetch()) as {
      items?: Array<{ type: string; text?: string }>;
    };
    const first = payload.items?.find(
      (item) => item.type === "user_message" && typeof item.text === "string" && item.text.trim(),
    );
    if (first?.text) return first.text.trim().slice(0, PROMPT_SOURCE_MAX_CHARS);
  } catch {
    // Timeline may not be ready yet; the provisional title is a fine seed.
  }
  return fallback;
}

function extractTitle(text: string | null): string | null {
  if (!text) return null;
  const cleaned = text.trim();
  try {
    const parsed = JSON.parse(cleaned) as { title?: unknown };
    if (typeof parsed.title === "string" && parsed.title.trim()) return parsed.title.trim();
  } catch {
    // Not JSON; fall through to pattern extraction.
  }
  const match = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
  if (match) return match[1].trim();
  const line = cleaned
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean);
  return line ? line.replace(/^["'`\s]+|["'`\s]+$/g, "") || null : null;
}

function sanitizeTitle(title: string): string | null {
  const oneLine = title.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_CHARS).trim();
  return oneLine || null;
}

export async function nameWorkspace(
  paseo: PaseoApi,
  agent: PluginHookAgent,
  createdAt: number,
): Promise<void> {
  const workspaceId = agent.workspaceId;
  if (!workspaceId || agent.title === OUR_AGENT_TITLE) return;
  if (processed.has(workspaceId) || inFlight.has(workspaceId)) return;

  // The event payload carries config.title, which is unset for agents created
  // through the CLI or app composer; the provisional title lives on the snapshot.
  const provisional = agent.title ?? (await paseo.agents.ref(agent.id).refresh())?.agent.title ?? null;
  if (!provisional) return;
  console.log(
    `[title-style] agent.created: id=${agent.id} workspaceId=${workspaceId} title=${provisional}`,
  );
  inFlight.add(workspaceId);
  try {
    const settings = await readSettings();
    if (!settings.enabled) return;
    const ws = paseo.workspaces.ref(workspaceId);
    const titleAtStart = (await ws.refresh())?.name ?? null;

    const model = await resolveModel(paseo, settings.model);
    if (!model) {
      console.log(
        "[title-style] no model: settings.model is empty and agents.metadataGeneration.providers is unset",
      );
      return;
    }

    const source = await fetchFirstPrompt(paseo, agent.id, provisional);
    const promptText = [
      "根据下面的用户请求，为这个编码会话生成一个标题。",
      "",
      settings.instructions,
      "",
      "用户请求：",
      '"""',
      source,
      '"""',
      "",
      '只返回 JSON，格式：{"title": "…"}，不要输出其他内容。',
    ].join("\n");

    // Create inside the target workspace so the daemon does not spawn a stray
    // directory workspace for the one-shot generator.
    const handle = await paseo.workspaces.ref(workspaceId).agents.create({
      config: {
        provider: model.provider + (model.model ? `/${model.model}` : ""),
        ...(model.thinkingOptionId ? { thinkingOptionId: model.thinkingOptionId } : {}),
      },
      title: OUR_AGENT_TITLE,
      prompt: promptText,
      // Delegate to the triggering agent (same label the daemon's MCP create_agent
      // path sets). Delegated agents skip attention broadcasts, so the generator
      // finishing never raises a notification.
      labels: { "paseo.parent-agent-id": agent.id },
    });
    let lastMessage: string | null = null;
    try {
      const result = await handle.waitForFinish(GENERATE_TIMEOUT_MS);
      lastMessage = result.lastMessage;
      if (result.status !== "idle") {
        console.log(
          `[title-style] generation ended with status ${result.status}${result.error ? `: ${result.error}` : ""}`,
        );
      }
    } finally {
      await handle.archive().catch((error) =>
        console.log(`[title-style] archiving generator failed: ${String(error)}`),
      );
    }

    const generated = sanitizeTitle(extractTitle(lastMessage) ?? "");
    if (!generated) {
      console.log("[title-style] model returned no usable title");
      return;
    }

    const current = (await ws.refresh())?.name ?? null;
    if (current === generated) {
      processed.add(workspaceId);
      return;
    }
    const unchanged =
      current === titleAtStart ||
      current === provisional ||
      current === ourTitles.get(workspaceId);
    const builtInLanded = Date.now() - createdAt < BUILTIN_WINDOW_MS;
    if (!unchanged && !builtInLanded) {
      console.log(`[title-style] workspace renamed by user ("${current}"), skipping`);
      return;
    }

    await ws.setTitle(generated);
    ourTitles.set(workspaceId, generated);
    processed.add(workspaceId);
    console.log(`[title-style] "${current ?? "(untitled)"}" -> "${generated}"`);
  } catch (error) {
    console.log(`[title-style] failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    inFlight.delete(workspaceId);
  }
}
