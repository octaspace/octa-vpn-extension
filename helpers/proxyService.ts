export type ProxyState = 'Disconnected' | 'Connecting' | 'Connected' | 'NoPermission';
export class ProxyService{
    private state:ProxyState

    constructor() {
    }

    setState(){
        chrome.proxy.settings.get(
            { 'incognito': false },
            function (config) {
                if(config.levelOfControl=="controlled_by_this_extension"||config.levelOfControl=="controllable_by_this_extension"){
                    if(config.value.mode == "fixed_servers"){
                        this.state = "Connected"
                    }
                    else{
                        this.state = "Disconnected"
                    }
                }
                else{
                    this.state = "NoPermission"
                }
            }
        );
    }

    getState() {
        return new Promise((resolve, reject) => {
            if (this.state !== undefined) {
                resolve(this.state);
            } else {
                if(process.env.PLASMO_BROWSER=="chrome"){
                    chrome.proxy.settings.get({ 'incognito': false }, (config) => {
                        if (config.levelOfControl === "controlled_by_this_extension" || config.levelOfControl === "controllable_by_this_extension") {
                            if (config.value.mode === "fixed_servers") {
                                this.state = "Connected";
                                resolve(this.state);
                            } else {
                                this.state = "Disconnected";
                                resolve(this.state);
                            }
                        } else {
                            this.state = "NoPermission";
                            resolve(this.state);
                        }
                    });
                }
                if(process.env.PLASMO_BROWSER=="firefox"){
                    browser.proxy.settings.get({}).then((config) => {
                        if (config.levelOfControl === "controlled_by_this_extension" || config.levelOfControl === "controllable_by_this_extension") {
                            if (config.value.proxyType === "fixed_servers") {
                                this.state = "Connected";
                                resolve(this.state);
                            } else {
                                this.state = "Disconnected";
                                resolve(this.state);
                            }
                        } else {
                            this.state = "NoPermission";
                            resolve(this.state);
                        }
                      });
                }
            }
        });
    }
    
    updateState(){
        if(process.env.PLASMO_BROWSER=="chrome"){
            chrome.proxy.settings.onChange.addListener(
                function(config) {
                    if(config.levelOfControl=="controlled_by_this_extension"||config.levelOfControl=="controllable_by_this_extension"){
                        if(config.value.mode == "fixed_servers"){
                            this.state = "Connected"
                        }
                        else{
                            this.state = "Disconnected"
                        }
                    }
                    else{
                        this.state = "NoPermission"
                    }
                }
              )
        }
        if(process.env.PLASMO_BROWSER=="firefox"){

        }
    }

    async isConnected(): Promise<boolean> {
        return new Promise((resolve) => {
            if(process.env.PLASMO_BROWSER=="chrome"){
                chrome.proxy.settings.get(
                    { 'incognito': false },
                    function (config) {
                        if (config.value.mode == "fixed_servers") {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                );
            }
            if(process.env.PLASMO_BROWSER=="firefox"){
                browser.proxy.settings.get({}).then((config) => {
                    if (config.levelOfControl === "controlled_by_this_extension" || config.levelOfControl === "controllable_by_this_extension") {
                        if (config.value.proxyType === "manual") {
                            resolve(true);
                        } else {
                            this.state = "Disconnected";
                            resolve(false);
                        }
                    } else {
                        resolve(false);
                    }
                });
            }
        });
    }

    async start(ip:string, port:number): Promise<boolean>{
            if(await this.isConnected()){
                await this.stop()
            }
            if(process.env.PLASMO_BROWSER=="chrome"){
                let config = {
                    mode: "fixed_servers",
                    rules: {
                     singleProxy: {
                        scheme: "http",
                        host: ip,
                        port: port
                      },
                      bypassList: ["<local>", "127.0.0.1", "api.octa.computer", "api.octa.space"]
                    }
                  };
                  return new Promise((resolve) => {
                    chrome.proxy.settings.set(
                        {value: config, scope: 'regular'},
                        function() {
                            console.log("Connected")
                            resolve(true);
                        }
                      );
                  })
            }
            if(process.env.PLASMO_BROWSER=="firefox"){
                let config = {
                    proxyType: "manual",
                    http: `http://${ip}:${port}`,
                    httpProxyAll: true,
                    passthrough: ["api.octa.computer", "api.octa.space"]
                  };
                  return new Promise((resolve) => {
                    browser.proxy.settings.set(
                        {value: config},
                        function() {
                            console.log("Connected")
                            resolve(true);
                        }
                      );
                  })
            }

    }

    async stop(): Promise<boolean> {
        return new Promise(async (resolve) => {
            if(await this.isConnected()){
                if(process.env.PLASMO_BROWSER=="chrome"){
                    let config = {
                        mode: "direct",
                      };
                      chrome.proxy.settings.set(
                        {value: config, scope: 'regular'},
                        function() {
                            resolve(true)
                        }
                      );
                }
                if(process.env.PLASMO_BROWSER=="firefox"){
                    browser.proxy.settings.clear({},function(){
                        resolve(true)
                    })
                }
            }
            resolve(true)
        })        
    }
}
