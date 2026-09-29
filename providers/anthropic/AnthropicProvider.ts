import Anthropic from '@anthropic-ai/sdk'
import {
  CritiqueResultSchema,
  ComparisonResultSchema,
  type CritiqueInput,
  type CritiqueResult,
  type ComparisonInput,
  type ComparisonResult,
  type LLMProvider
} from '@shared/types/llmProvider'
import { submitCritiqueTool, submitComparisonTool } from './schemas'
import {
  CRITIQUE_SYSTEM_PROMPT,
  COMPARE_SYSTEM_PROMPT,
  critiqueUserPrompt,
  compareUserPrompt
} from './prompts'

export interface AnthropicProviderOptions {
  apiKey: string
  model: string
}

function extractToolInput(message: Anthropic.Message, toolName: string): unknown {
  const block = message.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === toolName
  )
  if (!block) {
    throw new Error(`Anthropic response did not call the expected "${toolName}" tool.`)
  }
  return block.input
}

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic'
  private client: Anthropic
  private model: string

  constructor(options: AnthropicProviderOptions) {
    // Safe here: this class only ever runs in the browser (there is no Node main process
    // anymore), and the key is the user's own, entered locally into their own browser.
    this.client = new Anthropic({ apiKey: options.apiKey, dangerouslyAllowBrowser: true })
    this.model = options.model
  }

  async critique(input: CritiqueInput): Promise<CritiqueResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: CRITIQUE_SYSTEM_PROMPT,
      tools: [submitCritiqueTool],
      // 'auto' rather than forcing this specific tool: forced tool_choice is
      // rejected outright on some newer models (e.g. Opus 5.5), and the system
      // prompt above already explicitly instructs the model to call this tool.
      tool_choice: { type: 'auto' },
      messages: [
        {
          role: 'user',
          content: critiqueUserPrompt({
            documentText: input.documentText,
            mode: input.mode,
            isSelection: input.selectionRange !== undefined
          })
        }
      ]
    })

    const rawInput = extractToolInput(message, submitCritiqueTool.name)
    const parsed = CritiqueResultSchema.safeParse(rawInput)
    if (!parsed.success) {
      throw new Error(`Anthropic critique response failed schema validation: ${parsed.error.message}`)
    }
    return parsed.data
  }

  /**
   * Fresh-context comparison (idea.md §8). This method's signature — and this class's —
   * accepts nothing but the three text inputs below: no conversation id, no prior
   * messages array. Every call below constructs a brand-new `messages.create` request
   * containing exactly one user turn, so there is no way for this method to reuse or be
   * threaded with any other conversation's history.
   */
  async compare(input: ComparisonInput): Promise<ComparisonResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: COMPARE_SYSTEM_PROMPT,
      tools: [submitComparisonTool],
      tool_choice: { type: 'auto' },
      messages: [
        {
          role: 'user',
          content: compareUserPrompt(input)
        }
      ]
    })

    const rawInput = extractToolInput(message, submitComparisonTool.name)
    const parsed = ComparisonResultSchema.safeParse(rawInput)
    if (!parsed.success) {
      throw new Error(`Anthropic comparison response failed schema validation: ${parsed.error.message}`)
    }
    return parsed.data
  }
}
