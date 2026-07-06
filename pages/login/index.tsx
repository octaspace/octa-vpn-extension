import { useState } from "react"
import { clearData, setToken } from "~helpers/storage";
import logo from "data-base64:~assets/img/octa.png";
import { Box, Button, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { Image } from '@mantine/core';
import { keyframes } from '@emotion/react';
import { OctaClient } from "@octaspace/sdk";
import { wait } from "~helpers/wait";
import { FaCircleCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { getAPIToken, getOAuthToken } from "~helpers/auth";
import { BsEmojiDizzy } from "react-icons/bs";
import { NotifiyError } from "~components/notifiyerror";
import { generateCodeVerifier, generateCodeChallenge, storePkceVerifier, consumePkceVerifier } from "~helpers/pkce";
import { Notifications } from "@mantine/notifications";

const logoGlow = keyframes({
  '0%, 100%': { filter: `drop-shadow(0 0 15px rgba(211, 44, 180, 0.6))` },
  '50%':       { filter: `drop-shadow(0 0 25px rgba(211, 44, 180, 0.8))` },
});

const pulseGlow = keyframes({
  '0%, 100%': { transform: 'scale(0.8)', opacity: 0.1 },
  '50%': { transform: 'scale(1.5)', opacity: 0.5 },
});

const textGlowPulse = keyframes({
  '0%, 100%': { textShadow: '0 0 6px rgba(211, 44, 180, 0.25)' },
  '50%':      { textShadow: '0 0 18px rgba(211, 44, 180, 0.55), 0 0 32px rgba(211, 44, 180, 0.2)' },
});

function Login() {
  const [IsLoading, setIsLoading] = useState(false)
  const [Status, setStatus] = useState(false)
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  async function save(apikey:string) {
    try{
      await clearData()
      let octa = new OctaClient({ apiKey: apikey })
      await octa.accounts.get()
      setIsLoading(false)
      setStatus(true)
      await wait(1000)
      await setToken(apikey);
      navigate('/home')
    }
    catch(err:any){
      setIsLoading(false)
    }
  }

  async function authorize(redirect_url?: string){
    try {
      if (!redirect_url) {
        setIsLoading(false);
        NotifiyError('Auth Error: Authorization flow failed', <BsEmojiDizzy />);
        return;
      }

      // Extract code from redirect URL using URLSearchParams
      const url = new URL(redirect_url);
      const code = url.searchParams.get('code');
      
      if (!code) {
        setIsLoading(false);
        NotifiyError('Auth Error: Authorization code not found', <BsEmojiDizzy />);
        return;
      }
      
      // Retrieve and consume the PKCE verifier
      const codeVerifier = await consumePkceVerifier();
      if (!codeVerifier) {
        setIsLoading(false);
        NotifiyError('Auth Error: PKCE verifier not found', <BsEmojiDizzy />);
        return;
      }
      
      // Send code and verifier to /oauth/token
      const accessToken: string = await getOAuthToken(code, codeVerifier);
      if (accessToken.length < 1) {
        setIsLoading(false);
        NotifiyError('Auth Error: Invalid token', <BsEmojiDizzy />);
        return;
      }
      
      // Use token at /api/v1/profiles/me
      const apiToken: string = await getAPIToken(accessToken);
      
      // Save it and proceed
      if (apiToken.length === 64) {
        await save(apiToken);
        return;
      }
      
      // Show error if token is invalid
      setIsLoading(false);
      NotifiyError('Unexpected Error: Invalid Token', <BsEmojiDizzy />);
    } catch (error) {
      setIsLoading(false);
      NotifiyError('Auth Error: Failed to complete authorization', <BsEmojiDizzy />);
    }
  }

  async function launchAuth() {
    try {
      setIsLoading(true);

      // Generate PKCE verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store the verifier for later use
      await storePkceVerifier(codeVerifier);

      if (process.env.PLASMO_BROWSER == "chrome") {
        const redirectURL = chrome.identity.getRedirectURL();
        const clientID = "AVKl5zoeH1R_OXqWlE2rbAn2JWBXSFflq0lcUnmy3y0";
        
        let authURL = "https://cube.octa.computer/oauth/authorize";
        authURL += `?client_id=${clientID}`;
        authURL += `&response_type=code`;
        authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
        authURL += `&code_challenge=${codeChallenge}`;
        authURL += `&code_challenge_method=S256`;
        authURL += `&scope=`;

        return chrome.identity.launchWebAuthFlow({
          interactive: true,
          url: authURL,
        }, authorize);
      }
      
      if (process.env.PLASMO_BROWSER == "firefox") {
        const redirectURL = browser.identity.getRedirectURL();
        const clientID = "Bv0maVhVPpjbUehutq_frwhKpMYDI9W70P6C1nOGScQ";
        
        let authURL = "https://cube.octa.computer/oauth/authorize";
        authURL += `?client_id=${clientID}`;
        authURL += `&response_type=code`;
        authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
        authURL += `&code_challenge=${codeChallenge}`;
        authURL += `&code_challenge_method=S256`;
        authURL += `&scope=`;

        const redirectResult = await browser.identity.launchWebAuthFlow({
          interactive: true,
          url: authURL,
        });
        return authorize(redirectResult);
      }
    } catch (error) {
      setIsLoading(false);
      NotifiyError('Auth Error: Failed to launch authentication', <BsEmojiDizzy />);
    }
  }

  return (
    <>
      <Box
        w={350}
        h={520}
        bg={isDark ? theme.colors.dark[8] : theme.fn.lighten(theme.colors.gray[1], 0.5)}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}
      >
        {/* Animated Background Glow */}
        <Box
          sx={{
            position: 'absolute',
            top: 117, // Center is exactly at 217px to match the power button on the main screen
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.cube[5]} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: `${pulseGlow} 4s ease-in-out infinite`,
            zIndex: 1,
          }}
        />

        {/* Logo Container */}
        <Box
          sx={{
            position: 'absolute',
            top: 157, // Center is exactly at 217px
            width: 120,
            height: 120,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <Image
            width={56}
            alt="OctaVPN"
            src={logo}
            style={{
              animation: `${logoGlow} 3.5s ease-in-out infinite`
            }}
          />
        </Box>

        <Stack 
          align="center" 
          spacing="lg" 
          sx={{ 
            position: 'absolute',
            top: 157 + 120 + 32, // Flow right after the circle + spacing
            zIndex: 2,
            width: '100%',
          }}
        >
          <Title
            order={2}
            color="cube.5"
            sx={{
              letterSpacing: 1,
              animation: `${textGlowPulse} 3.5s ease-in-out infinite`,
            }}
          >
            OctaVPN
          </Title>

          <Text size="sm" color={isDark ? "gray.5" : "dark.3"} align="center" maw={240}>
            Sign in with your OctaSpace account to continue
          </Text>

          <Button
            mt="md"
            size="md"
            radius="md"
            color="cube"
            variant={Status ? "light" : "filled"}
            loading={IsLoading}
            onClick={launchAuth}
            leftIcon={Status ? <FaCircleCheck /> : undefined}
            sx={{
              minWidth: 180,
              fontWeight: 600,
              letterSpacing: 0.5,
              transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 200ms ease',
              ...(Status && {
                backgroundColor: theme.fn.rgba(theme.colors.cube[5], 0.15),
                color: theme.colors.cube[5],
              }),
              '&:hover': Status
                ? {}
                : {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${theme.fn.rgba(theme.colors.cube[5], 0.35)}`
                  },
              '&:active': { transform: 'translateY(0)' }
            }}
          >
            {Status ? "Done" : "Sign In"}
          </Button>
        </Stack>

        <Notifications style={{ width: 'auto' }} position="bottom-right" zIndex={6} />
      </Box>
    </>
  )
}

export default Login
