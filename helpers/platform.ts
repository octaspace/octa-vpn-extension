// Promise-based extension APIs for both browsers: Firefox exposes them as
// `browser.*`, Chrome MV3 returns promises from `chrome.*` when no callback is
// passed. Only the members the extension uses are typed.

type Setting<T> = {
  get(details: object): Promise<{ levelOfControl: string; value: T }>
  set(details: { value: T; scope?: string }): Promise<boolean | void>
  clear(details: { scope?: string }): Promise<boolean | void>
}

type Listener<T> = { addListener(cb: (arg: T) => void): void }

export type AuthDetails = {
  requestId: string
  isProxy: boolean
  challenger?: { host: string; port: number }
}
export type AuthResponse = {
  authCredentials?: { username: string; password: string }
  cancel?: boolean
}

export interface ExtensionApi {
  proxy: {
    settings: Setting<Record<string, any>>
    onProxyError?: Listener<{ fatal?: boolean; error: string }>
    onError?: Listener<{ message: string }>
  }
  privacy?: {
    network?: { webRTCIPHandlingPolicy?: Setting<string> }
  }
  identity: {
    getRedirectURL(path?: string): string
    launchWebAuthFlow(details: {
      url: string
      interactive: boolean
    }): Promise<string | undefined>
  }
  extension: { isAllowedIncognitoAccess(): Promise<boolean> }
  runtime: typeof chrome.runtime
  alarms: typeof chrome.alarms
  permissions: typeof chrome.permissions
  action?: typeof chrome.action
  webRequest?: {
    onAuthRequired: {
      addListener(
        cb: (
          details: AuthDetails,
          callback?: (r: AuthResponse) => void
        ) => AuthResponse | Promise<AuthResponse> | void,
        filter: { urls: string[] },
        extra: string[]
      ): void
    }
  }
  notifications?: { create(options: object): Promise<string> | void }
  browserAction?: typeof chrome.action
}

export const ext: ExtensionApi = (typeof browser !== "undefined"
  ? browser
  : chrome) as unknown as ExtensionApi

// MV3 has `action`, Firefox MV2 `browserAction`.
export const toolbarAction = ext.action ?? ext.browserAction
