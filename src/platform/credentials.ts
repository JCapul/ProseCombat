/** Plaintext localStorage — there is no OS keychain reachable from a browser page. The
 *  threat model here is "your own key in your own browser profile," not a shared secret;
 *  Settings tells the user this plainly. */

const STORAGE_KEY = 'prosecombat.apiKey'

export function hasApiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function setApiKey(plaintext: string): void {
  localStorage.setItem(STORAGE_KEY, plaintext)
}

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
