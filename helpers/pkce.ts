/**
 * PKCE (Proof Key for Code Exchange) helper utilities for OAuth flow
 */

const STORAGE_KEY = "pkce_verifier";

// Type guard for browser API
declare const browser: typeof chrome | undefined;

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
    // Try session storage first (available in Chrome 102+ and Firefox)
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      await chrome.storage.session.set({ [STORAGE_KEY]: verifier });
      return;
    }
    if (typeof browser !== 'undefined' && (browser as any).storage?.session) {
      await (browser as any).storage.session.set({ [STORAGE_KEY]: verifier });
      return;
    }
  } catch (e) {
    // Fallback to local storage
  }
  
  // Fallback to local storage
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: verifier });
  } else if (typeof browser !== 'undefined' && (browser as any).storage?.local) {
    await (browser as any).storage.local.set({ [STORAGE_KEY]: verifier });
  }
}

/**
 * Retrieves and removes the PKCE verifier from storage
 */
export async function consumePkceVerifier(): Promise<string | null> {
  let verifier: string | null = null;
  
  try {
    // Try session storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      const result = await chrome.storage.session.get(STORAGE_KEY);
      verifier = result[STORAGE_KEY] || null;
      if (verifier) {
        await chrome.storage.session.remove(STORAGE_KEY);
        return verifier;
      }
    }
    if (typeof browser !== 'undefined' && (browser as any).storage?.session) {
      const result = await (browser as any).storage.session.get(STORAGE_KEY);
      verifier = result[STORAGE_KEY] || null;
      if (verifier) {
        await (browser as any).storage.session.remove(STORAGE_KEY);
        return verifier;
      }
    }
  } catch (e) {
    // Try local storage as fallback
  }
  
  // Try local storage
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    verifier = result[STORAGE_KEY] || null;
    if (verifier) {
      await chrome.storage.local.remove(STORAGE_KEY);
    }
  } else if (typeof browser !== 'undefined' && (browser as any).storage?.local) {
    const result = await (browser as any).storage.local.get(STORAGE_KEY);
    verifier = result[STORAGE_KEY] || null;
    if (verifier) {
      await (browser as any).storage.local.remove(STORAGE_KEY);
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
