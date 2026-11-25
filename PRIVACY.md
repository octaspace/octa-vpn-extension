# OCTA VPN Privacy Policy

Last updated: November 25, 2026

This policy covers the OCTA VPN browser extension (the "extension") for Chrome, other Chromium browsers and Firefox. It explains what user data the extension collects, how it is used, where it is stored, and every party it is shared with. The extension is published by OctaSpace ("we", "us"). The [OctaSpace Privacy Policy](https://docs.octa.space/privacy-policy) covers the rest of the OctaSpace platform. Where the two differ, this policy applies to the extension.

## What the extension does

The extension routes your browser's traffic through a node of the OctaSpace network that you choose. A node is a computer run by an independent operator who rents out its connection. You pay per GB of traffic from your OctaSpace account balance.

## 1. Data we collect and why

| Data | How it is collected | Why |
| --- | --- | --- |
| **Authentication information:** an API key of your OctaSpace account | You sign in on the OctaSpace dashboard (`console.octa.space`) in a browser window. The extension never sees your password. The dashboard returns a one-time authorization code, which the extension exchanges for an API key. | To call the OctaSpace API on your behalf. |
| **Financial information:** your account balance, the price of nodes, the charges of your sessions, your spending limit | Read from the OctaSpace API. The spending limit is a setting you enter. | To show your balance and costs, check that you can afford a session, warn you when the balance runs low, and stop a session at your spending limit. The extension does not handle card or wallet details: top-ups happen in the dashboard. |
| **Location:** the IP address of your browser and the approximate location derived from it (city, country, coordinates) | The OctaSpace API receives your IP address with each request and looks up its approximate location on request. | To show where you are, sort nodes by distance and pick the best available node. |
| **Session data:** the node you connect to, start and end time, traffic volume (bytes sent and received), the exit IP address and location, the charge | Created by the OctaSpace platform when you connect, read by the extension. | To run and bill the session, and to show it to you. |
| **Web history and website content:** the hostnames of the websites you open and when, and the content of unencrypted (HTTP) sites | Not collected by the extension or by OctaSpace. While you are connected, your browser sends its traffic through the node you chose, and the node's operator receives it (section 4). | This is the service itself: your traffic reaches the internet from the node's address. |
| **Settings:** chosen location, sites that skip the VPN, notification and limit settings | Entered by you. | To apply your choices. |

The extension does **not** read, record or send to OctaSpace the addresses or content of the pages you visit. It contains no analytics, advertising or tracking code.

## 2. How the data is used

We use the data above only to provide the extension's single purpose: routing your browser through an OctaSpace node, and billing and managing that session. We do not use it for advertising, profiling, creditworthiness or lending decisions, and we do not sell it.

The use and transfer of information received through the extension complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including its Limited Use requirements.

## 3. Where the data is stored and for how long

**In your browser** (the extension's local storage, readable only by this extension): the API key, balance, node list, your approximate location, the current session's details, your settings, and the IDs of sessions that still need to be stopped. Account data is removed when you sign out. Your settings and chosen location are kept until you uninstall the extension, which removes everything.

**In memory only:** the login of the node's proxy. It is new for every session, is never written to storage, and is sent only to that node.

**On OctaSpace servers:**

- Your account and the API key issued to the extension, until you delete the key in the dashboard (**Account → Credentials → API Keys**) or delete your account.
- Session records (account, node, protocol, node country, start and end time, traffic volume, charge), as your billing history, for as long as your account exists and afterwards as long as accounting law requires.
- Server logs, which include the IP address of each request, for up to 30 days, for security, abuse prevention and troubleshooting.
- The location looked up from your IP address is returned to the extension and is not stored with your account.

**On the node:** the proxy software OctaSpace runs on nodes is configured not to log the requests that pass through it. It is removed when the session ends.

## 4. Who the data is shared with

| Party | What it receives | Why |
| --- | --- | --- |
| **OctaSpace** | Everything in section 1 except your web traffic, which goes to the node | To provide, bill and secure the service. |
| **The operator of the node you choose** (an independent third party) | Your IP address; the hostnames of the sites you visit; the time and amount of traffic; the full content of unencrypted (HTTP) traffic; the session's proxy login. The content of HTTPS sites stays encrypted end to end. | The node carries your traffic. Its operator controls the machine and can technically observe what passes through it, whatever software we run there. |
| **Cloudflare, Inc.** | Your IP address and the requests the extension makes to `api.octa.space` and `console.octa.space`, which Cloudflare protects and delivers. Nodes also resolve the hostnames of the sites you visit through Cloudflare's public DNS (1.1.1.1), from the node's address, not yours. | Network security, delivery and name resolution. |
| **Google** | One request to `www.gstatic.com/generate_204` through the node when connecting and after a proxy error, without cookies. Google sees the node's address, not yours. | To check that the connection works. |
| **Websites you visit** | The node's IP address instead of yours, and whatever you send them. | Normal web browsing. |
| **Telegram** | Messages about your sessions, only if you linked Telegram and turned on notifications in the OctaSpace dashboard. | Notifications you asked for. |
| **Authorities** | Data we hold, only when the law requires it. | Legal obligations. |

We share user data with no one else.

## 5. Security

- The API key and all requests to OctaSpace travel over HTTPS. The key is stored in the extension's local storage, which other extensions and websites cannot read.
- The connection from your browser to the node is a plain HTTP proxy: networks between you and the node can see the hostnames you visit and the session's proxy login (valid for that session only). HTTPS sites stay encrypted.
- While you are connected, the extension limits WebRTC to the proxy so websites cannot learn your real IP address through it.
- No system is perfectly secure, and we cannot control what a node operator does on their own machine. Use HTTPS sites for anything sensitive.

## 6. Permissions

| Permission | Why |
| --- | --- |
| `proxy` | Route the browser through the node, and back to a direct connection. |
| `privacy` | Limit WebRTC to the proxy while connected. |
| `webRequest`, `webRequestAuthProvider` (Firefox: `webRequestBlocking`) | Give the node's proxy the session's login when it asks for it. The extension does not read or change the requests themselves. |
| Access to all sites | Required by the browser to answer the proxy's login request for any site. Chromium asks for it when you first connect, Firefox at install. |
| `identity` | Sign in through the OctaSpace dashboard. |
| `storage` | Keep your key, chosen location and settings. |
| `alarms` | Check the running session every 30 seconds: balance, spending limit, whether it is still up. |
| `notifications` (optional) | Tell you why a session ended or that the balance is low, if you turn this on. |
| Access to `api.octa.space`, `console.octa.space` | Talk to the OctaSpace API and dashboard. |

## 7. Your choices and rights

- **Sign out** in the extension's Settings: stops the session and removes account data and the API key from the browser.
- **Delete the API key** in the dashboard (**Account → Credentials → API Keys**): the extension is signed out.
- **Sites that skip the VPN** in Settings: their traffic does not go through the node.
- **Uninstall** the extension to remove all its local data.
- To access, correct or delete the data OctaSpace holds about you, or to delete your account, write to [hello@octa.space](mailto:hello@octa.space). Billing records may be kept as long as the law requires.

## 8. Children

The extension is not intended for children under 13, or the minimum age in your country, and we do not knowingly collect their data.

## 9. Changes

We will post changes to this policy here and update the date above. A change to what data is collected or who it is shared with will come with an extension update that describes it.

## 10. Contact

OctaSpace, Unit 158260, PO Box 7169, Poole, BH15 9EL, United Kingdom
[hello@octa.space](mailto:hello@octa.space)
