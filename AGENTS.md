# Repository Guidelines

## Project Structure & Module Organization
- `100.md`, `200.md`, and `300.md` hold the prompt case source; append new cases to the highest-numbered file and keep `<a id="prompt-…">` anchors in sync.
- `assets/` ships the static gallery UI that powers `index.html`; edit styles and scripts there.
- `scripts/` houses Node.js tooling (dataset generator, X importer) written in CommonJS modules.
- `data/prompts.json` is generated output—never hand-edit—and `images/` stores shared reference art.
- `AI_HELP.md` is the AI collaboration guide; refer to it for adding new cases and using the scripts.

## Build, Test, and Development Commands
- `node scripts/generate-dataset.js` rebuilds `data/prompts.json` from the markdown sources; run after any content change.
- `node scripts/fetch-x-case.js <x-url>` pulls prompt text and media URLs from X/Twitter to seed a new case.
- `python3 -m http.server 8000` (run from the repo root) serves `index.html` for local gallery QA.
- `npm install node-fetch` is only needed on Node <18; prefer the zero-dependency flow on Node 18+.

## Coding Style & Naming Conventions
- Target Node.js 18+ features and keep scripts in CommonJS with `require`/`module.exports`.
- Use 2-space indentation, single quotes in JavaScript, and prefer `const`/`let`; avoid mutating globals.
- Markdown case headings follow `## 案例 <id>：<标题>` with optional `(来源 [Label](URL))` metadata lines.
- Reference assets with repo-relative paths (e.g., `./images/wechat.jpg`) so the gallery resolves them correctly.
- Let the generator format JSON with two-space indentation; do not prettify manually.

## Testing Guidelines
- No automated tests yet; the dataset generator doubling as a parser sanity check is the primary validation.
- After regeneration, review the diff in `data/prompts.json` to confirm IDs, tags, and image arrays make sense.
- Open the gallery locally to verify new cards, tag filters, and image links render as expected.
- When importing from X, skim the CLI output for stray tracking URLs or truncated prompt text before committing.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit prefixes used in history (`feat:`, `chore:`, `fix:`) and keep scope concise.
- Include regenerated `data/prompts.json` alongside markdown edits and related assets in the same commit.
- PRs should summarise user-facing changes, list updated markdown files, and attach gallery screenshots when visuals shift.
- Link supporting issues or discussions and call out manual follow-up steps (e.g., “rerun dataset generator”) in the PR description.
