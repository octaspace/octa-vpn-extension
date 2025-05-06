import { useState } from "react"
import { clearData, setToken } from "~helpers/storage";
import logo from "data-base64:~assets/img/octa.png";
import { Box, Button, Group, Overlay, Stack, Text, Title } from '@mantine/core';
import { Image } from '@mantine/core';
import { Octa } from "@octaspace/api.js";
import { wait } from "~helpers/wait";
import { FaCircleCheck } from "react-icons/fa6";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { getAPIToken, getOAuthToken } from "~helpers/auth";
import { BsEmojiDizzy } from "react-icons/bs";
import { NotifiyError } from "~components/notifiyerror";

function Login() {
  const [IsLoading, setIsLoading] = useState(false)
  const [Status, setStatus] = useState(false)
  const [BtnColor, setBtnColor] = useState("")
  const navigate = useNavigate();

  async function save(apikey:string) {
    try{
      await clearData()
      let octa = new Octa(apikey)
      await octa.getAccountInfo()
      setIsLoading(false)
      setBtnColor("green")
      setStatus(true)
      await wait(1000)
      await setToken(apikey);
      navigate('/home')
    }
    catch(err:any){
      setIsLoading(false)
    }
  }

  async function authorize(redirect_url:string){
    //extract code from redirect url
    const code:string = redirect_url.split('=')[1]
    if (!code) {
      NotifiyError('Auth Error: Token not found', <BsEmojiDizzy />)
      return;
    }
    //send code to /oath/token
    const accessToken:string = await getOAuthToken(code)
    if(accessToken.length<1){
      //show error
      NotifiyError('Auth Error: Invalid token', <BsEmojiDizzy />)
    }
    //use token at /api/v1/profile/me
    const apiToken:string = await getAPIToken(accessToken)
    //save it, proceed
    if(apiToken.length==64){
      save(apiToken)
    }
    //show error
    NotifiyError('Unexpected Error: Invalid Token', <BsEmojiDizzy />)
}

  function launchAuth() {
    setIsLoading(true)

    if(process.env.PLASMO_BROWSER=="chrome"){

      const redirectURL = chrome.identity.getRedirectURL();

      const clientID =
        "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0";
      let authURL = "https://cube.octa.computer/oauth/authorize";
      authURL += `?client_id=${clientID}`;
      authURL += `&response_type=code`;
      authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
      authURL += `&scope=`;

      return chrome.identity.launchWebAuthFlow({
        interactive: true,
        url: authURL,
      }, authorize);
  }
  if(process.env.PLASMO_BROWSER=="firefox"){
    
    const redirectURL = browser.identity.getRedirectURL();

    const clientID =
      "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ";
    let authURL = "https://cube.octa.computer/oauth/authorize";
    authURL += `?client_id=${clientID}`;
    authURL += `&response_type=code`;
    authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
    authURL += `&scope=`;

    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: authURL,
    }, authorize);
}

  }

  return (
    <>
    <Box w={350} h={500} p={10}
      style={{
        backgroundImage: "linear-gradient(150deg,#CC1B99, #040308, #471288)",
      }}>
    <Overlay color="#000" opacity={0.2} zIndex={0}/>
    <Group h={100}></Group>
    <Stack justify="center">
      <Group position="center">
        <Image
              width={70}
              alt="OctaVPN"
              src={logo}
              style={{filter:'drop-shadow(0 0 4mm rgb(160, 0, 210))'}}
            />
        </Group>
      <Group position="center">
        <Title color="#ffffff" style={{zIndex:0}}>OctaVPN</Title>
      </Group>
      <Box maw={320} mx="auto">
          <Button bg={BtnColor} onClick={launchAuth} styles={{root:{"&:hover":{backgroundColor:BtnColor}}}} loading={IsLoading} fullWidth mt="sm">
            {Status ? <><FaCircleCheck />
</> : "Login using Cube"}
          </Button>
          <Text ta="center" fw="bold">By proceeding you agree to Octa.Space terms</Text>
    </Box>
    </Stack>
    </Box>
          </>
  )
}

export default Login
