// Popup → background requests. The background owns the session and the
// sign-in; the popup only asks and shows.

import type { ErrorCode } from "./errors"
import { ext } from "./platform"

export type Request =
  | { type: "connect"; nodeId: string }
  | { type: "disconnect" }
  | { type: "refresh" }
  | { type: "login" }
  | { type: "signOut" }

export type Response = { ok: boolean; error?: ErrorCode }

export async function send(request: Request): Promise<Response> {
  try {
    return (
      (await ext.runtime.sendMessage(request)) ?? {
        ok: false,
        error: "unknown"
      }
    )
  } catch {
    return { ok: false, error: "unknown" }
  }
}
