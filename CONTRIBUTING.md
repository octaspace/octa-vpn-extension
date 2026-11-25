# Contributing

[← Back to README](README.md)

**On this page:** [Setup](#setup) · [Checks](#checks) · [Layout](#layout) · [Pull requests](#pull-requests)

## Setup

Node.js 22 or newer and npm 11 or newer (`npm install -g npm@11`). npm 10 and npm 11 write different lockfiles, so npm 10 is refused.

```bash
npm ci
npm run dev        # Chrome, rebuilt on every change: build/chrome-mv3-dev
```

Load `build/chrome-mv3-dev` as an unpacked extension (see [Installation](README.md#installation)).

## Checks

```bash
npm run typecheck
npm test
npm run build      # runs both, then builds for Chrome
npm run firefox    # runs both, then builds and packs for Firefox
```

## Layout

| Path | What it holds |
| --- | --- |
| `background.ts` | The background worker: messages from the popup, the session watchdog, the proxy login |
| `helpers/session.ts` | Starting, watching and stopping a session |
| `helpers/proxy.ts` | Browser proxy settings, WebRTC policy, the proxy login |
| `helpers/octa.ts` | Every call to the OctaSpace API |
| `helpers/auth.ts` | Sign-in through the dashboard (OAuth with PKCE) |
| `ui/` | The popup's screens |
| `tests/` | Unit tests (Vitest) |

## Pull requests

Open an issue first for a larger change. Keep a pull request to one purpose, with the checks passing.
