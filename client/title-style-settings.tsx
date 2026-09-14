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
import { detectLocale, strings } from "./i18n";

type ReadySettings = Extract<
  SettingsState<typeof titleStyleSettings.schema>,
  { status: "ready" }
>;

function Editor({
  settings,
  theme,
  locale,
}: {
  settings: ReadySettings;
  theme: PluginSurfaceProps["theme"];
  locale: "zh" | "en";
}) {
  const t = strings[locale];
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
      <SettingsSection title={t.general}>
        <SettingsCard>
          <SettingsSwitch
            label={t.enableTitle}
            hint={t.enableHint}
            value={settings.values.enabled}
            disabled={settings.saving}
            onValueChange={toggleEnabled}
          />
        </SettingsCard>
      </SettingsSection>
      <SettingsSection title={t.promptSection}>
        <SettingsCard>
          <SettingsRow label={t.promptLabel} hint={t.promptHint}>
            <TextInput
              multiline
              value={draft.instructions}
              onChangeText={changeInstructions}
              editable={!settings.saving}
              style={styles.input}
            />
          </SettingsRow>
          <SettingsInput
            label={t.modelLabel}
            hint={t.modelHint}
            placeholder={t.modelPlaceholder}
            initialValue={draft.model}
            onChangeText={changeModel}
            disabled={settings.saving}
          />
          <SettingsAction
            label={t.promptLabel}
            actionLabel={settings.saving ? t.saving : t.save}
            disabled={settings.saving}
            onPress={() => void saveText()}
          />
          <SettingsAction
            label={t.resetLabel}
            actionLabel={t.resetAction}
            disabled={settings.saving}
            onPress={() => void settings.reset()}
          />
        </SettingsCard>
        {settings.saveError ? (
          <Text accessibilityRole="alert" style={styles.muted}>
            {settings.saveError}
          </Text>
        ) : null}
      </SettingsSection>
    </>
  );
}

export function TitleStyleSettings({ theme }: PluginSurfaceProps) {
  const settings = useSettings(titleStyleSettings);
  const locale = useMemo(() => detectLocale(), []);
  const t = strings[locale];
  const style = useMemo(() => ({ color: theme.colors.foreground }), [theme]);
  if (settings.status === "loading") return <Text style={style}>{t.loading}</Text>;
  if (settings.status !== "ready") {
    return (
      <SettingsSection title={t.promptSection}>
        <Text style={style}>{settings.error}</Text>
        <SettingsAction label={t.retry} actionLabel={t.reload} onPress={settings.reload} />
      </SettingsSection>
    );
  }
  return <Editor settings={settings} theme={theme} locale={locale} />;
}
