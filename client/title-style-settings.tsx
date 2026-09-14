import { useCallback, useMemo, useState } from "react";
import { Text, TextInput } from "react-native";
import {
  useSettings,
  type PluginSurfaceProps,
  type SettingsState,
} from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from "@getpaseo/plugin/client/ui";
import { titleStyleSettings } from "../shared/settings";

type ReadySettings = Extract<
  SettingsState<typeof titleStyleSettings.schema>,
  { status: "ready" }
>;

function Editor({
  settings,
  theme,
}: {
  settings: ReadySettings;
  theme: PluginSurfaceProps["theme"];
}) {
  const [draft, setDraft] = useState(() => settings.values.instructions);
  const save = useCallback(async () => {
    await settings.save({ ...settings.values, instructions: draft }, settings.revision);
  }, [settings, draft]);
  const styles = useMemo(
    () => ({
      input: {
        color: theme.colors.foreground,
        backgroundColor: theme.colors.surface1,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        minHeight: 96,
        fontSize: 13,
        textAlignVertical: "top" as const,
      },
      muted: { color: theme.colors.foregroundMuted },
    }),
    [theme],
  );
  return (
    <SettingsSection title="标题提示词">
      <SettingsCard>
        <SettingsRow label="提示词" hint="决定标题的语言和风格">
          <TextInput
            multiline
            value={draft}
            onChangeText={setDraft}
            editable={!settings.saving}
            style={styles.input}
          />
        </SettingsRow>
        <SettingsAction
          label="保存提示词"
          actionLabel={settings.saving ? "保存中…" : "保存"}
          disabled={settings.saving || draft === settings.values.instructions}
          onPress={() => void save()}
        />
      </SettingsCard>
      {settings.saveError ? (
        <Text accessibilityRole="alert" style={styles.muted}>
          {settings.saveError}
        </Text>
      ) : null}
    </SettingsSection>
  );
}

export function TitleStyleSettings({ theme }: PluginSurfaceProps) {
  const settings = useSettings(titleStyleSettings);
  const style = useMemo(() => ({ color: theme.colors.foreground }), [theme]);
  if (settings.status === "loading") return <Text style={style}>加载设置中…</Text>;
  if (settings.status !== "ready") {
    return (
      <SettingsSection title="会话标题生成">
        <Text style={style}>{settings.error}</Text>
        <SettingsAction label="重试" actionLabel="重新加载" onPress={settings.reload} />
      </SettingsSection>
    );
  }
  return <Editor settings={settings} theme={theme} />;
}
