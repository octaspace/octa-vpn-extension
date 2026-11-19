import { notifyError } from "~components/notify"

import { send } from "./messages"

// The popup's side of the session: the background runs it.

export async function connect(nodeId: string): Promise<void> {
  const res = await send({ type: "connect", nodeId })
  if (!res.ok && res.error !== "cancelled") notifyError(res.error)
}

export async function disconnect(): Promise<void> {
  await send({ type: "disconnect" })
}
