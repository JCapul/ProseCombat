import type Anthropic from '@anthropic-ai/sdk'

// Tool-use JSON schemas mirroring shared/types/llmProvider.ts's zod schemas. Kept as plain
// JSON Schema (not derived from zod at runtime) since Anthropic's tool schema format is a
// constrained subset of JSON Schema — the zod schemas remain the source of truth for
// *validating* the response we get back (see critiqueValidation.ts / AnthropicProvider.ts).

export const submitCritiqueTool: Anthropic.Tool = {
  name: 'submit_critique',
  description: 'Submit the structured list of editorial comments found in the passage.',
  // Without this, the `enum` constraints below are only hints to the model, not
  // enforced — it can (and did, in testing) return a category outside the four
  // listed values, which then fails our own zod validation and drops the whole
  // response. `strict: true` makes Anthropic actually validate the arguments
  // against this schema before returning them.
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      comments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            start: { type: 'integer', description: 'Start character offset of the flagged span.' },
            end: { type: 'integer', description: 'End character offset of the flagged span.' },
            category: { type: 'string', enum: ['general', 'argument', 'structure', 'prose'] },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            comment: {
              type: 'string',
              description:
                'Describes the problem or asks a question. Must never contain a proposed replacement sentence or rewritten passage.'
            }
          },
          required: ['start', 'end', 'category', 'severity', 'comment'],
          additionalProperties: false
        }
      }
    },
    required: ['comments'],
    additionalProperties: false
  }
}

export const submitComparisonTool: Anthropic.Tool = {
  name: 'submit_comparison',
  description: 'Submit the structured evaluation of whether a revision resolved the original issue.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      resolved: { type: 'boolean' },
      explanation: { type: 'string' },
      newIssues: { type: 'array', items: { type: 'string' } }
    },
    required: ['resolved', 'explanation', 'newIssues'],
    additionalProperties: false
  }
}
