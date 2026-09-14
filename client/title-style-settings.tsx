import { useCallback, useEffect, useMemo, useState } from "react";
import { Text, TextInput } from "react-native";
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
} from "@getpaseo/plugin/client/ui";
import { titleStyleSettings } from "../shared/settings";
import { detectLocale, strings } from "./i18n";

type ReadySettings = Extract<
  SettingsState<typeof titleStyleSettings.schema>,
  { status: "ready" }
>;

const AUTOSAVE_DELAY_MS = 600;

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
  const dirty =
    draft.instructions !== settings.values.instructions ||
    draft.model !== settings.values.model;
  // Debounced auto-save; stops on a failed save until the next edit.
  useEffect(() => {
    if (!dirty || settings.saving || settings.saveError) return;
    const id = setTimeout(() => {
      void settings.save(
        { ...settings.values, instructions: draft.instructions, model: draft.model },
        settings.revision,
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [dirty, settings, draft]);
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
