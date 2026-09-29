# <img src="public/favicon.svg" width="32" height="32" valign="bottom" /> ProseCombat

**[Try it live](https://jcapul.github.io/ProseCombat/)** (Chrome or Edge; needs
a local folder and your own Anthropic API key)

A distraction-free, local-first Markdown editor for essays and long-form
nonfiction. The AI critiques your writing; it never rewrites it.

## Features

- WYSIWYG Markdown editing, no syntax clutter, full-screen focus mode
- Local-first: plain `.md` files on your own disk, no account, no cloud sync
- On-demand AI critique across four lenses: general, argument, structure, prose
- Critique-only by design: comments explain what's wrong, never a rewrite
- "Evaluate revision": a fresh, history-free model judges whether your edit
  actually fixed the issue

## Why

Most "AI writing" tools slide from editor into ghostwriter. ProseCombat
follows a stricter rule, taken from Thomas Ptacek's
[How to Write With an LLM](https://sockpuppet.org/blog/2026/09/17/how-to-write-with-an-llm/):

> The human writes the prose. The AI identifies problems, asks questions,
> and evaluates revisions. It does not write the essay.

This is enforced in the code, not only in the system prompt: the critique
schema has no field for replacement text, a heuristic filters out comments
that read like smuggled rewrites, and there is no "accept suggestion"
button.

## Your API key

The app calls Anthropic's API directly from your browser, so there's no
backend and no build-time secret, but the usual browser caveats apply:

- Stored in `localStorage`, unencrypted; anyone with access to this browser
  profile can read it
- Never leaves your machine except in requests to `api.anthropic.com`
- Avoid shared or public computers, or use a spending-limited key from the
  Anthropic Console instead of your main one

## Development

```bash
npm install
npm run dev          # hot reload
npm run typecheck && npm run lint && npm test
```

Requires Node 20.19+ or 22.12+ (Node 24 is what CI uses).

## Deploying

`npm run build` outputs a static site to `dist/`, published to GitHub Pages
by `.github/workflows/deploy-pages.yml` on every push to `master`. Requires
Settings → Pages → Source set to "GitHub Actions" (one-time, manual).

`vite.config.ts`'s `base` is hardcoded to `/ProseCombat/` to match the
project-page URL; update it if the repo is ever renamed.

---

Yes, this README was written with AI. It's a README, that's fine 😄
