import type { PluginClientContext } from "@getpaseo/plugin/client";
import { TitleStyleSettings } from "./client/title-style-settings";
import { messages } from "./client/i18n";

export default function contribute(client: PluginClientContext) {
  return client.addSettingsScreen({
    id: "title-style",
    title: messages.message("settingsTitle"),
    icon: "Languages",
    Component: TitleStyleSettings,
  });
}
