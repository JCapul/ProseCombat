import type { LLMProvider } from '@shared/types/llmProvider'
import { filterCritiqueComments } from '@shared/critique/rewriteHeuristic'
import { createProvider } from '@providers/LLMProvider'
import type { CritiqueRequest, CritiqueResponse, CompareRequest, CompareResponse } from '@shared/types/platformContract'
import '@providers/anthropic'
import { getApiKey } from './credentials'
import { getSettings } from './settings'

function buildProvider(): LLMProvider {
  const settings = getSettings()
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('No API key configured. Open Settings and add a provider API key first.')
  }
  return createProvider({ settings, apiKey })
}

export async function critique(input: CritiqueRequest): Promise<CritiqueResponse> {
  const provider = buildProvider()
  const result = await provider.critique(input)
  const { accepted, withheld } = filterCritiqueComments(result.comments, input.documentText)
  if (withheld.length > 0) {
    console.warn(`Withheld ${withheld.length} critique comment(s) that looked like smuggled rewrites.`)
  }
  return { comments: accepted, withheldCount: withheld.length }
}

export async function compare(input: CompareRequest): Promise<CompareResponse> {
  const provider = buildProvider()
  return provider.compare(input)
}
