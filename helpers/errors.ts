import {
  OctaAuthenticationError,
  OctaError,
  OctaNotFoundError
} from "@octaspace/sdk"

/** What went wrong, as the popup explains it. Shared by background and popup. */
export type ErrorCode =
  | "auth_expired"
  | "auth_failed"
  | "cancelled"
  | "incognito_required"
  | "invalid_key"
  | "low_balance"
  | "network"
  | "no_node"
  | "node_unavailable"
  | "proxy_blocked"
  | "proxy_failed"
  | "session_ended"
  | "unknown"

export class AppError extends Error {
  constructor(readonly code: ErrorCode) {
    super(code)
  }
}

export function toErrorCode(err: unknown): ErrorCode {
  if (err instanceof AppError) return err.code
  if (err instanceof DOMException && err.name === "AbortError")
    return "cancelled"
  if (err instanceof OctaAuthenticationError) return "auth_expired"
  if (err instanceof OctaNotFoundError) return "node_unavailable"
  if (err instanceof OctaError) return "network"
  return "unknown"
}
