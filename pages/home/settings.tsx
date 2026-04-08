import { Button, Group, Stack, Switch, Text, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { disconnect } from "~helpers/connection";
import { clearData, storage } from "~helpers/storage";
import { RiMoonClearLine, RiSunLine } from "react-icons/ri";

function Settings() {
  const [advancedView, setAdvancedView] = useState(false)
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === 'dark';

  const version = "v1.0.0"

  async function loadValues() {
    setAdvancedView(await storage.getItem("advancedView"))
  }

  async function setAdvView(value:boolean) {
    await storage.setItem("advancedView",value)
  }

  useEffect(()=>{
    loadValues()

    const watchCb = {
      "advancedView":(key: any)=>{setAdvancedView(key.newValue)},
    }
    storage.watch(watchCb)
    return () => { storage.unwatch(watchCb) }
  },[])

  const signout = async ()=>{
    // Disconnect FIRST — needs token to call stopVPN server-side
    const proxyStatus = await storage.getItem("proxyStatus")
    if(proxyStatus=="Connected"||proxyStatus=="Connecting"){
      await disconnect()
    }
    // Clear data AFTER disconnect completes
    await clearData()
    navigate('/login')
  }

  return (
    <>
    <Stack>
      <Group position="apart" style={{ borderWidth: 1, borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[3], borderStyle: 'solid', borderRadius: 5, padding: 10 }}>
        <Group>
          <Text c={isDark ? "white" : "dark.9"} weight={500}>Manual Node Selection</Text>
        </Group>
        <Switch checked={advancedView} onChange={(event)=>{setAdvView(event.currentTarget.checked)}} color="cube"/>
      </Group>

      <Group position="apart" style={{ borderWidth: 1, borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[3], borderStyle: 'solid', borderRadius: 5, padding: 10 }}>
        <Group>
          <Text c={isDark ? "white" : "dark.9"} weight={500}>Dark Mode</Text>
        </Group>
        <Switch
          checked={isDark}
          onChange={() => toggleColorScheme()}
          color="cube"
          onLabel={<RiSunLine size="1rem" color={theme.colors.yellow[4]} />}
          offLabel={<RiMoonClearLine size="1rem" color={theme.colors.blue[6]} />}
        />
      </Group>

      <Group position="center" style={{ padding: 10 }}>
        <Button variant="gradient" gradient={{ from: 'red', to: 'pink' }} onClick={signout} fullWidth radius="md">Sign Out</Button>
      </Group>
      <Group position="center">
        <Text c="dimmed" fw="bold" size="sm">{version}</Text>
      </Group>
    </Stack>
    </>
  )
}

export default Settings
