// Firefox MV2 answers a proxy's 407 through a blocking webRequest listener
// (webRequestBlocking); Chrome MV3 through webRequestAuthProvider. Plasmo
// writes one permission list for both, so the Firefox build is fixed here.
import { readFileSync, writeFileSync } from "node:fs"

const path = "build/firefox-mv2-prod/manifest.json"
const manifest = JSON.parse(readFileSync(path, "utf8"))
manifest.permissions = [
  ...new Set(
    manifest.permissions.map((p) =>
      p === "webRequestAuthProvider" ? "webRequestBlocking" : p
    )
  )
]
// MV2 has no optional_host_permissions: access to all sites, asked for on the
// first connect as in Chrome, goes with the optional permissions.
manifest.optional_permissions = [
  ...new Set([
    ...(manifest.optional_permissions ?? []),
    ...(manifest.optional_host_permissions ?? [])
  ])
]
delete manifest.optional_host_permissions
// Chromium pins its unpacked ID with key. Firefox uses gecko.id.
delete manifest.key
writeFileSync(path, JSON.stringify(manifest))
console.log("firefox manifest:", manifest.permissions.join(", "))
console.log("optional:", manifest.optional_permissions.join(", "))
