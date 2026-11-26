import { useCallback, useEffect, useState } from "react";
import {
  useSettings,
  useTranslation,
  type PluginSurfaceProps,
  type SettingsState,
} from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  SettingsRow,
  SettingsSection,
  TextInput,
} from "@getpaseo/plugin/client/ui";
import { titleStyleSettings } from "../shared/settings";
import { messages } from "./i18n";

type EditorSettings = Extract<
  SettingsState<typeof titleStyleSettings.schema>,
  { status: "ready" | "loading" }
>;

const AUTOSAVE_DELAY_MS = 600;

function Editor({
  settings,
  theme,
}: {
  settings: EditorSettings;
  theme: PluginSurfaceProps["theme"];
}) {
  const { t } = useTranslation(messages);
  const [draft, setDraft] = useState(() =>
    settings.status === "ready" ? settings.values : titleStyleSettings.schema.parse({}),
  );
  const changeInstructions = useCallback(
    (instructions: string) => setDraft((current) => ({ ...current, instructions })),
    [],
  );
  const changeModel = useCallback(
    (model: string) => setDraft((current) => ({ ...current, model })),
    [],
  );
  const dirty = settings.status === "ready" && (
    draft.instructions !== settings.values.instructions ||
    draft.model !== settings.values.model
  );

  useEffect(() => {
    if (settings.status !== "ready" || !dirty || settings.saving || settings.saveError) return;
    const id = setTimeout(() => {
      void settings.save(
        { ...settings.values, instructions: draft.instructions, model: draft.model },
        settings.revision,
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [dirty, settings, draft]);

  const loading = settings.status === "loading";
  const disabled = loading || settings.saving;
  return (
    <SettingsSection title={t("promptSection")}>
      <SettingsCard>
        <SettingsRow label={t("promptLabel")} hint={t("promptHint")}>
          <TextInput
            multiline
            value={loading ? "" : draft.instructions}
            placeholder={loading ? t("loading") : undefined}
            placeholderTextColor={theme.colors.foregroundMuted}
            accessibilityLabel={t("promptLabel")}
            onChangeText={changeInstructions}
            editable={!disabled}
            style={{
              color: theme.colors.foreground,
              backgroundColor: theme.colors.surface1,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              minHeight: 96,
              fontSize: 13,
              textAlignVertical: "top",
            }}
          />
        </SettingsRow>
        <SettingsInput
          label={t("modelLabel")}
          hint={t("modelHint")}
          placeholder={t(loading ? "loading" : "modelPlaceholder")}
          initialValue={loading ? undefined : draft.model}
          onChangeText={changeModel}
          disabled={disabled}
        />
        {settings.saveError ? (
          <SettingsRow label={t("settingsTitle")} error={t("saveFailed")} />
        ) : null}
      </SettingsCard>
    </SettingsSection>
  );
}

export function TitleStyleSettings({ theme }: PluginSurfaceProps) {
  const settings = useSettings(titleStyleSettings);
  const { t } = useTranslation(messages);
  if (settings.status === "ready" || settings.status === "loading") {
    return <Editor key={settings.status} settings={settings} theme={theme} />;
  }

  return (
    <SettingsSection title={t("promptSection")}>
      <SettingsCard>
        <SettingsAction
          label={t("settingsTitle")}
          actionLabel={t("retry")}
          error={t("loadFailed")}
          onPress={settings.reload}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
