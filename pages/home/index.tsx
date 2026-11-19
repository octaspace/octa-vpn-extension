import { useEffect, useState } from "react"
import { ActionIcon, Box, Group, HoverCard, Modal, ScrollArea, Stack, Text, Title, UnstyledButton, useMantineTheme, Paper } from '@mantine/core';
import { keyframes } from '@emotion/react';

const glowPulse = keyframes({
  '0%, 100%': { textShadow: '0 0 6px rgba(211, 44, 180, 0.25)' },
  '50%': { textShadow: '0 0 18px rgba(211, 44, 180, 0.55), 0 0 32px rgba(211, 44, 180, 0.2)' },
});
import Settings from "./settings";
import { useDisclosure } from "@mantine/hooks";
import { RiSettings5Line, RiArrowDownFill, RiArrowUpFill } from "react-icons/ri";
import { HomeButton } from "~components/connectbtn";
import { List } from "./list";

import { type NodeStorageData, storage } from "~helpers/storage";
import { Load, type NodeDataType, type countryInfoType } from "~pages/load";
import { Notifications } from "@mantine/notifications";
import { FaServer } from "react-icons/fa6";
import { FlagIcon } from "./flagicon";
import { connect } from "~helpers/connection";
import { bestNode } from "~helpers/nodes";
import { notify } from "~components/notify";
import { FocusStart } from "~components/focusstart";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [balanceValue, setBalanceValue] = useState("..")
  const [openedSettings, { open:openSettings, close:closeSettings }] = useDisclosure(false);
  const [openedList, { open:openList, close:closeList }] = useDisclosure(false);
  const [countryName, setcountryName] = useState("")
  const [country, setcountry] = useState("")
  const [nodeId, setnodeId] = useState("")
  const [nodePrice, setnodePrice] = useState(0.00)
  const [proxyStatus, setProxyStatus] = useState("Disconnected")
  const [countryConnected, setcountryConnected] = useState("")
  const [cityConnected, setcityConnected] = useState("")
  const [ipConnected, setipConnected] = useState("")
  const [countryLocal, setcountryLocal] = useState("")
  const [cityLocal, setcityLocal] = useState("")
  const [ipLocal, setipLocal] = useState("")
  const [nodeDownload, setNodeDownload] = useState("")
  const [nodeUpload, setNodeUpload] = useState("")
  const [advancedView, setAdvancedView] = useState(false)

  // A location picked in the list: the best node of every country, of one
  // country, or the very node chosen in the manual view.
  const CloseModel = async (country:string, data:countryInfoType, nodeData:NodeDataType[], auto:boolean, nodeid?:string) =>{
    const balance = parseFloat(balanceValue)
    const candidates = Object.entries(data)
      .filter(([name]) => auto || name === country)
      .flatMap(([name, nodes]) => nodes.map((node) => {
        const speed = nodeData.find((d) => d.node_number === node.node_number)
        return { ...node, country_name: name, down: Number(speed?.download ?? 0), speed }
      }))
    const picked = !auto && advancedView
      ? candidates.find((c) => c.node_number === nodeid)
      : bestNode(candidates, balance)
    closeList()
    if (!picked) {
      notify(auto ? "No affordable nodes available" : "No affordable nodes in this country")
      return
    }
    const selectedNodeData: NodeStorageData = {
      country_iso: picked.country_iso,
      country_name: picked.country_name,
      node_number: picked.node_number,
      price: picked.price,
      download_speed: picked.speed?.download ?? "",
      upload_speed: picked.speed?.upload ?? ""
    }
    await storage.setItem("selectedNodeData", selectedNodeData)
    reconnect(picked.node_number)
  }

  // a new location while connected: the background replaces the session
  const reconnect = (node:string)=>{
    if(proxyStatus=="Connected"||proxyStatus=="Connecting") connect(node)
  }

  const getData = async () => {
    const selectedNodeData = await storage.getItem<NodeStorageData>("selectedNodeData")
    if(selectedNodeData){
      setcountryName(selectedNodeData.country_name)
      setcountry(selectedNodeData.country_iso)
      setnodeId(selectedNodeData.node_number)
      setnodePrice(selectedNodeData.price)
      setNodeDownload(selectedNodeData.download_speed)
      setNodeUpload(selectedNodeData.upload_speed)
    }

    setBalanceValue(await storage.getItem("balance"))
    setProxyStatus((await storage.getItem<string>("proxyStatus")) ?? "Disconnected")
    setcountryConnected(await storage.getItem("countryConnected"))
    setcountryLocal(await storage.getItem("countryLocal"))
    setcityConnected(await storage.getItem("cityConnected"))
    setcityLocal(await storage.getItem("cityLocal"))
    setipConnected(await storage.getItem("ipConnected"))
    setipLocal(await storage.getItem("ipLocal"))
    setAdvancedView(await storage.getItem("advancedView"))
  }

  useEffect(()=>{
    getData()

    const balanceCb = {"balance":(key: any)=>{setBalanceValue(key.newValue)}}
    const proxyCb = {"proxyStatus":(key: any)=>{setProxyStatus(key.newValue)}}
    const connectionCb = {
      "countryConnected":(key: any)=>{setcountryConnected(key.newValue)},
      "cityConnected":(key: any)=>{setcityConnected(key.newValue)},
      "ipConnected":(key: any)=>{setipConnected(key.newValue)},
    }
    const localCb = {
      "countryLocal":(key: any)=>{setcountryLocal(key.newValue)},
      "cityLocal":(key: any)=>{setcityLocal(key.newValue)},
      "ipLocal":(key: any)=>{setipLocal(key.newValue)},
    }
    const settingsCb = {"advancedView":(key: any)=>{setAdvancedView(key.newValue)}}
    const nodeCb = {"selectedNodeData":(key: any)=>{
      const d: NodeStorageData = key.newValue
      setcountryName(d.country_name)
      setcountry(d.country_iso)
      setnodeId(d.node_number)
      setnodePrice(d.price)
      setNodeDownload(d.download_speed)
      setNodeUpload(d.upload_speed)
    }}
    const authCb = {"authExpired":(key: any)=>{
      if(key.newValue === true) navigate('/login')
    }}

    storage.watch(balanceCb)
    storage.watch(proxyCb)
    storage.watch(connectionCb)
    storage.watch(localCb)
    storage.watch(settingsCb)
    storage.watch(nodeCb)
    storage.watch(authCb)

    return () => {
      storage.unwatch(balanceCb)
      storage.unwatch(proxyCb)
      storage.unwatch(connectionCb)
      storage.unwatch(localCb)
      storage.unwatch(settingsCb)
      storage.unwatch(nodeCb)
      storage.unwatch(authCb)
    }
  },[])

  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';
  const isConnected = proxyStatus === "Connected" || proxyStatus === "Connecting";

  return (
    <>
      <Box w={350} h={520} p="md" bg={isDark ? theme.colors.dark[7] : theme.colors.gray[0]} style={{ display: 'flex', flexDirection: 'column' }}>
        <Modal opened={openedSettings} onClose={closeSettings} scrollAreaComponent={ScrollArea.Autosize} title="Settings" centered
          styles={{
            title: { color: isDark ? theme.white : theme.black },
            inner: { backgroundColor: isDark ? theme.colors.dark[6] : theme.white }
          }}>
          <FocusStart />
          <Settings />
        </Modal>
        
        <Modal size={320} opened={openedList} onClose={closeList} scrollAreaComponent={ScrollArea.Autosize} title="Select Country" centered 
          styles={{ 
            title: { color: isDark ? theme.white : theme.black },
            inner: { backgroundColor: isDark ? theme.colors.dark[6] : theme.white },
            body: { paddingRight: 14, paddingLeft: 14, paddingBottom: 14 },
            close: { color: isDark ? theme.colors.gray[5] : theme.colors.gray[6] }
          }}>
          <FocusStart />
          <List close={CloseModel} />
        </Modal>

        <Group position="apart" mb="xl" align="center" style={{ position: 'relative' }}>
          <ActionIcon 
            radius="xl" 
            size="lg" 
            variant="transparent" 
            onClick={openSettings}
            aria-label="Settings"
            sx={{ 
              color: isDark ? theme.colors.gray[5] : theme.colors.gray[6],
              transition: 'color 200ms ease, transform 200ms ease',
              '&:hover': { 
                color: isDark ? theme.colors.gray[3] : theme.colors.dark[9],
                transform: 'rotate(45deg)'
              } 
            }}
          >
            <RiSettings5Line size="1.4rem" />
          </ActionIcon>
          <Title
            order={3}
            color="cube.5"
            sx={{
              letterSpacing: 1,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              animation: `${glowPulse} 3.5s ease-in-out infinite`,
            }}
          >OctaVPN</Title>
          <Text weight={700} color={isDark ? "gray.3" : "gray.7"}>${balanceValue}</Text>
        </Group>

        <Stack spacing="xl" align="center" style={{ flexGrow: 1, justifyContent: "center" }}>
          
          <Group position="center" mb={-10}>
            <Text 
              size="sm" 
              weight={700}
              color={
                proxyStatus === "Connected" ? "green.6" 
                : proxyStatus === "Connecting" ? "orange.6" 
                : isDark ? "gray.5" : "dark.3"
              }
              style={{ letterSpacing: 2 }}
              role="status"
              aria-live="polite"
            >
              {proxyStatus.toUpperCase()}
            </Text>
          </Group>

          <Group position="center">
            <HomeButton node_number={nodeId} />
          </Group>

          <Text size="sm" weight={500} color={isDark ? "gray.5" : "dark.3"} align="center" mt={-10} style={{ letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums', minHeight: 20 }}>
            {isConnected ? ipConnected : ipLocal || '\u00A0'}
          </Text>

        </Stack>

        <Stack spacing="xs" mt="auto">
          <UnstyledButton
            onClick={openList}
            sx={{
              width: '100%',
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              transition: 'transform 150ms ease',
              '&:hover .country-card': {
                backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[1],
                borderColor: theme.colors.cube[6],
              },
              '&:active': { transform: 'scale(0.98)' },
            }}
          >
            <Paper
              className="country-card"
              shadow="sm"
              radius="md"
              p="xs"
              withBorder
              bg={isDark ? theme.colors.dark[6] : "white"}
              style={{ transition: 'background-color 150ms ease, border-color 150ms ease' }}
            >
              <Group position="apart" align="center" noWrap>
                <Group spacing="sm">
                  <Box style={{ width: 32, height: 24, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    <FlagIcon country={country} />
                  </Box>
                  <Stack spacing={0}>
                    <Text size="sm" weight={600} lineClamp={1}>{countryName || "Select Location"}</Text>
                    <Text size="xs" color="dimmed" lineClamp={1} style={{ minHeight: 16 }}>
                      {isConnected ? (cityConnected || '\u00A0') : "Smart Location"}
                    </Text>
                  </Stack>
                </Group>
                <Text size="xs" weight={700} color="cube.5" pr={4}>›</Text>
              </Group>
            </Paper>
          </UnstyledButton>

          <Group grow spacing="xs">
            <HoverCard width="auto" shadow="md" disabled={!isConnected} withArrow>
              <HoverCard.Target>
                <Paper shadow="sm" radius="md" p="xs" withBorder bg={isDark ? theme.colors.dark[6] : "white"} style={{ textAlign: 'center' }}>
                  <Group position="center" spacing={4}>
                    <FaServer size="1rem" color={theme.colors.cube[5]} />
                    <Text size="sm" weight={600}>{isConnected && nodeId ? `#${nodeId}` : "--"}</Text>
                  </Group>
                  <Text size="xs" color="dimmed">NODE</Text>
                </Paper>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Stack spacing="xs">
                  <Group><RiArrowDownFill color={theme.colors.green[6]} /><Text size="sm">{nodeDownload} Mbps</Text></Group>
                  <Group><RiArrowUpFill color={theme.colors.blue[6]} /><Text size="sm">{nodeUpload} Mbps</Text></Group>
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>

            <Paper shadow="sm" radius="md" p="xs" withBorder bg={isDark ? theme.colors.dark[6] : "white"} style={{ textAlign: 'center' }}>
              <Group position="center" spacing={4}>
                <Text size="sm" weight={700} color={theme.colors.cube[5]}>$</Text>
                <Text size="sm" weight={600}>{isConnected ? Number(nodePrice).toFixed(4) : "0"}</Text>
              </Group>
              <Text size="xs" color="dimmed">Cost/GB</Text>
            </Paper>
          </Group>
        </Stack>

        <Notifications style={{ width: 'auto' }} position="bottom-right" zIndex={6} />
        <Load />
      </Box>
    </>
  )
}

export default Home
