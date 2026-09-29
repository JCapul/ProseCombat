import type { CritiqueCategory } from '@shared/types/comments'

export const CRITIQUE_SYSTEM_PROMPT = `You are an editor, not a ghostwriter.

Your job is to identify problems in the author's writing — never provide replacement prose, never rewrite sentences, never offer alternative wording, never show phrasing like "instead, try: ..." or "could read: ...".

Explain what is wrong and why. The author decides how to fix it.

Avoid praise, encouragement, or motivational language. Focus only on information that helps improve the text.

Each comment's "comment" field must describe a problem or ask a question about the passage — it must never contain a proposed replacement sentence or passage, and must never quote a rewritten version of the author's text.

Return your findings only by calling the submit_critique tool.`

const LENS_INSTRUCTIONS: Record<CritiqueCategory, string> = {
  general: `Look for: unclear reasoning, weak transitions, unnecessary repetition, vague claims, confusing prose, unsupported assertions.`,
  argument: `Focus on: thesis clarity, assumptions, missing warrants, evidence quality, counterarguments, scope drift, causal reasoning.`,
  structure: `Focus on: ordering, paragraph purpose, section boundaries, narrative progression, redundancy.`,
  prose: `Focus on: clarity, rhythm, excessive abstraction, nominalizations, verbosity, ambiguity, sentence complexity.`
}

export function critiqueUserPrompt(params: {
  documentText: string
  mode: CritiqueCategory
  isSelection: boolean
}): string {
  const { documentText, mode, isSelection } = params
  return [
    `Critique lens: ${mode}.`,
    LENS_INSTRUCTIONS[mode],
    '',
    isSelection
      ? 'The author has selected the following passage for critique. Character offsets in your response must be relative to the start of this passage (offset 0 = first character shown below).'
      : 'The author has requested a critique of the entire document below. Character offsets in your response must be relative to the start of this document (offset 0 = first character shown below).',
    '',
    '---',
    documentText,
    '---'
  ].join('\n')
}

export const COMPARE_SYSTEM_PROMPT = `You are an editor evaluating whether a specific revision resolved a previously identified problem.

You have no memory of any other conversation about this document — judge only the three passages given to you in this message.

Answer three questions: (1) did the revision address the identified issue, (2) did it introduce any new problems, (3) is the original critique still relevant.

Avoid praise, encouragement, or motivational language. Be terse and specific.

Return your answer only by calling the submit_comparison tool.`

export function compareUserPrompt(params: {
  originalPassage: string
  originalComment: string
  revisedPassage: string
}): string {
  return [
    'Original passage:',
    params.originalPassage,
    '',
    'Original critique:',
    params.originalComment,
    '',
    'Revised passage:',
    params.revisedPassage
  ].join('\n')
}
