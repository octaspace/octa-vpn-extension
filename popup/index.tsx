import satoshi from "url:~assets/fonts/SatoshiVariable.ttf"

import { App } from "~ui/App"

import "./styles.css"

// Satoshi, as in the console; the system font until it loads.
new FontFace("Satoshi Variable", `url(${satoshi})`, { weight: "100 900" })
  .load()
  .then((face) => document.fonts.add(face))
  .catch(() => undefined)

export default App
