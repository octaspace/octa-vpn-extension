import { ProxyService } from "~helpers/proxyService";
import { storage } from "~helpers/storage";

export let proxy:ProxyService = new ProxyService;

async ()=>{
    console.log(proxy.getState())
    await storage.setItem("proxyStatus",proxy.getState())
}

proxy.updateState()
