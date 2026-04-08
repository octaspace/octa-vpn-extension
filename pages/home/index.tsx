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
import { BsEmojiDizzy } from "react-icons/bs";
import { FlagIcon } from "./flagicon";
import { proxy } from "~background";
import { connect, disconnect } from "~helpers/connection";
import { NotifiyError } from "~components/notifiyerror";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [balanceValue, setBalanceValue] = useState("..")
  const [openedSettings, { open:openSettings, close:closeSettings }] = useDisclosure(false);
  const [openedList, { open:openList, close:closeList }] = useDisclosure(false);
  const [countryName, setcountryName] = useState("")
  const [country, setcountry] = useState("")
  const [nodeId, setnodeId] = useState(0)
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

  const CloseModel = async (country:string,data:countryInfoType, nodeData:NodeDataType[], auto:boolean, nodeid?:number, node_price?:number) =>{
    const avgPrice: number = await storage.getItem("avgPrice")
    const balance = parseFloat(balanceValue)

    if(auto){
        const countries = Object.keys(data)

        // Pre-check: ensure at least one affordable node exists before looping
        const hasAffordable = countries.some(c =>
          data[c].some(node =>
            node.traffic_price_ether <= avgPrice &&
            node.traffic_price_ether <= balance
          )
        )
        if (!hasAffordable) {
          NotifiyError("No affordable nodes available", <BsEmojiDizzy />)
          closeList()
          return
        }

        let eligibleNodes: typeof data[string] = []
        let randomCountry = ""
        while (eligibleNodes.length === 0) {
          const idx = Math.floor(countries.length * Math.random())
          randomCountry = countries[idx]
          eligibleNodes = data[randomCountry].filter(
            node => node.traffic_price_ether <= avgPrice && node.traffic_price_ether <= balance
          )
        }
        const randomIndex = Math.floor(Math.random() * eligibleNodes.length);
        const singleNodeData = nodeData.find(node => node.node_id === eligibleNodes[randomIndex].node_id)
        if (!singleNodeData) return
        const selectedNodeData : NodeStorageData = {
          country_iso:data[randomCountry][0].country_iso,
          country_name:randomCountry,
          node_id:eligibleNodes[randomIndex].node_id,
          traffic_price_ether:eligibleNodes[randomIndex].traffic_price_ether,
          download_speed:singleNodeData.download,
          upload_speed:singleNodeData.upload
        }
        await storage.setItem("selectedNodeData", selectedNodeData)
        reconnect(eligibleNodes[randomIndex].node_id)
    }
    else{
      if(!advancedView){
        const oldvalue = data[country].filter(
          value => value.traffic_price_ether <= avgPrice && value.traffic_price_ether <= balance
        )

        // Guard against empty list — prevents % 0 and undefined access
        if (oldvalue.length === 0) {
          NotifiyError("No affordable nodes in this country", <BsEmojiDizzy />)
          closeList()
          return
        }

        let lastSelectedNodeIndex = await storage.getItem<number>('lastSelectedNodeIndex');
        if (lastSelectedNodeIndex === undefined || lastSelectedNodeIndex >= oldvalue.length || countryName!=country) {
          lastSelectedNodeIndex = 0;
        }
        const nextNodeIndex = (lastSelectedNodeIndex + 1) % oldvalue.length;
        const singleNodeData = nodeData.find(node => node.node_id === oldvalue[nextNodeIndex].node_id)
        if (!singleNodeData) return
        const selectedNodeData : NodeStorageData = {
          country_iso:oldvalue[nextNodeIndex].country_iso,
          country_name:country,
          node_id:oldvalue[nextNodeIndex].node_id,
          traffic_price_ether:oldvalue[nextNodeIndex].traffic_price_ether,
          download_speed:singleNodeData.download,
          upload_speed:singleNodeData.upload
        }
        await storage.setItem("lastSelectedNodeIndex", nextNodeIndex)
        await storage.setItem("selectedNodeData", selectedNodeData)
        reconnect(oldvalue[nextNodeIndex].node_id)
      }
      else{
        const singleNodeData = nodeData.find(node => node.node_id === nodeid)
        if (!singleNodeData) return
        const selectedNodeData : NodeStorageData = {
          country_iso:data[country][0].country_iso,
          country_name:country,
          node_id:nodeid,
          traffic_price_ether:node_price,
          download_speed:singleNodeData.download,
          upload_speed:singleNodeData.upload
        }
        await storage.setItem("selectedNodeData", selectedNodeData)
        reconnect(nodeid)
        }
      }
      closeList();
  }

  const reconnect = async (node:number)=>{
    if(proxyStatus=="Connected"||proxyStatus=="Connecting"){
      await disconnect()
      await connect(node)
   }
  }

  const getData = async () => {
    const selectedNodeData = await storage.getItem<NodeStorageData>("selectedNodeData")
    if(selectedNodeData){
      setcountryName(selectedNodeData.country_name)
      setcountry(selectedNodeData.country_iso)
      setnodeId(selectedNodeData.node_id)
      setnodePrice(selectedNodeData.traffic_price_ether)
      setNodeDownload(selectedNodeData.download_speed)
      setNodeUpload(selectedNodeData.upload_speed)
    }

    setBalanceValue(await storage.getItem("balance"))
    const currentProxyStatus = await storage.getItem<string>("proxyStatus")
    if(currentProxyStatus==undefined){
      await storage.setItem("proxyStatus", await proxy.getState())
    } else {
      setProxyStatus(currentProxyStatus)
    }
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
      setnodeId(d.node_id)
      setnodePrice(d.traffic_price_ether)
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
          <Settings />
        </Modal>
        
        <Modal size={320} opened={openedList} onClose={closeList} scrollAreaComponent={ScrollArea.Autosize} title="Select Country" centered 
          styles={{ 
            title: { color: isDark ? theme.white : theme.black },
            inner: { backgroundColor: isDark ? theme.colors.dark[6] : theme.white },
            body: { paddingRight: 14, paddingLeft: 14, paddingBottom: 14 },
            close: { color: isDark ? theme.colors.gray[5] : theme.colors.gray[6] }
          }}>
          <List close={CloseModel} />
        </Modal>

        <Group position="apart" mb="xl" align="center" style={{ position: 'relative' }}>
          <ActionIcon 
            radius="xl" 
            size="lg" 
            variant="transparent" 
            onClick={openSettings}
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
          <Text weight={700} color={isDark ? "gray.3" : "gray.7"}>{balanceValue} Ø</Text>
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
            >
              {proxyStatus.toUpperCase()}
            </Text>
          </Group>

          <Group position="center">
            <HomeButton node_id={nodeId} />
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
                <Text size="sm" weight={700} color={theme.colors.cube[5]}>Ø</Text>
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
