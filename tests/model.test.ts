import { describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS, settingsWithDefaults } from "~helpers/model"

describe("settingsWithDefaults", () => {
  it("gives the defaults when nothing is stored", () => {
    expect(settingsWithDefaults(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(settingsWithDefaults(null)).toEqual(DEFAULT_SETTINGS)
  })

  it("fills in fields an older version did not save", () => {
    const old = {
      spendLimit: 1,
      lowBalanceWarning: false,
      theme: "dark"
    } as const
    expect(settingsWithDefaults(old)).toEqual({
      ...old,
      bypassSites: []
    })
  })

  it("keeps what the user chose", () => {
    const mine = { ...DEFAULT_SETTINGS, bypassSites: ["bank.example"] }
    expect(settingsWithDefaults(mine)).toEqual(mine)
  })
})
