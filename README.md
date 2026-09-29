# ProseCombat

A local-first, distraction-free WYSIWYG Markdown editor for essays and long-form
nonfiction, with critique-only AI editorial review. The AI identifies problems,
asks questions, and evaluates revisions — it never writes or rewrites your prose.

Built as a static web app: React, TipTap/ProseMirror, and the Anthropic API,
talking directly to your local files via the browser's File System Access API
(Chromium browsers only — Chrome, Edge, etc.).

## Development

```bash
npm install
npm run dev          # launch the app with hot reload
```

Requires Node 20.19+ or 22.12+ (Vite's minimum) — Node 24 is what this project
is developed and tested against.

### Checks

```bash
npm run typecheck    # TypeScript
npm run lint         # eslint
npm test             # vitest unit tests
```

All three run in CI on every push to `master` (see below); a failure there
blocks the deploy.

## Deploying

`npm run build` produces a static site in `dist/`, published to GitHub Pages
by `.github/workflows/deploy-pages.yml` on every push to `master` (or
manually via the *Run workflow* button on the Actions tab). The repo's
Settings → Pages → Source must be set to "GitHub Actions" — a one-time setup
step, not something the workflow can do for itself.

`vite.config.ts`'s `base` is hardcoded to `/ProseCombat/` to match the
project-page URL (`https://<owner>.github.io/ProseCombat/`); update it if the
repo is ever renamed or moved to a custom domain / user-page root.

There's no build-time secret to manage: each user pastes their own Anthropic
API key into Settings, and it's kept in that browser's `localStorage`,
unencrypted — the threat model is "your own key in your own browser
profile," not a shared secret, since there is no server component at all.

## Architecture notes

- **Local-first**: documents are plain `.md` files, opened and saved through
  the File System Access API (`src/platform/workspace.ts`) — never uploaded
  anywhere. A `.ai-editor/` folder next to each one holds sidecar
  comment/revision metadata as JSON — never embedded in the Markdown itself.
- **Folder-first "Open"**: the File System Access API has no way to get a
  file's parent directory from a file handle alone, so "Open" asks for the
  containing project folder once (`showDirectoryPicker`) and remembers it
  across reloads (`src/platform/idb.ts`) — that folder access is what makes
  the `.ai-editor/` sidecar reachable.
- **Provider abstraction**: `providers/LLMProvider.ts` defines the interface
  every AI provider implements; `providers/anthropic/` is the only one wired
  up today, imported nowhere outside that folder and `src/platform/llm.ts`.
- **Minimal-diff saving**: `src/editor/blockTracking/` tracks which top-level
  blocks were actually edited in a session so saving splices untouched
  blocks back in byte-identical, instead of reformatting the whole file.
- **Fresh-context revision comparison**: `AnthropicProvider.compare()`'s
  signature has no history/session parameter at all — a structural
  guarantee, not just a convention, that "Evaluate revision" never reuses
  prior conversation state.
