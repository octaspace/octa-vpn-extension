import { proxy } from "~background";
import { secureStorage, storage } from "./storage";
import type { proxyConfig, serviceDetails } from "@octaspace/api.js/build/src/types";
import { NotifiyError } from "~components/notifiyerror";
import { RiCoinFill, RiGlobalLine } from "react-icons/ri";
import { ApiError, KeyError, Octa, UUIDError } from "@octaspace/api.js";
import { BsEmojiDizzy } from "react-icons/bs";
import { FaFaceSmile } from "react-icons/fa6";
import { GiDominoMask } from "react-icons/gi";

export async function connect(nodeid:number) {
    try{
        if(process.env.PLASMO_BROWSER=="firefox"){
            if(!(await browser.extension.isAllowedIncognitoAccess())){
                NotifiyError("Allow Private Mode Permission",<GiDominoMask />)
                return
            }
        }
        if(nodeid==0){
            NotifiyError("Please choose a Node",<FaFaceSmile />)
            return
        }

        // Validate balance BEFORE setting Connecting status
        const token:string = await secureStorage.getItem("token")
        const octa = new Octa(token)
        let balance = ((await octa.getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
        if(parseFloat(balance)<0.01){
            NotifiyError('Low Balance', <RiCoinFill />)
            return
        }

        // Balance OK — now show Connecting
        await storage.setItem("proxyStatus","Connecting")

        let uuid:string = (await octa.createVPN("http_proxy",nodeid)).uuid
        await storage.setItem("uuid",uuid)

        // Guard: user may have triggered disconnect while createVPN was in-flight
        if(await storage.getItem("proxyStatus") !== "Connecting") {
            // Clean up server-side VPN instance to avoid billing leak
            try { await octa.stopVPN(uuid) } catch {}
            return
        }

        let data:serviceDetails = await octa.getVPN(uuid,7,2000)
        await storage.setItem("vpn_ip",data.ip)
        await storage.setItem("vpn_city",data.city)
        await storage.setItem("vpn_country",data.country)
        if(typeof data.config === "string"){
            await disconnect()
            return
        }
        else{
            let config:proxyConfig = data.config
            await storage.setItem("countryConnected",data.country)
            await storage.setItem("cityConnected",data.city)
            await storage.setItem("ipConnected",data.ip)
            if(await storage.getItem("proxyStatus")=="Connecting"){
                if(await proxy.start(config.ip,config.port)){
                    await storage.setItem("proxyStatus","Connected")
                }
            }
            return
        }
    }
    catch(err:any)
    {
        await storage.setItem("proxyStatus","Disconnected")
        if(err instanceof KeyError){
            await secureStorage.set("token", "")
            await storage.setItem("authExpired", true)
            NotifiyError('Session expired. Please sign in again.', <BsEmojiDizzy />)
            return
        }
        if(err instanceof UUIDError){
            NotifiyError('Node unavailable, try another', <BsEmojiDizzy />)
            return
        }
        if(err instanceof ApiError){
            NotifiyError('Network Error', <RiGlobalLine />)
            return
        }
        console.error("Connect error:", err)
        NotifiyError("Connection failed. Please try again.", <BsEmojiDizzy />)
    }
}

export async function disconnect() {
    try{
        if(await proxy.stop()){
            await storage.setItem("proxyStatus","Disconnected")
            try {
                const uuid:string = await storage.getItem("uuid")
                const token:string = await secureStorage.getItem("token")
                if(uuid && token){
                    await new Octa(token).stopVPN(uuid)
                }
            } catch(err:any){
                // Server-side VPN will time out eventually
                console.error("Failed to stop server VPN:", err)
            }
        }
    }
    catch(err:any){
        console.error("Disconnect error:", err)
        // Force local state to Disconnected even on error
        await storage.setItem("proxyStatus","Disconnected")
    }
}