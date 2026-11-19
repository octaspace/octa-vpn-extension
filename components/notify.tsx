import { notifications } from "@mantine/notifications"
import type { ReactNode } from "react"
import { BsEmojiDizzy } from "react-icons/bs"
import { FaFaceSmile } from "react-icons/fa6"
import { GiDominoMask } from "react-icons/gi"
import { RiCoinFill, RiGlobalLine, RiLockLine } from "react-icons/ri"

import type { ErrorCode } from "~helpers/errors"

const MESSAGES: Record<ErrorCode, [string, ReactNode]> = {
  auth_expired: ["Session expired. Please sign in again.", <RiLockLine />],
  auth_failed: ["Sign-in failed. Please try again.", <RiLockLine />],
  cancelled: ["Cancelled", <BsEmojiDizzy />],
  invalid_key: ["This API key is not valid. Create one in the console under Credentials.", <RiLockLine />],
  incognito_required: [
    "Allow the extension to run in private windows",
    <GiDominoMask />
  ],
  low_balance: ["Low balance", <RiCoinFill />],
  network: ["Network error", <RiGlobalLine />],
  no_node: ["Please choose a node", <FaFaceSmile />],
  node_unavailable: ["Node unavailable, try another", <BsEmojiDizzy />],
  proxy_blocked: [
    "Another extension controls the proxy settings",
    <RiGlobalLine />
  ],
  proxy_failed: ["The browser refused the proxy settings", <RiGlobalLine />],
  session_ended: ["The VPN session has ended", <BsEmojiDizzy />],
  unknown: ["Something went wrong. Please try again.", <BsEmojiDizzy />]
}

export function notify(message: string, icon: ReactNode = <BsEmojiDizzy />) {
  notifications.show({ message, color: "red", icon })
}

export function notifyError(code: ErrorCode) {
  const [message, icon] = MESSAGES[code] ?? MESSAGES.unknown
  notify(message, icon)
}
