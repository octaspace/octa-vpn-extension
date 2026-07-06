import { proxy } from "~background";
import { secureStorage, storage } from "./storage";
import type { ProxyConfig, ServiceInfo } from "@octaspace/sdk";
import { NotifiyError } from "~components/notifiyerror";
import { RiCoinFill, RiGlobalLine } from "react-icons/ri";
import { OctaAuthenticationError, OctaClient, OctaError, OctaNotFoundError } from "@octaspace/sdk";
import { BsEmojiDizzy } from "react-icons/bs";
import { FaFaceSmile } from "react-icons/fa6";
import { GiDominoMask } from "react-icons/gi";
import { wait } from "./wait";

export async function connect(nodeid:number) {
    let octa: OctaClient | undefined
    let uuid: string | undefined
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
        octa = new OctaClient({ apiKey: token })
        let balance = ((await octa.accounts.balance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
        if(parseFloat(balance)<0.01){
            NotifiyError('Low Balance', <RiCoinFill />)
            return
        }

        // Balance OK — now show Connecting
        await storage.setItem("proxyStatus","Connecting")

        uuid = (await octa.services.vpn.start({node_id:nodeid,subkind:"http_proxy"})).uuid
        await storage.setItem("uuid",uuid)

        // Guard: user may have triggered disconnect while createVPN was in-flight
        if(await storage.getItem("proxyStatus") !== "Connecting") {
            // Clean up server-side VPN instance to avoid billing leak
            try { await octa.services.session(uuid).stop() } catch {}
            return
        }

        // Node needs time to provision the service — poll up to 7 tries, 2s apart.
        // retries:0 keeps each try a single request instead of the SDK default of 3
        let data:ServiceInfo = await octa.services.session(uuid).info({retries:0})
        for(let attempt=1; !data.is_ready && attempt<7; attempt++){
            await wait(2000)
            data = await octa.services.session(uuid).info({retries:0})
        }
        if(!data.is_ready){
            try { await octa.services.session(uuid).stop() } catch {}
            await storage.setItem("proxyStatus","Disconnected")
            NotifiyError('Node unavailable, try another', <BsEmojiDizzy />)
            return
        }
        await storage.setItem("vpn_ip",data.ip)
        await storage.setItem("vpn_city",data.city)
        await storage.setItem("vpn_country",data.country)
        if(typeof data.config !== "object" || data.config == null){
            // http_proxy sessions must return a {ip, port} object
            await disconnect()
            return
        }
        else{
            let config:ProxyConfig = data.config
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
        // Session was created but connect failed — stop it server-side to avoid billing leak
        if(octa && uuid){
            try { await octa.services.session(uuid).stop() } catch {}
        }
        if(err instanceof OctaAuthenticationError){
            await secureStorage.set("token", "")
            await storage.setItem("authExpired", true)
            NotifiyError('Session expired. Please sign in again.', <BsEmojiDizzy />)
            return
        }
        if(err instanceof OctaNotFoundError){
            NotifiyError('Node unavailable, try another', <BsEmojiDizzy />)
            return
        }
        if(err instanceof OctaError){
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
                    await new OctaClient({ apiKey: token }).services.session(uuid).stop()
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