import { ProxyService } from "~helpers/proxyService";
import { storage } from "~helpers/storage";

export let proxy:ProxyService = new ProxyService;

;(async () => {
    const state = await proxy.getState()
    await storage.setItem("proxyStatus", state)
})()

proxy.updateState()
