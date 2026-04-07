import { proxy } from "~background";
import { secureStorage, storage } from "./storage";
import type { proxyConfig, vpnDetails } from "@octaspace/api.js/build/src/types";
import { NotifiyError } from "~components/notifiyerror";
import { RiCoinFill, RiGlobalLine } from "react-icons/ri";
import { ApiError, Octa, UUIDError } from "@octaspace/api.js";
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
        if(await storage.getItem("balance")<await storage.getItem("node_price")){
            NotifiyError("Low Balance for selected Node",<BsEmojiDizzy />)
            return
        }
        await storage.setItem("proxyStatus","Connecting")
        let balance = ((await new Octa(await secureStorage.getItem("token")).getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
        if(parseFloat(balance)<0.01){
            NotifiyError('Low Balance', <RiCoinFill />)
            return
        }
        let uuid:string = (await new Octa(await secureStorage.getItem("token")).createVPN("http_proxy",nodeid)).uuid
        await storage.setItem("uuid",uuid)
        let data:vpnDetails = await new Octa(await secureStorage.getItem("token")).getVPN(uuid,7,2000)
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
        if(err instanceof UUIDError){
            NotifiyError('Node unavailable, try another', <BsEmojiDizzy />)
            return
        }
        if(err instanceof ApiError){
            NotifiyError('Network Error', <RiGlobalLine />)
            return
        }
        NotifiyError(err.message,<BsEmojiDizzy />)
    }
}

export async function disconnect() {
    try{
        if(await proxy.stop()){
            await storage.setItem("proxyStatus","Disconnected")
            let uuid:string = await storage.getItem("uuid")
            await new Octa(await secureStorage.getItem("token")).stopVPN(uuid)
        }
    }
    catch(err:any){
        return
    }
}