import { app, safeStorage } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

function keyFilePath(): string {
  return join(app.getPath('userData'), 'credentials.anthropic.enc')
}

export class CredentialStoreUnavailableError extends Error {
  constructor() {
    super(
      'The OS credential store is unavailable on this system, so the API key cannot be stored securely. ' +
        'On Linux this usually means no secret-service/keyring backend is running.'
    )
    this.name = 'CredentialStoreUnavailableError'
  }
}

export async function hasApiKey(): Promise<boolean> {
  try {
    await fs.access(keyFilePath())
    return true
  } catch {
    return false
  }
}

export async function setApiKey(plaintext: string): Promise<void> {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new CredentialStoreUnavailableError()
  }
  const encrypted = safeStorage.encryptString(plaintext)
  await fs.writeFile(keyFilePath(), encrypted)
}

export async function getApiKey(): Promise<string | null> {
  try {
    const encrypted = await fs.readFile(keyFilePath())
    return safeStorage.decryptString(encrypted)
  } catch {
    return null
  }
}

export async function clearApiKey(): Promise<void> {
  try {
    await fs.unlink(keyFilePath())
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }
}
