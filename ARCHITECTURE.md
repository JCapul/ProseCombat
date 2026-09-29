# Architecture

Notes on how the app is put together, mainly for anyone reading or changing
the code.

- **Local-first.** Documents are plain `.md` files, opened and saved through
  the File System Access API (`src/platform/workspace.ts`). Nothing is
  uploaded anywhere except the critique/compare requests sent to the model
  provider. A `.ai-editor/` folder next to each document holds sidecar
  comment and revision metadata as JSON. It is never embedded in the
  Markdown itself.
- **Folder-first "Open".** The File System Access API has no way to get a
  file's parent directory from a file handle alone. "Open" asks for the
  containing project folder once (`showDirectoryPicker`) and remembers it
  across reloads (`src/platform/idb.ts`). That folder access is what makes
  the `.ai-editor/` sidecar reachable.
- **Provider abstraction.** `providers/LLMProvider.ts` defines the interface
  every AI provider implements. `providers/anthropic/` is the only one wired
  up today, imported only from that folder and `src/platform/llm.ts`.
- **Minimal-diff saving.** `src/editor/blockTracking/` tracks which
  top-level blocks were actually edited in a session, so saving splices
  untouched blocks back in byte-identical instead of reformatting the whole
  file.
- **Fresh-context revision comparison.** `AnthropicProvider.compare()`'s
  method signature takes no history or session parameter at all. "Evaluate
  revision" cannot reuse prior conversation state, by construction, not by
  convention.
