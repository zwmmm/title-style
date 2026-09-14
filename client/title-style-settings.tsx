import { useCallback, useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import {
  useSettings,
  type PluginSurfaceProps,
  type SettingsState,
} from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  SettingsRow,
  SettingsSection,
  SettingsSwitch,
} from "@getpaseo/plugin/client/ui";
import { titleStyleSettings } from "../shared/settings";

type ReadySettings = Extract<
  SettingsState<typeof titleStyleSettings.schema>,
  { status: "ready" }
>;

function Controls({
  settings,
  theme,
}: {
  settings: ReadySettings;
  theme: PluginSurfaceProps["theme"];
}) {
  const [draft, setDraft] = useState(() => settings.values);
  const changeInstructions = useCallback(
    (instructions: string) => setDraft((current) => ({ ...current, instructions })),
    [],
  );
  const changeModel = useCallback(
    (model: string) => setDraft((current) => ({ ...current, model })),
    [],
  );
  const toggleEnabled = useCallback(
    (enabled: boolean) => {
      void settings.save({ ...settings.values, enabled }, settings.revision);
    },
    [settings],
  );
  const saveText = useCallback(async () => {
    await settings.save(
      { ...settings.values, instructions: draft.instructions, model: draft.model },
      settings.revision,
    );
  }, [settings, draft]);
  const styles = useMemo(
    () => ({
      text: { color: theme.colors.foreground },
      muted: { color: theme.colors.foregroundMuted },
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
    }),
    [theme],
  );
  return (
    <>
      <SettingsSection title="开关">
        <SettingsCard>
          <SettingsSwitch
            label="启用标题生成"
            hint="关闭后新会话不再自动重命名"
            value={settings.values.enabled}
            disabled={settings.saving}
            onValueChange={toggleEnabled}
          />
        </SettingsCard>
      </SettingsSection>
      <SettingsSection title="标题提示词">
        <SettingsCard>
          <SettingsRow label="提示词" hint="决定标题的语言和风格">
            <TextInput
              multiline
              value={draft.instructions}
              onChangeText={changeInstructions}
              editable={!settings.saving}
              style={styles.input}
            />
          </SettingsRow>
          <SettingsInput
            label="模型覆盖"
            hint="留空跟随 Metadata 模型配置，格式 provider/model"
            placeholder="例如 anthropic/claude-haiku-4-5"
            initialValue={draft.model}
            onChangeText={changeModel}
            disabled={settings.saving}
          />
          <SettingsAction
            label="提示词与模型"
            actionLabel={settings.saving ? "保存中…" : "保存"}
            disabled={settings.saving}
            onPress={() => void saveText()}
          />
          <SettingsAction
            label="恢复默认"
            actionLabel="恢复默认设置"
            disabled={settings.saving}
            onPress={() => void settings.reset()}
          />
        </SettingsCard>
        {settings.saveError ? (
          <Text accessibilityRole="alert" style={styles.muted}>
            {settings.saveError}
          </Text>
        ) : null}
        <View>
          <Text style={styles.muted}>当前提示词：{settings.values.instructions}</Text>
        </View>
      </SettingsSection>
    </>
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
        {settings.status === "invalid" ? (
          <SettingsAction
            label="存储数据无效"
            actionLabel="恢复默认设置"
            onPress={() => void settings.reset()}
          />
        ) : null}
      </SettingsSection>
    );
  }
  return <Controls settings={settings} theme={theme} />;
}
