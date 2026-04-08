import { KeyError, Octa } from "@octaspace/api.js"
import { secureStorage, storage } from "./storage"

let balanceInterval: ReturnType<typeof setInterval> | undefined

export function updateBalance(){
    if (balanceInterval !== undefined) return
    balanceInterval = setInterval(async ()=>{
        try {
            const token: string = await secureStorage.getItem("token")
            if (!token) return
            const balance = ((await new Octa(token).getAccountBalance()).balance * 1e-18).toFixed(3)
            await storage.setItem("balance", balance)
        } catch (err) {
            if (err instanceof KeyError) {
                // Token invalid/expired — clear token, stop polling, signal auth failure
                stopUpdateBalance()
                await secureStorage.set("token", "")
                await storage.setItem("authExpired", true)
            }
            console.error("Balance update failed:", err)
        }
    }, 1200000)
}

export function stopUpdateBalance(){
    if (balanceInterval === undefined) return
    clearInterval(balanceInterval)
    balanceInterval = undefined
}
