/**
 * PKCE (Proof Key for Code Exchange) helper utilities for OAuth flow
 */

const STORAGE_KEY = "pkce_verifier";

type AsyncStorageArea = {
  get(key: string): Promise<Record<string, string | undefined> | undefined>
  set(items: Record<string, string>): Promise<void>
  remove(key: string): Promise<void>
}

function getSessionStorage():
  | { area: AsyncStorageArea; label: string }
  | undefined {
  if (process.env.PLASMO_BROWSER === "firefox" && browser.storage?.session) {
    return {
      area: browser.storage.session,
      label: "browser.storage.session"
    }
  }

  if (chrome.storage?.session) {
    return {
      area: chrome.storage.session as AsyncStorageArea,
      label: "chrome.storage.session"
    }
  }
}

function getLocalStorage():
  | { area: AsyncStorageArea; label: string }
  | undefined {
  if (process.env.PLASMO_BROWSER === "firefox" && browser.storage?.local) {
    return {
      area: browser.storage.local,
      label: "browser.storage.local"
    }
  }

  if (chrome.storage?.local) {
    return {
      area: chrome.storage.local as AsyncStorageArea,
      label: "chrome.storage.local"
    }
  }
}

/**
 * Generates a cryptographically random code verifier (43-128 characters)
 * using base64url encoding as per RFC 7636
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32); // 32 bytes = 43 chars in base64url
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generates a code challenge from the verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Stores the PKCE verifier, preferring session storage with fallback to local storage
 */
export async function storePkceVerifier(verifier: string): Promise<void> {
  try {
    const sessionStorage = getSessionStorage()
    if (sessionStorage) {
      await sessionStorage.area.set({ [STORAGE_KEY]: verifier })
      return
    }
  } catch {
  }
  
  const localStorage = getLocalStorage()
  if (localStorage) {
    await localStorage.area.set({ [STORAGE_KEY]: verifier })
  }
}

/**
 * Retrieves and removes the PKCE verifier from storage
 */
export async function consumePkceVerifier(): Promise<string | null> {
  let verifier: string | null = null;
  
  try {
    const sessionStorage = getSessionStorage()
    if (sessionStorage) {
      const result = await sessionStorage.area.get(STORAGE_KEY)
      verifier = result?.[STORAGE_KEY] ?? null
      if (verifier) {
        await sessionStorage.area.remove(STORAGE_KEY)
        return verifier
      }
    }
  } catch {
  }
  
  const localStorage = getLocalStorage()
  if (localStorage) {
    const result = await localStorage.area.get(STORAGE_KEY)
    verifier = result?.[STORAGE_KEY] ?? null
    if (verifier) {
      await localStorage.area.remove(STORAGE_KEY)
    }
  }
  
  return verifier;
}

/**
 * Base64URL encodes a Uint8Array (without padding)
 */
function base64UrlEncode(array: Uint8Array): string {
  // Convert Uint8Array to regular array to avoid iteration issues
  const bytes = Array.from(array);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
