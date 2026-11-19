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
writeFileSync(path, JSON.stringify(manifest))
console.log("firefox manifest:", manifest.permissions.join(", "))
