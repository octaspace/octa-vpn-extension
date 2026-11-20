import {
  OctaAuthenticationError,
  OctaError,
  OctaNotFoundError,
  OctaValidationError
} from "@octaspace/sdk"

/** What went wrong, as the popup explains it. Shared by background and popup. */
export type ErrorCode =
  | "auth_expired"
  | "auth_failed"
  | "cancelled"
  | "incognito_required"
  | "low_balance"
  | "network"
  | "no_node"
  | "node_unavailable"
  | "proxy_blocked"
  | "site_access_required"
  | "webrtc_failed"
  | "proxy_failed"
  | "probe_bypassed"
  | "session_ended"
  | "session_exists"
  | "spend_limit"
  | "stop_pending"
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
  // 400 on start: "Insufficient balance", "Node not available", a failed check…
  if (err instanceof OctaValidationError) {
    if (/balance/i.test(err.message)) return "low_balance"
    if (/already have a VPN session/i.test(err.message)) return "session_exists"
    return "node_unavailable"
  }
  if (err instanceof OctaError) return "network"
  return "unknown"
}

/** What the user reads, in the popup and in notifications. */
export const ERROR_TEXT: Record<ErrorCode, string> = {
  auth_expired: "Your session has expired. Please sign in again.",
  auth_failed: "Sign-in failed. Please try again.",
  cancelled: "Cancelled.",
  incognito_required:
    "Allow the extension to run in private windows: Firefox requires it to set a proxy.",
  low_balance:
    "Not enough balance for this node. Top up in the OctaSpace dashboard.",
  network: "Network error. Check your connection and try again.",
  no_node: "No affordable node for this location.",
  node_unavailable: "This node is unavailable. Try another location.",
  site_access_required: "Allow site access to sign in to the node’s proxy.",
  webrtc_failed:
    "The browser refused WebRTC protection. Check browser or extension settings.",
  proxy_blocked: "Another extension controls the browser's proxy settings.",
  probe_bypassed:
    "Remove the connection check host (www.gstatic.com) from the VPN exclusions.",
  proxy_failed: "The browser refused the proxy settings.",
  session_exists:
    "Another app of yours has a VPN session on this node. Stop it there or pick another location.",
  session_ended: "The VPN session has ended on the node.",
  stop_pending:
    "The node hasn’t confirmed the session stop. Try signing out again.",
  spend_limit: "The session reached your spending limit and was stopped.",
  unknown: "Something went wrong. Please try again."
}
