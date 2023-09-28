import { getToken } from "./storage";

export async function tokenExists() {
    const token = await getToken()
    if(token!=""){
        return true
    }
    return false
}

export async function checkToken(token:string) {
    console.log(token)
        if(token!=""&&token.length==64){
            try{
                const response = await fetch('https://api.octa.space/v1/services/vpn', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                });
        
                if (response.ok) {
                console.log('Post request successful');
                    return true
                } else {
                console.error('Post request failed');
                return false
                }
            } catch (error) {
                console.error('An error occurred:', error);
                return false
            }
    }
    return false
}