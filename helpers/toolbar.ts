import { ext, toolbarAction } from "./platform"

// The toolbar icon says the state, without a text badge over the logo:
// greyed out when disconnected, in colour with a small status dot in the
// corner while connecting (amber) and connected (green).

export type IconState = "off" | "busy" | "on"

const SIZES = [16, 32] as const
const DOT = { busy: "#f59e0b", on: "#22c55d" } as const
const TITLE = {
  off: "Octa VPN: not connected",
  busy: "Octa VPN: connecting…",
  on: "Octa VPN: connected"
} as const

let logo: Promise<ImageBitmap> | undefined

function loadLogo(): Promise<ImageBitmap> {
  logo ??= (async () => {
    const path = ext.runtime.getManifest().icons?.["128"] ?? ""
    const blob = await (await fetch(ext.runtime.getURL(path))).blob()
    return createImageBitmap(blob)
  })()
  return logo
}

function draw(bitmap: ImageBitmap, size: number, state: IconState): ImageData {
  const canvas = new OffscreenCanvas(size, size)
  const ctx = canvas.getContext("2d")!
  if (state === "off") {
    ctx.filter = "grayscale(1) brightness(1.9)"
    ctx.globalAlpha = 0.85
  }
  ctx.drawImage(bitmap, 0, 0, size, size)
  ctx.filter = "none"
  ctx.globalAlpha = 1
  if (state !== "off") {
    const r = size * 0.19
    const c = size - r - size * 0.04
    // a cut-out ring keeps the dot readable on any toolbar colour
    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(c, c, r + size * 0.07, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = DOT[state]
    ctx.beginPath()
    ctx.arc(c, c, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return ctx.getImageData(0, 0, size, size)
}

/** Shows the state on the toolbar icon; never throws. */
export async function showState(state: IconState): Promise<void> {
  if (!toolbarAction) return
  try {
    const bitmap = await loadLogo()
    const imageData = Object.fromEntries(
      SIZES.map((s) => [s, draw(bitmap, s, state)])
    )
    await toolbarAction.setIcon({ imageData })
    await toolbarAction.setBadgeText({ text: "" })
    await toolbarAction.setTitle({ title: TITLE[state] })
  } catch (err) {
    // no OffscreenCanvas (an older browser): a small dot badge instead
    console.warn("Toolbar icon unchanged:", (err as Error)?.message)
    toolbarAction.setBadgeText({ text: state === "off" ? "" : " " })
    if (state !== "off")
      toolbarAction.setBadgeBackgroundColor({ color: DOT[state] })
  }
}
