import { useState } from "react"
import logo from "data-base64:~assets/img/octa.png";
import { Anchor, Box, Button, PasswordInput, Stack, Text, Title, UnstyledButton, useMantineTheme } from '@mantine/core';
import { Image } from '@mantine/core';
import { keyframes } from '@emotion/react';
import { FaCircleCheck } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { notifyError } from "~components/notify";
import { CONSOLE_API_KEYS_URL } from "~helpers/config";
import { type Request, send } from "~helpers/messages";
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

  const [withKey, setWithKey] = useState(false)
  const [key, setKey] = useState("")

  // The background runs the flow: this popup may not survive the auth window.
  async function signIn(request: Request) {
    setIsLoading(true)
    const res = await send(request)
    setIsLoading(false)
    if (!res.ok) {
      if (res.error !== "cancelled") notifyError(res.error)
      return
    }
    setStatus(true)
    setTimeout(() => navigate('/home'), 600)
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
            visibility: withKey ? 'hidden' : 'visible',
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
            // the key form needs the room the logo takes
            top: withKey ? 48 : 157 + 120 + 32,
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
            onClick={() => signIn({ type: "login" })}
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

          {withKey ? (
            <Box component="form" w={260} onSubmit={(e) => { e.preventDefault(); signIn({ type: "loginWithKey", key }) }}>
              <Stack spacing="xs">
                <PasswordInput
                  label="API key"
                  placeholder="octa_ak_…"
                  value={key}
                  onChange={(e) => setKey(e.currentTarget.value)}
                  autoComplete="off"
                />
                <Button type="submit" variant="light" color="cube" disabled={!key.trim() || IsLoading}>Use key</Button>
                <Anchor href={CONSOLE_API_KEYS_URL} target="_blank" size="xs" align="center">Create a key in the console</Anchor>
              </Stack>
            </Box>
          ) : (
            <UnstyledButton onClick={() => setWithKey(true)}>
              <Text size="xs" color="dimmed" td="underline">Sign in with an API key</Text>
            </UnstyledButton>
          )}
        </Stack>

        <Notifications style={{ width: 'auto' }} position="bottom-right" zIndex={6} />
      </Box>
    </>
  )
}

export default Login
