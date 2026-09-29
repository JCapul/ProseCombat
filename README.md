# ProseCombat

**[Try it live →](https://jcapul.github.io/ProseCombat/)** (Chrome or Edge — needs a
local folder to open and your own Anthropic API key)

A distraction-free, local-first Markdown editor for essays and long-form
nonfiction — with an AI editor built in that isn't allowed to write a single
word of your prose.

## What it is

ProseCombat looks and feels like a normal writing app: a calm WYSIWYG
document surface (headings render as headings, `**bold**` renders as bold —
no Markdown syntax cluttering the page), a full-screen focus mode, and
nothing else competing for attention. Documents are ordinary `.md` files on
your own disk. There's no account, no cloud sync, no proprietary format —
open a folder, and the app works with the real files in it, entirely in your
browser, saving straight back to disk.

The one thing it adds is an AI editor you summon on demand. It never runs in
the background, never autocompletes, never suggests as you type.

## Why

Most "AI writing" tools quietly slide from *editor* into *ghostwriter*: one
click and your sentence becomes the model's sentence. ProseCombat is built
around a stricter rule, borrowed from Thomas Ptacek's essay "How to Write
With an LLM" and from Margin/APODICTIC-style editorial tools:

> The human writes the prose. The AI identifies problems, asks questions,
> and evaluates revisions. It does not write the essay.

That's not just a line in a system prompt — it's the architecture. The
critique response schema has no field for replacement text, only
`{ start, end, category, severity, comment }`
([`shared/types/llmProvider.ts`](shared/types/llmProvider.ts)); a comment
that reads like a smuggled rewrite gets filtered out before it ever reaches
you ([`shared/critique/rewriteHeuristic.ts`](shared/critique/rewriteHeuristic.ts)).
There's no "accept suggestion" button, because there's nothing generated to
accept — critique modes (general, argument, structure, prose) only ever
return comments explaining *what's wrong and why*, anchored to the exact
passage they're about.

The second piece is what happens after you revise. "Evaluate revision"
sends your original passage, the original comment, and your new passage to
a **brand-new model context with no memory of the conversation that
produced the critique** — so the model isn't rubber-stamping its own earlier
opinion, it's judging the revision cold, the way a second reader would.
`AnthropicProvider.compare()`'s method signature has no history parameter
at all; that's a structural guarantee, not a convention that a future change
could quietly erode.

The result is meant to feel like working with a sharp, silent editor: one
who reads your draft, tells you exactly what's wrong with it, and leaves
every word of the rewrite to you.

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
