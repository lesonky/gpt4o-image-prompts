# AI 协作指南

本项目已针对 AI 工具做了结构化改造，按照以下流程可以快速添加新的图片提示词案例，并保持前后端展示与数据集同步。

## 主要文件结构
- `300.md`：收录 **334-201** 号案例（最新内容持续追加在这里）。
- `200.md`、`100.md`：早期案例分册。
- `scripts/generate-dataset.js`：将所有编号 Markdown 扫描为 `data/prompts.json`。
- `scripts/fetch-x-case.js` / `scripts/x-utils.js`：从 X/Twitter 帖子解析提示词、作者与图片链接。
- `images/`：案例示例图，命名格式与案例编号保持一致，例如 `334-1.jpg`。

## 添加新案例流程
1. **解析 X/Twitter 帖子**
   ```bash
   node scripts/fetch-x-case.js <贴文链接>
   ```
   - 复制输出中的 `promptText`、作者信息和高清图片地址。
2. **下载图片**
   ```bash
   curl -L "<media_url>?name=4096x4096" -o images/<编号>-<序号>.jpg
   ```
   - 按数字编号命名，序号从 1 开始。
3. **更新 Markdown**
   - 在 `300.md` 顶部目录中增加新的案例条目（保持从大到小排序）。
   - 追加完整案例段落，包含：
     - `<a id="prompt-XXX"></a>` 锚点。
     - 案例标题与来源链接。
     - `<div>` 包裹的图片列表。
     - 中英提示词或补充说明。
   - 若编号超过当前文件上限，可新建 `400.md` 并在 `README.md` 的「案例索引」里补充链接。
4. **生成数据集**
   ```bash
   node scripts/generate-dataset.js
   ```
   - 脚本会自动解析所有 `*.md`（仅包含数字命名）文件并生成 `data/prompts.json`。
5. **快捷验证**
   - 通过 `assets/app.js` 对应的前端页面（`index.html`）进行本地预览，确认新案例展示正常。
   - 运行 `git status` 确认只有相关文件发生变更。

## 注意事项
- 保持 Markdown 内图片引用使用相对路径，例如 `./images/334-1.jpg`。
- 英文与中文提示词尽量成对出现，便于检索与多语言使用。
- 添加示例图或提示文本时，避免引入非 ASCII 字符（除非原文包含）。
- 新案例默认放在 `300.md` 顶部，以便画廊页面按编号倒序展示最新内容。
- 提交前务必重新生成 `data/prompts.json`，确保前端画廊与数据一致。

祝你创作愉快，也欢迎继续扩展脚本或风格标签，帮助更多创作者快速上手 GPT‑4o 图片提示词！💡

