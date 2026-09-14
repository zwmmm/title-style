import { I18nManager, Platform } from "react-native";

export type Locale = "zh" | "en";

export function detectLocale(): Locale {
  const raw =
    Platform.OS === "web" && typeof navigator !== "undefined"
      ? navigator.language
      : I18nManager.getConstants().localeIdentifier;
  return /^zh([_-]|$)/i.test(raw ?? "") ? "zh" : "en";
}

const zh = {
  settingsTitle: "设置",
  promptSection: "标题提示词",
  promptLabel: "提示词",
  promptHint: "决定标题的语言和风格",
  modelLabel: "模型覆盖",
  modelHint: "留空跟随 Metadata 模型配置，格式 provider/model",
  modelPlaceholder: "例如 anthropic/claude-haiku-4-5",
  loading: "加载设置中…",
  retry: "重试",
  reload: "重新加载",
} as const;

const en: Record<keyof typeof zh, string> = {
  settingsTitle: "Settings",
  promptSection: "Title prompt",
  promptLabel: "Prompt",
  promptHint: "Controls the language and style of generated titles",
  modelLabel: "Model override",
  modelHint: "Empty follows the Metadata model config; format provider/model",
  modelPlaceholder: "e.g. anthropic/claude-haiku-4-5",
  loading: "Loading settings…",
  retry: "Retry",
  reload: "Reload",
};

export const strings: Record<Locale, Record<keyof typeof zh, string>> = { zh, en };
