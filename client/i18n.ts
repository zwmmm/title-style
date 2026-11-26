import { defineTranslations } from "@getpaseo/plugin/client";

export const messages = defineTranslations({
  resources: {
    en: {
      settingsTitle: "Settings",
      promptSection: "Title generation",
      promptLabel: "Prompt",
      promptHint: "Controls the language and style of generated titles.",
      modelLabel: "Model override",
      modelHint: "Leave empty to use the metadata model.",
      modelPlaceholder: "e.g. anthropic/claude-haiku-4-5",
      loading: "Loading…",
      retry: "Retry",
      loadFailed: "Could not load the settings. Try again.",
      saveFailed: "Could not save the settings.",
    },
    "zh-CN": {
      settingsTitle: "设置",
      promptSection: "标题生成",
      promptLabel: "提示词",
      promptHint: "决定生成标题的语言和风格。",
      modelLabel: "模型覆盖",
      modelHint: "留空时使用元数据生成模型。",
      modelPlaceholder: "例如 anthropic/claude-haiku-4-5",
      loading: "正在加载…",
      retry: "重试",
      loadFailed: "无法读取设置，请重试。",
      saveFailed: "无法保存设置。",
    },
  },
});
