import { proxy } from "~background";
import { storage } from "./storage";
import type { proxyConfig, vpnDetails } from "@octaspace/api.js/build/src/types";
import { NotifiyError } from "~components/notifiyerror";
import { RiCoinFill, RiGlobalLine } from "react-icons/ri";
import { ApiError, Octa } from "@octaspace/api.js";
import { BsEmojiDizzy } from "react-icons/bs";
import { FaFaceSmile } from "react-icons/fa6";

export async function connect(nodeid:number) {
    try{
        if(nodeid==0){
            NotifiyError("Please choose a Node",<FaFaceSmile />)
            return
        }
        await storage.setItem("proxyStatus","Connecting")
        let balance = ((await new Octa(await storage.getItem("token")).getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
        if(parseFloat(balance)<0.01){
            NotifiyError('Low Balance', <RiCoinFill />)
            return
        }
        let uuid:string = (await new Octa(await storage.getItem("token")).createVPN("http_proxy",nodeid)).uuid
        await storage.setItem("uuid",uuid)
        let data:vpnDetails = await new Octa(await storage.getItem("token")).getVPN(uuid)
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
        if(err instanceof ApiError){
            NotifiyError('Network Error', <RiGlobalLine />)
            return
        }
        NotifiyError('Try another Node',<BsEmojiDizzy />)
    }
}

export async function disconnect() {
    try{
        await proxy.stop()
        await storage.setItem("proxyStatus","Disconnected")
        let uuid:string = await storage.getItem("uuid")
        await new Octa(await storage.getItem("token")).stopVPN(uuid)
    }
    catch(err:any){
        return
    }
}