import { Octa } from "@octaspace/api.js"
import { secureStorage, storage } from "./storage"

let balanceInterval: ReturnType<typeof setInterval> | undefined

export function updateBalance(){
    if (balanceInterval !== undefined) return
    balanceInterval = setInterval(async ()=>{
        const balance = ((await new Octa(await secureStorage.getItem("token")).getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance", balance)
    }, 1200000)
}

export function stopUpdateBalance(){
    if (balanceInterval === undefined) return
    clearInterval(balanceInterval)
    balanceInterval = undefined
}
