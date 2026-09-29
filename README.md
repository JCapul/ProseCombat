# ProseCombat

A local-first, distraction-free WYSIWYG Markdown editor for essays and long-form
nonfiction, with critique-only AI editorial review. The AI identifies problems,
asks questions, and evaluates revisions — it never writes or rewrites your prose.

Built with Electron, React, TipTap/ProseMirror, and the Anthropic API.

## Development

```bash
npm install
npm run dev          # launch the app with hot reload
```

Requires Node 20.19+ or 22.12+ (Vite's minimum) — Node 24 is what this project
is developed and tested against.

### Checks

```bash
npm run typecheck    # main + renderer TypeScript
npm run lint         # eslint
npm test             # vitest unit tests
```

All three run in CI on every tagged release build (see below); a failure there
blocks the release from publishing.

### Icon

The app icon is generated from a single SVG source, not stored as binaries you
hand-edit:

```bash
npm run icons        # build/icon.svg -> build/icon.{ico,icns,png} + build/icons/*.png
```

Edit `build/icon.svg`, then re-run the script and commit the regenerated files.

## Packaging

```bash
npm run dist:dir     # fast: unpacked app only, no installer — good for smoke-testing
npm run dist:win     # Windows installer (NSIS)
npm run dist:mac     # macOS DMG
npm run dist:linux   # Linux AppImage + deb
```

Output lands in `release/` (git-ignored).

## Releasing (Windows)

Releases are built and published by GitHub Actions
(`.github/workflows/release.yml`), not from a local machine. Pushing a version
tag triggers it:

```bash
# 1. Bump the version in package.json to match the tag you're about to push.
npm version 0.1.0 --no-git-tag-version   # or edit package.json by hand
git add package.json package-lock.json
git commit -m "Release v0.1.0"

# 2. Tag and push. The tag name must be "v" + package.json's "version".
git tag v0.1.0
git push origin master v0.1.0
```

The workflow then, on a `windows-latest` runner:

1. Installs dependencies (`npm ci`).
2. Runs `typecheck`, `lint`, and `test` — any failure stops here, nothing is published.
3. Builds the app and runs `electron-builder --win --publish always`.

electron-builder publishes to GitHub Releases as a **draft**
(`build.publish.releaseType` in `package.json`), named after
`package.json`'s `version` — not the git tag directly, so the two must match
or the release will land under an unexpected name. Nothing is visible to
anyone until you open the draft under the repo's *Releases* tab, review the
attached installer, and publish it manually.

To test the pipeline without cutting a real release, use the *Run workflow*
button on the Actions tab (the workflow also listens for `workflow_dispatch`)
— it builds and publishes a draft the same way a tag push would.

## Architecture notes

- **Local-first**: documents are plain `.md` files; a `.ai-editor/` folder
  next to each one holds sidecar comment/revision metadata as JSON — never
  embedded in the Markdown itself.
- **Provider abstraction**: `providers/LLMProvider.ts` defines the interface
  every AI provider implements; `providers/anthropic/` is the only one wired
  up today, imported nowhere outside that folder.
- **Minimal-diff saving**: `src/editor/blockTracking/` tracks which top-level
  blocks were actually edited in a session so saving splices untouched
  blocks back in byte-identical, instead of reformatting the whole file.
- **Fresh-context revision comparison**: `AnthropicProvider.compare()`'s
  signature has no history/session parameter at all — a structural
  guarantee, not just a convention, that "Evaluate revision" never reuses
  prior conversation state.
