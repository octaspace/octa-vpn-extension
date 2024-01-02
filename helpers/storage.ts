import { Storage } from "@plasmohq/storage"
export const storage = new Storage()

export type NodeStorageData ={
    node_id:number
    country_name:string
    country_iso:string
    traffic_price:number
    download_speed:string
    upload_speed:string
}

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
    const nodeStorageData : NodeStorageData = {
        country_iso:"",
        country_name:"",
        download_speed:"0",
        upload_speed:"0",
        node_id:0,
        traffic_price:0
    }
    await storage.set("token", "")
    await storage.set("nodeInfo", "")
    await storage.set("balance", 0.00)
    await storage.set("last_interacted", 0)
    await storage.set("countryInfoChunks", 0)
    await storage.set("cityLocal", "")
    await storage.set("cityConnected", "")
    await storage.set("countryLocal", "")
    await storage.set("countryConnected", "")
    await storage.set("ipConnected", "")
    await storage.set("iplocal", "")
    await storage.set("advancedView", false)
    await storage.set("maxPrice", 0.00)
    await storage.set("avgPrice", 0.00)
    await storage.set("lastSelectedNodeIndex", 0)
    await storage.set("selectedNodeData", nodeStorageData)
}
