// Pure interface + factory boundary. No provider SDK (e.g. @anthropic-ai/sdk) may be
// imported from this file — that keeps every call site (IPC handlers, future provider
// implementations) decoupled from any specific vendor's client library.
export type {
  LLMProvider,
  CritiqueInput,
  CritiqueResult,
  CritiqueComment,
  ComparisonInput,
  ComparisonResult,
  ProviderId
} from '@shared/types/llmProvider'

import type { LLMProvider, ProviderId } from '@shared/types/llmProvider'
import type { AppSettings } from '@shared/types/platformContract'

export interface ProviderFactoryContext {
  settings: AppSettings
  apiKey: string
}

const factories: Partial<Record<ProviderId, (ctx: ProviderFactoryContext) => LLMProvider>> = {}

export function registerProviderFactory(
  id: ProviderId,
  factory: (ctx: ProviderFactoryContext) => LLMProvider
): void {
  factories[id] = factory
}

export function createProvider(ctx: ProviderFactoryContext): LLMProvider {
  const factory = factories[ctx.settings.provider]
  if (!factory) {
    throw new Error(`No LLM provider registered for id "${ctx.settings.provider}"`)
  }
  return factory(ctx)
}
