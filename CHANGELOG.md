# Changelog

All notable changes to this extension are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the extension follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Sign-in through the OctaSpace dashboard, which issues the extension an API key of your account.
- Exit location: the best node you can afford, the best node of a country, or one node; sorted by distance, price or speed.
- A globe with the route from your location to the exit.
- The session's time, traffic and charge while connected; price, balance and the traffic it covers before.
- Spending limit per session and a low-balance warning.
- Sites that skip the VPN.
- Dark and light themes, or as the system is.
- WebRTC limited to the proxy while connected.
- Notifications when a session ends or the balance runs low.

### Changed

- **Breaking:** prices and the balance are in US dollars; you sign in again once.
- The session runs in the background: closing the popup no longer interrupts a start or leaves a session billing.
- The node's proxy takes a login per session; the extension gives it to the node without asking you.
- A session left on a node (for example after a browser crash) is stopped before the next one starts, or taken over when it is on the same node.

### Fixed

- A proxy left on after its session ended no longer cuts the browser off the internet; the extension checks at every browser start.
