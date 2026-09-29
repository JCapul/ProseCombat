# ProseCombat

**[Try it live](https://jcapul.github.io/ProseCombat/)** (Chrome or Edge; needs
a local folder and your own Anthropic API key)

A distraction-free, local-first Markdown editor for essays and long-form
nonfiction, with an AI editor built in that is not allowed to write your
prose for you.

## What it is

ProseCombat looks and feels like a normal writing app: a calm WYSIWYG
document surface (`# heading` renders as a heading, `**bold**` renders as
bold, no Markdown syntax cluttering the page), plus a full-screen focus
mode. Documents are ordinary `.md` files on your own disk. There is no
account, no cloud sync, no proprietary format. Open a folder and the app
reads and writes the real files in it, straight from your browser.

The one thing it adds is an AI editor you summon on demand. It runs only
when you ask for it. It does not autocomplete, and it does not suggest text
as you type.

## Why

Most "AI writing" tools slide from editor into ghostwriter: one click and
your sentence becomes the model's sentence. ProseCombat follows a stricter
rule, taken from Thomas Ptacek's
[How to Write With an LLM](https://sockpuppet.org/blog/2026/09/17/how-to-write-with-an-llm/)
and from Margin/APODICTIC-style editorial tools:

> The human writes the prose. The AI identifies problems, asks questions,
> and evaluates revisions. It does not write the essay.

This is enforced in the code, not only in the system prompt. The critique
response schema has no field for replacement text, only
`{ start, end, category, severity, comment }`
([`shared/types/llmProvider.ts`](shared/types/llmProvider.ts)). A comment
that reads like a smuggled rewrite gets filtered out before it reaches you
([`shared/critique/rewriteHeuristic.ts`](shared/critique/rewriteHeuristic.ts)).
There is no "accept suggestion" button, because nothing is generated for you
to accept. Critique modes (general, argument, structure, prose) only return
comments explaining what is wrong and why, anchored to the passage they
refer to.

The second piece is what happens after you revise. "Evaluate revision"
sends your original passage, the original comment, and your new passage to
a brand-new model context with no memory of the conversation that produced
the critique. The model judges the revision cold, the way a second reader
would, rather than rubber-stamping its own earlier opinion.
`AnthropicProvider.compare()`'s method signature takes no history parameter
at all, so this is a structural guarantee that a future change cannot
quietly erode.

The goal is an editor who reads your draft, tells you what is wrong with
it, and leaves every word of the rewrite to you.

## Your API key

The app talks to Anthropic's API directly from your browser. There is no
backend server, so there is no build-time secret to manage, but the usual
browser security caveats apply to your key:

- It is stored in `localStorage`, unencrypted. Anyone with access to this
  browser profile can read it.
- It never leaves your machine except in requests to `api.anthropic.com`.
  Nothing is proxied through a server this project controls.
- Don't enter your key on a shared or public computer, and clear it from
  Settings if you ever use one.
- If you'd rather not risk your main key this way, create a separate one in
  the Anthropic Console with its own spending limit.

## Development

```bash
npm install
npm run dev          # launch the app with hot reload
```

Requires Node 20.19+ or 22.12+ (Vite's minimum). Node 24 is what this
project is developed and tested against.

### Checks

```bash
npm run typecheck    # TypeScript
npm run lint         # eslint
npm test             # vitest unit tests
```

All three run in CI on every push to `master` (see below). A failure there
blocks the deploy.

## Deploying

`npm run build` produces a static site in `dist/`, published to GitHub Pages
by `.github/workflows/deploy-pages.yml` on every push to `master` (or
manually via the *Run workflow* button on the Actions tab). The repo's
Settings → Pages → Source must be set to "GitHub Actions". That is a
one-time setup step; the workflow cannot do it for itself.

`vite.config.ts`'s `base` is hardcoded to `/ProseCombat/` to match the
project-page URL (`https://<owner>.github.io/ProseCombat/`). Update it if
the repo is ever renamed or moved to a custom domain or user-page root.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the app is put together: the
File System Access API platform layer, the provider abstraction,
minimal-diff saving, and the fresh-context guarantee described above.
