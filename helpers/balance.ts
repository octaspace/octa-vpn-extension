import { Octa } from "@octaspace/api.js"
import { secureStorage, storage } from "./storage"

export function updateBalance(){
    setInterval(async ()=>{
        let balance = ((await new Octa(await secureStorage.getItem("token")).getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
        console.log("Balance fetched")
    },1200000)
  }