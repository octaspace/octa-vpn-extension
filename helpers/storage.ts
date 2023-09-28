import { Storage } from "@plasmohq/storage"
const storage = new Storage()

export async function setToken(token: string)  {
    await storage.set("token", token)
}

export async function getToken()  {
    return await storage.get("token")
}