import type { PluginServerContext } from "@getpaseo/plugin/server";
import { nameWorkspace } from "./server/namer";
import { titleStyleSettings } from "./shared/settings";

export default function contribute(server: PluginServerContext) {
  server.registerSettings(titleStyleSettings);
  const removeCreated = server.on("agent.created", (event, { paseo }) => {
    void nameWorkspace(paseo, event.agent, Date.now());
  });
  return () => {
    removeCreated();
  };
}
