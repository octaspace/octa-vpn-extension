import { login, loginWithKey } from "~helpers/auth"
import { WATCHDOG_ALARM } from "~helpers/config"
import { toErrorCode } from "~helpers/errors"
import type { Request, Response } from "~helpers/messages"
import { ext } from "~helpers/platform"
import { onProxyError } from "~helpers/proxy"
import { check, connect, disconnect } from "~helpers/session"
import { clearData } from "~helpers/storage"

async function attempt(task: () => Promise<void>): Promise<Response> {
  try {
    await task()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: toErrorCode(err) }
  }
}

async function handle(request: Request): Promise<Response> {
  switch (request.type) {
    case "connect":
      return connect(request.nodeId)
    case "disconnect":
      return disconnect()
    case "refresh":
      // the popup's meter: the session's traffic and charge, now
      await check()
      return { ok: true }
    case "login":
      return attempt(login)
    case "loginWithKey":
      return attempt(() => loginWithKey(request.key))
    case "signOut":
      // stop the session while the key is still there
      await disconnect()
      await clearData()
      return { ok: true }
  }
}

ext.runtime.onMessage.addListener((request: Request, sender, sendResponse) => {
  if (sender.id !== ext.runtime.id) return false
  handle(request).then(sendResponse)
  return true // the response is async
})

ext.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === WATCHDOG_ALARM) check()
})

// A dead node shows up as proxy errors first: check now, not at the next tick.
let pending: ReturnType<typeof setTimeout> | undefined
onProxyError(() => {
  clearTimeout(pending)
  pending = setTimeout(check, 3_000)
})

// Every start of the worker or the browser: a proxy left on with its session
// gone would cut the browser off the internet.
check()
