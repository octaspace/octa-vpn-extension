export type ProxyState = 'Disconnected' | 'Connecting' | 'Connected' | 'NoPermission';

export class ProxyService{
    private state:ProxyState

    constructor() {
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

    getState():ProxyState{
        return this.state;
    }

    updateState(){
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

    async isConnected(): Promise<boolean> {
        return new Promise((resolve) => {
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
        });
    }

    async start(ip:string, port:number): Promise<boolean>{
        try{
            if(await this.isConnected()){
                await this.stop()
            }
            let config = {
                mode: "fixed_servers",
                rules: {
                 singleProxy: {
                    scheme: "http",
                    host: ip,
                    port: port
                  },
                  bypassList: ["<local>","127.0.0.1"]
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
        catch(err:any){
            return false;
        }
    }

    async stop() {
        if(await this.isConnected()){
            let config = {
                mode: "direct",
              };
              chrome.proxy.settings.set(
                {value: config, scope: 'regular'},
                function() {
                    console.log("Disconnected")
                }
              );
        }
    }
}