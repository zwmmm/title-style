# title-style

为 Paseo 会话（workspace）自动生成标题的插件：用设置页里可自定义的提示词调用模型，重命名侧边栏标题。默认生成简体中文标题，不局限于中文。

Paseo 内置的自动命名输出英文且没有全局语言配置。本插件在后台监听新会话的第一个 agent，用「元数据生成」配置的模型生成标题并覆盖，对整个 daemon 全局生效，包括非 git 目录。

## Install

```bash
paseo plugin add zwmmm/title-style
```

需要 Paseo ≥ 0.8.0，并且已开启插件（Settings → Plugins → Enable plugins，或 `~/.paseo/config.json` 中 `"pluginsEnabled": true`）。

## 设置

Settings → Plugins → title-style → 打开「标题生成」，编辑提示词后点「保存」，下个新会话生效。默认提示词：

> 用简体中文生成一个简短的任务型标题（不超过 30 个字）：请求的操作 + 具体对象 + 关键标识符。直接输出标题文本，不要解释、引号或前后缀。

改坏了想恢复默认，把上面的文案粘回去即可。停用插件用插件列表的启停按钮；需要覆盖模型时，编辑 `~/.paseo/plugin-settings/title-style/title-style.json` 里的 `values.model`（`provider/model`，留空跟随 Metadata 模型配置）。

## 工作方式

- 监听 `agent.created`：每个 workspace 的第一个 agent 创建后异步执行一次
- 从首条 prompt 提取素材（最多 600 字符），调用模型返回 `{"title": "…"}`
- 通过 `setTitle` 写入 workspace 标题；Paseo 内置的英文命名结果会被覆盖，且不会反向覆盖本插件的标题
- 生成用的临时 agent 以委托子代理（delegated subagent）身份运行，完成后自动归档，全程静默，不产生应用内或推送通知

## Limitations

- 只重命名新创建的 workspace；已有标题不会被修改
- 用户手动改过的标题会被尊重（创建后 60 秒内的自动改名除外）
- 生成期间会话的第一个 agent 下会短暂出现一个名为「会话标题生成」的子代理，完成后自动归档
- 只处理会话标题；commit message 与 PR 文本的生成不受影响
- 每次生成是一次真实模型调用，按元数据生成所配模型的用量计费
