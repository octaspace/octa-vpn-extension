import fetch from 'node-fetch';

interface AccessToken {
    access_token:string;
}

export async function getOAuthToken(code:string):Promise<string>{
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            let client_id:string
            let client_secret:string
            let redirect_uri:string

            if(process.env.PLASMO_BROWSER=="chrome"){
                client_id = "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0"
                client_secret = "7lTthyVbQUbqyBZIfdg2SYizC30xWerohGZLKhu0Rp0"
                redirect_uri = chrome.identity.getRedirectURL()
            }
            if(process.env.PLASMO_BROWSER=="firefox"){
                client_id = "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ"
                client_secret = "WE2w7X7zVALq671r-wTyWBQWn4yaSCQ-ASVx3TWODPI"
                redirect_uri = browser.identity.getRedirectURL()
            }

        const response = await fetch(`https://cube.octa.computer/oauth/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code&code=${code}&redirect_uri=${redirect_uri}`, {method: 'POST'});
        const rawData:any = await response.json();

        if (!rawData.access_token) {
            throw new Error('Invalid OAuth token response');
        }

        const data: AccessToken = rawData;
        return data.access_token;
    }
        catch(e) {
            attempts++;
            if (attempts >= maxAttempts) {
                return '';
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return '';
}

export async function getAPIToken(access_token:string):Promise<string>{
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
        const response = await fetch("https://cube.octa.computer/api/v1/profiles/me", {method: 'GET', headers: {"Authorization":`Bearer ${access_token}`}});
        const data:any = await response.json();

        if (!data.token) {
            throw new Error('Invalid response');
        }
        return data.token;
    }
        catch(e) {
            attempts++;
            if (attempts >= maxAttempts) {
                return '';
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return '';
}
