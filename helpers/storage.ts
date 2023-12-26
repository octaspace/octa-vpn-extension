import { Storage } from "@plasmohq/storage"
export const storage = new Storage()

export async function setToken(token: string)  {
    await storage.set("token", token)
}

export async function getToken() {
    return await storage.get("token")
}

export async function tokenExists() {
    const token = await getToken()
    if(token==undefined){
        return false
    }
    if(token.length==64){
        return true
    }
    
    return false
}

export async function clearData() {
    await storage.set("token", "")
    await storage.set("nodeInfo", "")
    await storage.set("balance", 0.00)
    await storage.set("last_interacted", 0)
    await storage.set("country_name", "")
    await storage.set("node_id", 0)
    await storage.set("node_price", 0)
    await storage.set("countryInfoChunks", 0)
    await storage.set("country", "")
    await storage.set("cityLocal", "")
    await storage.set("cityConnected", "")
    await storage.set("countryLocal", "")
    await storage.set("countryConnected", "")
    await storage.set("ipConnected", "")
    await storage.set("iplocal", "")
}