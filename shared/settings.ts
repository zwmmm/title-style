import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

export const DEFAULT_INSTRUCTIONS =
  "用简体中文生成一个简短的任务型标题（不超过 30 个字）：请求的操作 + 具体对象 + 关键标识符。直接输出标题文本，不要解释、引号或前后缀。";

export const titleStyleSettings = defineSettings({
  id: "title-style",
  scope: "host",
  version: 1,
  schema: z.object({
    enabled: z.boolean().default(true),
    instructions: z.string().trim().min(1).default(DEFAULT_INSTRUCTIONS),
    model: z
      .string()
      .trim()
      .default(""),
  }),
});

export type TitleStyleSettings = z.output<typeof titleStyleSettings.schema>;
