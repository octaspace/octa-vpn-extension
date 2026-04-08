// Firefox WebExtension API ambient declaration.
// Plasmo injects the `browser` global at build time for Firefox targets.
// Firefox uses a Promise-based API while Chrome uses callbacks.
// We declare a minimal interface covering what the codebase actually uses.
declare const browser: {
  identity: {
    getRedirectURL(path?: string): string
    launchWebAuthFlow(details: {
      interactive?: boolean
      url: string
    }): Promise<string>
  }
  extension: {
    isAllowedIncognitoAccess(): Promise<boolean>
  }
  storage?: {
    session?: {
      get(key: string): Promise<Record<string, string | undefined> | undefined>
      set(items: Record<string, string>): Promise<void>
      remove(key: string): Promise<void>
    }
    local?: {
      get(key: string): Promise<Record<string, string | undefined> | undefined>
      set(items: Record<string, string>): Promise<void>
      remove(key: string): Promise<void>
    }
  }
  proxy: {
    settings: {
      get(details: object): Promise<{
        levelOfControl: string
        value: Record<string, any>
      }>
      set(details: object, callback?: () => void): void
      clear(details: object, callback?: () => void): void
      onChange: {
        addListener(callback: (details: any) => void): void
      }
    }
  }
}
