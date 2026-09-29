import { ipcMain } from 'electron'
import type { CritiqueRequest, CritiqueResponse, CompareRequest, CompareResponse } from '@shared/types/ipcContract'
import type { LLMProvider } from '@shared/types/llmProvider'
import { filterCritiqueComments } from '@shared/critique/rewriteHeuristic'
import { createProvider } from '@providers/LLMProvider'
import { getApiKey } from '../lib/credentialStore'
import { getSettings } from '../lib/settingsStore'
import '@providers/anthropic'

async function buildProvider(): Promise<LLMProvider> {
  const settings = getSettings()
  const apiKey = await getApiKey()
  if (!apiKey) {
    throw new Error('No API key configured. Open Settings and add a provider API key first.')
  }
  return createProvider({ settings, apiKey })
}

export function registerLlmHandlers(): void {
  ipcMain.handle('llm:critique', async (_e, input: CritiqueRequest): Promise<CritiqueResponse> => {
    const provider = await buildProvider()
    const result = await provider.critique(input)
    const { accepted, withheld } = filterCritiqueComments(result.comments, input.documentText)
    if (withheld.length > 0) {
      console.warn(`Withheld ${withheld.length} critique comment(s) that looked like smuggled rewrites.`)
    }
    return { comments: accepted, withheldCount: withheld.length }
  })

  ipcMain.handle('llm:compare', async (_e, input: CompareRequest): Promise<CompareResponse> => {
    const provider = await buildProvider()
    return provider.compare(input)
  })
}
