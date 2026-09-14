import type { PluginClientContext } from "@getpaseo/plugin/client";
import { TitleStyleSettings } from "./client/title-style-settings";
import { detectLocale, strings } from "./client/i18n";

export default function contribute(client: PluginClientContext) {
  const t = strings[detectLocale()];
  client.addSettingsScreen({
    id: "title-style",
    title: t.settingsTitle,
    icon: "Languages",
    Component: TitleStyleSettings,
  });
  return () => {};
}
