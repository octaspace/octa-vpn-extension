import { login } from "~helpers/auth"
import { WATCHDOG_ALARM } from "~helpers/config"
import { toErrorCode } from "~helpers/errors"
import type { Request, Response } from "~helpers/messages"
import { ext } from "~helpers/platform"
import { onProxyAuth, onProxyError } from "~helpers/proxy"
import {
  check,
  connect,
  disconnect,
  iconState,
  proxyLogin,
  type ProxyStatus
} from "~helpers/session"
import { clearData, KEYS, storage } from "~helpers/storage"
import { showState } from "~helpers/toolbar"

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
// The node's proxy asks for the session's login: listeners must be added at
// the worker's start, before the event that wakes it is dispatched.
onProxyAuth(proxyLogin)

onProxyError(() => {
  clearTimeout(pending)
  pending = setTimeout(check, 3_000)
})

// The icon the browser shows before anything changes: from the last state.
storage.get<ProxyStatus>(KEYS.proxyStatus).then((s) => showState(iconState(s)))

// Every start of the worker or the browser: a proxy left on with its session
// gone would cut the browser off the internet.
check()
