import { registerProviderFactory } from '../LLMProvider'
import { AnthropicProvider } from './AnthropicProvider'

registerProviderFactory('anthropic', (ctx) => new AnthropicProvider({ apiKey: ctx.apiKey, model: ctx.settings.model }))
