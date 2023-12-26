import fetch from 'node-fetch';
import { storage } from './storage';

type InterfaceBody = {
    ip:string
    region_name?:string
    country?:string
}

export async function LocalInfo(){
    try{
        let proxyStatus = await storage.getItem("proxyStatus")
        if(proxyStatus=="Connected"){
            return
        }
        const response = await fetch("https://ifconfig.octa.space/json",{method: 'GET',headers: {'Content-Type': 'application/json'}});
        if(response.status==200){
            const data: InterfaceBody = await response.json();
            await storage.setItem("ipLocal",data.ip)
            await storage.setItem("countryLocal",data.country)
            await storage.setItem("cityLocal",data.region_name)
        }
    }
    catch(err:any){
        console.log("Error fetching public ip info")
    }
}