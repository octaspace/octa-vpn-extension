import { Storage } from "@plasmohq/storage"
import { SecureStorage } from "@plasmohq/storage/secure"

export const storage = new Storage({area:"local"})
export const secureStorage = new SecureStorage({area:"local"})

export type NodeStorageData ={
    node_number:string
    country_name:string
    country_iso:string
    price:number
    download_speed:string
    upload_speed:string
}

// Obfuscation, not protection: the password ships with the code. The key is
// readable by this extension only either way (storage.local).
let passwordSet: Promise<void> | undefined
function ready() {
    passwordSet ??= secureStorage.setPassword('Ba7_9/bW8{7**T')
    return passwordSet
}

export async function setToken(token: string)  {
    await ready()
    await secureStorage.set("token", token)
}

export async function getToken(): Promise<string | undefined> {
    await ready()
    return await secureStorage.get("token")
}

export const API_KEY_PATTERN = /^octa_ak_[A-Za-z0-9_-]{32}$/

// Keys of the old API (64 hex) are refused by the new one: signing in again.
export async function tokenExists() {
    return API_KEY_PATTERN.test((await getToken()) ?? "")
}

export async function clearData() {
    const nodeStorageData : NodeStorageData = {
        country_iso:"",
        country_name:"",
        download_speed:"0",
        upload_speed:"0",
        node_number:"",
        price:0
    }

    // Clean up all chunk keys before resetting counters
    const countryChunks: number = await storage.get("countryInfoChunks") ?? 0
    const nodeChunks: number = await storage.get("nodeInfoChunks") ?? 0
    const chunkRemovals: Promise<void>[] = []
    for (let i = 0; i <= countryChunks; i++) {
        chunkRemovals.push(storage.remove(`countryInfo${i}`))
    }
    for (let i = 0; i <= nodeChunks; i++) {
        chunkRemovals.push(storage.remove(`nodeInfo${i}`))
    }
    await Promise.all(chunkRemovals)

    // Clear all known keys in parallel
    await Promise.all([
        setToken(""),
        storage.set("nodeInfo", ""),
        storage.set("balance", "0.00"),
        storage.set("last_interacted", 0),
        storage.set("countryInfoChunks", 0),
        storage.set("nodeInfoChunks", 0),
        storage.set("cityLocal", ""),
        storage.set("cityConnected", ""),
        storage.set("countryLocal", ""),
        storage.set("countryConnected", ""),
        storage.set("ipConnected", ""),
        storage.set("ipLocal", ""),
        storage.set("advancedView", false),
        storage.set("lastSelectedNodeIndex", 0),
        storage.set("selectedNodeData", nodeStorageData),
        storage.set("proxyStatus", "Disconnected"),
        storage.set("uuid", ""),
        storage.set("vpn_ip", ""),
        storage.set("vpn_city", ""),
        storage.set("vpn_country", ""),
        storage.set("authExpired", false),
        storage.set("openSessions", []),
        storage.set("lastError", ""),
    ])
}
