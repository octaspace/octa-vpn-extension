# OCTA VPN

A browser extension that sends your browser's traffic through an OctaSpace node of your choice. You pay per GB of traffic from your OctaSpace balance.

**Contents:** [Installation](#installation) · [Signing in](#signing-in) · [Connecting](#connecting) · [What you pay](#what-you-pay) · [Privacy and security](#privacy-and-security) · [Permissions](#permissions) · [Troubleshooting](#troubleshooting) · [Development](#development) · [License](#license)

## Installation

Supported browsers: Chrome 120 or newer (and other Chromium browsers of the same version), Firefox 91.1 or newer.

Build the extension from source (Node.js 22 or newer, npm 11 or newer):

```bash
npm ci
npm run build      # Chrome: build/chrome-mv3-prod
npm run firefox    # Firefox: build/firefox-mv2-prod and build/firefox-mv2-prod.zip
```

Then load it:

- **Chrome:** open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and select `build/chrome-mv3-prod`.
- **Firefox (desktop 140+):** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and select `build/firefox-mv2-prod/manifest.json`. Then, in the add-on's settings, set **Run in Private Windows** to **Allow**: Firefox lets an extension set the proxy only with this permission.

## Signing in

1. Open the extension and click **Sign in with OctaSpace**.
2. Sign in to the [OctaSpace dashboard](https://console.octa.space) in the window that opens.

The dashboard issues the extension an API key of your account. It is listed in the dashboard under **Account → Credentials → API Keys**, labelled with the extension's name.

> [!IMPORTANT]
> Each sign-in replaces that key, and deleting it in the dashboard signs the extension out. Sign out in the extension's **Settings** to stop the session and remove the key from the browser.

## Connecting

1. Choose where to exit: click the **Exit** row on the home screen.
   - **Best available** — the cheapest node you can afford, the fastest of those.
   - A country — the best node in it.
   - A node — open the country's list (the arrow on its right).
   You can sort the list by distance, price or speed. A new location while connected moves the session there.
2. Click **Connect**. The node needs a few seconds, up to a minute, to start the proxy. **Cancel** stops the start.
3. While connected, the home screen shows the exit address and the session's time, traffic and charge.

**Disconnect** requests a stop on the node. The background watches the session with the popup closed. The popup shows why the session ended. Enable **Settings → System notifications** to receive alerts with the popup closed.

## What you pay

| Topic | How it works |
| --- | --- |
| Price | Per GB of traffic, set by the node. Nothing else is charged. |
| To start | Your balance must cover at least 1 GB at the node's price. |
| Spending limit | **Settings → Limit per session** checks accrued charges periodically and requests a stop once the target is reached. Charges may exceed the target before the next check. |
| Low balance | With system notifications and **Warn when the balance runs low** on, a notification comes once a session when the balance falls below $0.25 or below 10% of what it was at the start. |
| Stops by itself | A session stops when the balance runs out, and after a long time without traffic. |

Top up the balance in the [OctaSpace dashboard](https://console.octa.space).

**Sign out** stops the running session and clears local account data, including the key stored by the extension. If the node has yet to confirm the stop, try signing out again.

## Privacy and security

- **What goes through the node:** every site you open, except those in **Settings → Sites that skip the VPN** (each with its subdomains) and the OctaSpace API and dashboard.
- **Encryption:** HTTPS websites protect their contents end to end. The node sees the destination host and can read plain HTTP traffic. With an HTTP proxy, the first hop to the node also exposes the destination host and any Basic proxy credentials to the network. Chromium supports HTTPS proxy endpoints when the service explicitly returns one.
- **Connection check:** the extension sends a request to Google’s `www.gstatic.com/generate_204` when setting up the proxy and after a fatal proxy error. It omits browser credentials. A successful check establishes reachability.
- **WebRTC:** while connected, WebRTC is limited to the proxy, so sites cannot read your real address through it.
- **The node's proxy** accepts only this session's login, a new one for every session. The extension keeps it in memory and gives it only to that node; it is never stored.
- **Your API key** is stored in the extension's local storage, readable by this extension only.

OctaSpace receives account authentication and billing data and derives the browser’s approximate location from its IP. The selected node processes traffic routed through it. It sees destination hosts and, for unencrypted traffic, the request and response contents. Firefox shows these categories in its data consent prompt.

## Permissions

| Permission | Why |
| --- | --- |
| `proxy` | Route the browser through the node, and back to a direct connection. |
| `privacy` | Limit WebRTC to the proxy while connected. |
| `webRequest`, `webRequestAuthProvider` (Firefox: `webRequestBlocking`) | Answer the node's request for the session's login. |
| Access to all sites | Required for authentication challenges from requests to arbitrary sites. Chromium asks when you select Connect. Firefox requires the permission for proxy authentication. |
| `identity` | Sign in through the OctaSpace dashboard. |
| `storage` | Keep your key, chosen location and settings. |
| `alarms` | Check the running session every 30 seconds. |
| `notifications` (optional) | Sends system alerts when a session ends or the balance runs low, if enabled in Settings. |

## Troubleshooting

| Message | What to do |
| --- | --- |
| Allow the extension to run in private windows | Firefox: set **Run in Private Windows** to **Allow** in the add-on's settings. |
| Another extension controls the browser's proxy settings | Turn off the other proxy or VPN extension, then connect again. |
| Not enough balance for this node | Top up, or choose a cheaper node. |
| Another app of yours has a VPN session on this node | A node runs one VPN session per account. Stop the other one or choose another node. |
| This node is unavailable | Choose another location. |
| No nodes offer the browser VPN right now | Try again later. |

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
