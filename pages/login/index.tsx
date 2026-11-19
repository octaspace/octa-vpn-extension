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

  // One centred column: nothing positioned by hand, so the key form fits.
  return (
    <Box
      w={350}
      h={520}
      p="lg"
      bg={isDark ? theme.colors.dark[8] : theme.fn.lighten(theme.colors.gray[1], 0.5)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, boxSizing: 'border-box', overflow: 'hidden' }}
    >
      {!withKey && (
        <Image width={56} alt="" src={logo} style={{ animation: `${logoGlow} 3.5s ease-in-out infinite` }} />
      )}
      <Title order={2} color="cube.5" sx={{ letterSpacing: 1, animation: `${textGlowPulse} 3.5s ease-in-out infinite` }}>
        OctaVPN
      </Title>
      <Text size="sm" color={isDark ? "gray.5" : "dark.3"} align="center" maw={240}>
        Sign in with your OctaSpace account to continue
      </Text>

      <Button
        size="md"
        radius="md"
        color="cube"
        variant={Status ? "light" : "filled"}
        loading={IsLoading}
        onClick={() => signIn({ type: "login" })}
        leftIcon={Status ? <FaCircleCheck /> : undefined}
        miw={180}
      >
        {Status ? "Done" : "Sign In"}
      </Button>

      {withKey ? (
        <Box component="form" w="100%" onSubmit={(e) => { e.preventDefault(); signIn({ type: "loginWithKey", key }) }}>
          <Stack spacing="xs">
            <PasswordInput
              label="API key"
              placeholder="octa_ak_…"
              value={key}
              onChange={(e) => setKey(e.currentTarget.value)}
              autoComplete="off"
              autoFocus
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

      <Notifications style={{ width: 'auto' }} position="bottom-right" zIndex={6} />
    </Box>
  )
}

export default Login
