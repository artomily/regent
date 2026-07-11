// A user-supplied Venice API key, kept client-side only. Lets Regent run
// live Venice AI decisions even when the ai-agent deployment has no
// VENICE_API_KEY of its own configured.

const STORAGE_KEY = "regent_venice_api_key"

export function getVeniceApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setVeniceApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearVeniceApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
