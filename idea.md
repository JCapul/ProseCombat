# Product Brief — Local-First AI Essay Editor

## 1. Product idea

Build a **beautiful, distraction-free WYSIWYG editor for local Markdown files**, optimized for essays and long-form nonfiction.

The editor should combine:

- the calm writing experience of Obsidian/iA Writer/Typora,
- the local-file ownership model of Markdown,
- critique-only AI similar to Margin/APODICTIC,
- and a fresh-context revision comparison workflow inspired by Thomas Ptacek’s “How to Write With an LLM” method.

The core principle is:

> The human writes the prose. The AI identifies problems, asks questions, and evaluates revisions. It does not write the essay.

This constraint should be reflected in the product architecture, not merely in the default prompt.

---

## 2. Primary user

A writer producing essays, articles, technical writing, research notes, or argumentative nonfiction who wants AI editorial help without outsourcing authorship.

The user should be able to:

1. open a local `.md` file,
2. write naturally in a polished rich-text interface,
3. request targeted critique,
4. see comments attached to specific passages,
5. revise the text themselves,
6. ask a fresh model to evaluate whether the revision solved the original issue.

---

## 3. Core product principles

### Local first

Documents are ordinary Markdown files on disk.

No proprietary document format should be required.

The application may maintain sidecar metadata, preferably in a hidden project directory such as:

```text
essay.md
.ai-editor/
  essay.comments.json
  essay.revisions.json
```

The Markdown file must remain readable and editable by any other Markdown editor.

### WYSIWYG, not source-first

The main writing surface should look and behave like a normal document editor.

Markdown syntax should normally be hidden.

Examples:

- `# Heading` renders as a heading.
- `**bold**` renders as bold.
- links render naturally.
- blockquotes, lists, footnotes, code, etc. render visually.

Provide an optional source mode, but it should not be the primary interface.

### AI cannot silently modify prose

AI responses must never directly alter document text.

The system should expose AI functionality through structured operations such as:

```ts
Critique[]
ComparisonResult
Question[]
```

rather than free-form generated replacements.

Do not implement an AI “accept suggestion” workflow that inserts generated prose.

### Minimal interface

The product should feel like a writing application, not an IDE or chatbot.

Avoid:

- permanent AI chat panels,
- prompt boxes everywhere,
- dashboards,
- assistant avatars,
- excessive toolbar controls.

The document should dominate the screen.

---

# 4. Main interface

Use a three-layer layout.

```text
┌─────────────────────────────────────────────┐
│                 document                    │
│                                             │
│   Writing surface                           │
│                                             │
│   Selected or commented text ──────── ●     │
│                                     margin  │
│                                     comment │
│                                             │
└─────────────────────────────────────────────┘
```

The default screen should show only:

- document title,
- document body,
- subtle formatting controls,
- optional margin comments.

AI controls can appear through:

- command palette,
- keyboard shortcut,
- selection context menu,
- small toolbar button.

Example command palette:

```text
Critique document
Critique selection
Critique argument
Critique structure
Critique prose
Fresh-reader review
Compare revision
```

---

# 5. AI critique workflow

The user writes normally.

Then they invoke:

```text
Critique document
```

The AI receives the document plus an editorial brief.

The model must return structured comments.

Example:

```json
{
  "comments": [
    {
      "start": 382,
      "end": 517,
      "category": "argument",
      "severity": "medium",
      "comment": "This paragraph introduces a causal claim without establishing the mechanism connecting the two observations."
    }
  ]
}
```

Comments should be anchored to ranges in the document.

Display them in the margin.

Do not allow comments such as:

> Rewrite this as: “...”

The model should instead explain the problem.

Preferred comment:

> The sentence contains three distinct claims, which makes the causal relationship difficult to follow.

---

# 6. Critique modes

Provide several predefined editorial lenses.

## General critique

Look for:

- unclear reasoning,
- weak transitions,
- unnecessary repetition,
- vague claims,
- confusing prose,
- unsupported assertions.

## Argument critique

Focus on:

- thesis clarity,
- assumptions,
- missing warrants,
- evidence quality,
- counterarguments,
- scope drift,
- causal reasoning.

## Structure critique

Focus on:

- ordering,
- paragraph purpose,
- section boundaries,
- narrative progression,
- redundancy.

## Prose critique

Focus on:

- clarity,
- rhythm,
- excessive abstraction,
- nominalizations,
- verbosity,
- ambiguity,
- sentence complexity.

The model must identify problems, not rewrite sentences.

---

# 7. Revision workflow

Every critique should capture an immutable snapshot of the relevant text.

Example:

```text
Critique #14

Original passage:
"The rapid adoption of..."

Comment:
"This paragraph asserts adoption caused productivity growth,
but the evidence only demonstrates correlation."
```

The writer edits the current document normally.

The comment remains attached if possible.

When the writer believes the issue is resolved, they can choose:

```text
Evaluate revision
```

---

# 8. Fresh-model revision comparison

This is a core differentiator.

When evaluating a revision, create a **new inference context with no previous conversation history**.

Send:

```text
Original passage
Original critique
Revised passage
```

Ask the model:

1. Did the revision address the identified problem?
2. Did it introduce any new problem?
3. Is the original critique still relevant?

Return something like:

```json
{
  "resolved": true,
  "explanation": "The revised paragraph now distinguishes correlation from causation and provides the missing mechanism.",
  "new_issues": []
}
```

Possible UI:

```text
✓ Issue resolved

The revision now explains the proposed mechanism rather
than inferring causation directly from the observed correlation.
```

No praise, encouragement, or generic positive feedback.

The goal is editorial judgment, not motivation.

---

# 9. Model architecture

Use a provider abstraction.

```ts
interface LLMProvider {
  critique(input: CritiqueInput): Promise<CritiqueResult>
  compare(input: ComparisonInput): Promise<ComparisonResult>
}
```

Initial providers could include:

- OpenAI
- Anthropic
- Gemini
- OpenAI-compatible APIs
- Ollama

API keys should be stored locally using the operating system credential store.

No document contents should be uploaded anywhere other than the chosen model provider.

---

# 10. Prompt constraints

System prompts should enforce a strict editorial role.

Example:

```text
You are an editor, not a ghostwriter.

Your job is to identify problems in the author's writing.

Never provide replacement prose.
Never rewrite sentences.
Never offer alternative wording.

Explain what is wrong and why.

The author must decide how to fix it.

Avoid praise, encouragement, or motivational language.
Focus only on information that helps improve the text.
```

Structured output should be validated before display.

Reject responses containing large replacement passages.

---

# 11. Markdown requirements

Support at minimum:

- headings,
- paragraphs,
- bold,
- italics,
- links,
- blockquotes,
- ordered/unordered lists,
- code blocks,
- inline code,
- footnotes,
- horizontal rules.

Preserve Markdown formatting reliably when editing.

Opening and saving a Markdown file should ideally produce minimal diffs.

Avoid unnecessary reformatting of untouched content.

---

# 12. Editor technology

A reasonable implementation stack would be:

```text
Tauri
  +
React
  +
ProseMirror / TipTap
  +
Rust filesystem layer
```

Preferred editor engine:

**ProseMirror / TipTap**

because it provides:

- rich text editing,
- document schema,
- selections,
- decorations,
- comments,
- custom extensions,
- Markdown parsing/serialization.

Tauri is preferable to Electron if implementation complexity remains reasonable because the application should feel lightweight.

Electron is acceptable for a first implementation if it significantly accelerates development.

---

# 13. Comment anchoring

Comments must survive edits reasonably well.

Do not rely exclusively on absolute character offsets.

Store contextual anchors such as:

```json
{
  "selectedText": "the original sentence",
  "prefix": "text immediately before",
  "suffix": "text immediately after"
}
```

When reopening or after edits:

1. try exact position,
2. search for selected text,
3. use prefix/suffix fuzzy matching,
4. mark the comment detached if no reliable match exists.

Detached comments should still remain accessible.

---

# 14. File model

Users should be able to:

```text
Open file
Open folder
New Markdown file
Save
Save as
Rename
```

No mandatory workspace abstraction.

A folder can optionally become a project, enabling:

```text
notes/
essay.md
sources.md
drafts/
```

but plain standalone Markdown files must work perfectly.

---

# 15. Distraction-free writing

Provide a writing/focus mode.

In focus mode:

- hide file browser,
- hide AI controls,
- hide comments,
- hide formatting toolbar,
- center text column,
- use comfortable typography,
- maximize whitespace.

Keyboard shortcut example:

```text
Cmd/Ctrl + Shift + F
```

Optional preferences:

- font family,
- font size,
- line height,
- text width,
- light/dark/system theme.

Do not turn typography configuration into a design system.

---

# 16. Important non-goals

The initial product should not become:

- Notion,
- Obsidian,
- Scrivener,
- a research database,
- an AI chat client,
- a knowledge graph,
- a publishing platform,
- a collaborative document editor.

Avoid:

- backlinks,
- graph view,
- databases,
- canvas,
- plugins,
- collaboration,
- cloud sync.

Those can be reconsidered later.

---

# 17. MVP

The first useful version should include only:

### Editor

- open/save local Markdown,
- excellent WYSIWYG Markdown editing,
- distraction-free mode.

### AI

- critique whole document,
- critique selection,
- critique modes,
- inline/margin comments.

### Revision

- preserve critique snapshot,
- manually revise,
- fresh-context comparison.

### Settings

- choose model provider,
- configure API key,
- choose model.

That is enough to validate the product.

---

# 18. UX benchmark

The target feeling should be:

```text
Typora / iA Writer
        +
Margin-style comments
        +
APODICTIC editorial constraints
        +
Ptacek-style revision comparison
```

The AI should feel less like a co-author and more like an invisible editor who appears only when asked.

The user should spend most of their time looking at their own writing.

---

# 19. Product success criterion

The product succeeds if the user can write an entire essay while never seeing a single sentence written for them by the AI, yet still receives substantial help improving:

- argument,
- structure,
- clarity,
- precision,
- and revision quality.

The final prose should remain recognizably and demonstrably the author's.
