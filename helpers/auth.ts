import fetch from 'node-fetch';

interface AccessToken {
    access_token:string;
}

export async function getOAuthToken(code: string, codeVerifier: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            let client_id: string;
            let redirect_uri: string;

            if (process.env.PLASMO_BROWSER == "chrome") {
                client_id = "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0";
                redirect_uri = chrome.identity.getRedirectURL();
            }
            if (process.env.PLASMO_BROWSER == "firefox") {
                client_id = "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ";
                redirect_uri = browser.identity.getRedirectURL();
            }

            // Prepare form data for application/x-www-form-urlencoded
            const params = new URLSearchParams({
                client_id: client_id,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
                code_verifier: codeVerifier
            });

            const response = await fetch('https://cube.octa.space/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            const rawData: any = await response.json();

            if (!rawData.access_token) {
                throw new Error('Invalid OAuth token response');
            }

            const data: AccessToken = rawData;
            return data.access_token;
        }
        catch (e) {
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
        const response = await fetch("https://cube.octa.space/api/v1/profiles/me", {method: 'GET', headers: {"Authorization":`Bearer ${access_token}`}});
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
