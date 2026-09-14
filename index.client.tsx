import type { PluginClientContext } from "@getpaseo/plugin/client";
import { TitleStyleSettings } from "./client/title-style-settings";

export default function contribute(client: PluginClientContext) {
  client.addSettingsScreen({
    id: "title-style",
    title: "标题生成",
    icon: "Languages",
    Component: TitleStyleSettings,
  });
  return () => {};
}
