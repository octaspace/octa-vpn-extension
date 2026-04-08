export type ProxyState = 'Disconnected' | 'Connecting' | 'Connected' | 'NoPermission';

export class ProxyService{
    private state: ProxyState

    constructor() {
    }

    getState(): Promise<ProxyState> {
        return new Promise<ProxyState>((resolve) => {
            if (this.state !== undefined) {
                resolve(this.state)
                return
            }
            if(process.env.PLASMO_BROWSER=="chrome"){
                chrome.proxy.settings.get({ 'incognito': false }, (config) => {
                    if (config.levelOfControl === "controlled_by_this_extension" ||
                        config.levelOfControl === "controllable_by_this_extension") {
                        this.state = config.value.mode === "fixed_servers" ? "Connected" : "Disconnected"
                    } else {
                        this.state = "NoPermission"
                    }
                    resolve(this.state)
                })
            } else if(process.env.PLASMO_BROWSER=="firefox"){
                browser.proxy.settings.get({}).then((config) => {
                    if (config.levelOfControl === "controlled_by_this_extension" ||
                        config.levelOfControl === "controllable_by_this_extension") {
                        // Firefox uses "manual" for active proxy, not "fixed_servers"
                        this.state = config.value.proxyType === "manual" ? "Connected" : "Disconnected"
                    } else {
                        this.state = "NoPermission"
                    }
                    resolve(this.state)
                })
            } else {
                // Unknown environment — don't hang forever
                this.state = "Disconnected"
                resolve(this.state)
            }
        })
    }

    updateState(){
        if(process.env.PLASMO_BROWSER=="chrome"){
            chrome.proxy.settings.onChange.addListener((config) => {
                if(config.levelOfControl=="controlled_by_this_extension" ||
                   config.levelOfControl=="controllable_by_this_extension"){
                    this.state = config.value.mode == "fixed_servers" ? "Connected" : "Disconnected"
                } else {
                    this.state = "NoPermission"
                }
            })
        } else if(process.env.PLASMO_BROWSER=="firefox"){
            try {
                browser.proxy.settings.onChange?.addListener((config: any) => {
                    if (config.levelOfControl === "controlled_by_this_extension" ||
                        config.levelOfControl === "controllable_by_this_extension") {
                        this.state = config.value?.proxyType === "manual" ? "Connected" : "Disconnected"
                    } else {
                        this.state = "NoPermission"
                    }
                })
            } catch {
                // Firefox version doesn't support onChange — degrade gracefully
            }
        }
    }

    async isConnected(): Promise<boolean> {
        return new Promise((resolve) => {
            if(process.env.PLASMO_BROWSER=="chrome"){
                chrome.proxy.settings.get(
                    { 'incognito': false },
                    function (config) {
                        resolve(config.value.mode == "fixed_servers")
                    }
                )
            } else if(process.env.PLASMO_BROWSER=="firefox"){
                browser.proxy.settings.get({}).then((config) => {
                    if (config.levelOfControl === "controlled_by_this_extension" ||
                        config.levelOfControl === "controllable_by_this_extension") {
                        resolve(config.value.proxyType === "manual")
                    } else {
                        resolve(false)
                    }
                })
            } else {
                resolve(false)
            }
        })
    }

    async start(ip: string, port: number): Promise<boolean>{
        if(await this.isConnected()){
            await this.stop()
        }
        if(process.env.PLASMO_BROWSER=="chrome"){
            const config = {
                mode: "fixed_servers",
                rules: {
                    singleProxy: {
                        scheme: "http",
                        host: ip,
                        port: port
                    },
                    bypassList: ["<local>", "127.0.0.1", "api.octa.computer", "api.octa.space"]
                }
            }
            return new Promise<boolean>((resolve) => {
                chrome.proxy.settings.set(
                    {value: config, scope: 'regular'},
                    function() { resolve(true) }
                )
            })
        }
        if(process.env.PLASMO_BROWSER=="firefox"){
            const config = {
                proxyType: "manual",
                http: `http://${ip}:${port}`,
                httpProxyAll: true,
                passthrough: ["api.octa.computer", "api.octa.space"]
            }
            return new Promise<boolean>((resolve) => {
                browser.proxy.settings.set(
                    {value: config},
                    function() { resolve(true) }
                )
            })
        }
        return false
    }

    async stop(): Promise<boolean> {
        const connected = await this.isConnected()
        if(!connected) return true

        if(process.env.PLASMO_BROWSER=="chrome"){
            return new Promise<boolean>((resolve) => {
                chrome.proxy.settings.set(
                    {value: { mode: "direct" }, scope: 'regular'},
                    function() { resolve(true) }
                )
            })
        }
        if(process.env.PLASMO_BROWSER=="firefox"){
            return new Promise<boolean>((resolve) => {
                browser.proxy.settings.clear({}, function(){ resolve(true) })
            })
        }
        return true
    }
}
