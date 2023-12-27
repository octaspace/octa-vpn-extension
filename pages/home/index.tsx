import { useEffect, useState } from "react"
import { ActionIcon, BackgroundImage, Box, Button, Group, Modal, ScrollArea, Stack, Text, Title } from '@mantine/core';
import Settings from "./settings";
import { useDisclosure } from "@mantine/hooks";
import { RiSettings5Line, RiEdit2Line } from "react-icons/ri";
import stars from "data-base64:~assets/img/stars.png";
import { HomeButton } from "~components/connectbtn";
import { List } from "./list";
import { Status } from "~components/status";
import { storage } from "~helpers/storage";
import { Load, type countryInfoType } from "~pages/load";
import { Notifications } from "@mantine/notifications";
import { DetailCircle } from "~components/detailCircle";
import { FaServer } from "react-icons/fa6";
import { FlagIcon } from "./flagicon";

function Home() {
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

  const CloseModel = async (country:string,data:countryInfoType) =>{
    let oldvalue: {
      node_id: number; 
      traffic_price: number 
      country_iso: string   
    }[] =[]
    let oldprice:number = data[country][0].traffic_price

    data[country].forEach((value)=>{
      if(oldprice===value.traffic_price)
      oldvalue.push(value)
    })

    const randomIndex = Math.floor(Math.random() * oldvalue.length);

    await storage.setItem("country_name",country)
    await storage.setItem("country",oldvalue[randomIndex].country_iso)
    await storage.setItem("node_id",oldvalue[randomIndex].node_id)
    await storage.setItem("node_price",oldvalue[randomIndex].traffic_price)
    setcountryName(country)
    setcountry(oldvalue[randomIndex].country_iso)
    setnodeId(oldvalue[randomIndex].node_id)
    setnodePrice(oldvalue[randomIndex].traffic_price)
    closeList();
  }

  const getData = async () => {
    setBalanceValue(await storage.getItem("balance"))
    setcountryName(await storage.getItem("country_name"))
    setcountry(await storage.getItem("country"))
    setnodeId(await storage.getItem("node_id"))
    setnodePrice(await storage.getItem("node_price"))
    setProxyStatus(await storage.getItem("proxyStatus"))
    setcountryConnected(await storage.getItem("countryConnected"))
    setcountryLocal(await storage.getItem("countryLocal"))
    setcityConnected(await storage.getItem("cityConnected"))
    setcityLocal(await storage.getItem("cityLocal"))
    setipConnected(await storage.getItem("ipConnected"))
    setipLocal(await storage.getItem("ipLocal"))
  }

  const balance = ()=>{
    storage.watch({"balance":(key)=>{setBalanceValue(key.newValue)}})
  }

  const listenProxyStatus = ()=>{
    storage.watch({"proxyStatus":(key)=>{setProxyStatus(key.newValue)}})
  }

  const listenConnectionInfo = ()=>{
    storage.watch({"countryConnected":(key)=>{setcountryConnected(key.newValue)}})
    storage.watch({"cityConnected":(key)=>{setcityConnected(key.newValue)}})
    storage.watch({"ipConnected":(key)=>{setipConnected(key.newValue)}})
  }

  const listenLocalInfo = ()=>{
    storage.watch({"countryLocal":(key)=>{setcountryLocal(key.newValue)}})
    storage.watch({"cityLocal":(key)=>{setcityLocal(key.newValue)}})
    storage.watch({"ipLocal":(key)=>{setipLocal(key.newValue)}})
  }

  useEffect(()=>{
    getData()
    balance()
    listenProxyStatus()
    listenConnectionInfo()
    listenLocalInfo()
  },[])

  return (
    <>
        <Box w={350} h={500} p={10}
      style={{
        backgroundImage: "linear-gradient(158deg,rgb(204,27,153) 0%, rgb(4,3,8) 50%, rgb(71,18,136) 100%)",
      }}>
        <BackgroundImage w={330} h={480}  src={stars}>
        <Modal opened={openedSettings} onClose={closeSettings} scrollAreaComponent={ScrollArea.Autosize} styles={{ title: { color: 'white' } }} overlayProps={{blur: 2,}} title="Settings">
          <Settings />
        </Modal>
        <Modal centered size="auto" opened={openedList} onClose={closeList} scrollAreaComponent={ScrollArea.Autosize} styles={{ title: { color: 'white' } }} overlayProps={{blur: 2,}} style={{color:"white"}} title="Select Country">
          <List close={CloseModel} />
        </Modal>
        <Stack spacing="xs">
        <Group position="apart">
          <ActionIcon radius="md" size="lg" variant="filled" color="blue" style={{border:"1px solid purple"}} onClick={openSettings}><RiSettings5Line style={{color: "white"}}/></ActionIcon>
          <Title style={{color:"white"}}>OctaVPN</Title>
          <Text style={{color:"white"}}>{balanceValue} Ø</Text>
        </Group>
        <Group position="center"><Status /></Group>
        <Group position="center"><HomeButton node_id={nodeId} /></Group>
        <Group position="center">
          <Button style={{borderColor:"purple"}} variant="outline" rightIcon={<RiEdit2Line color="white" />} onClick={openList}>
            <Group position="apart">
            <FlagIcon />
            <Text c="white">{countryName}</Text>
          </Group>
          </Button>
        </Group>
        <Group position="center">
          <Stack spacing="xs">
            <Text fz="sm" style={{color:"white", fontWeight:"bold", textAlign:"center"}}>IP: {proxyStatus=="Connected" ? ipConnected : ipLocal }</Text>
            <Text fz="sm" style={{color:"white", fontWeight:"bold", textAlign:"center"}}>{proxyStatus=="Connected" ? countryConnected : countryLocal }</Text>
            <Text fz="sm" style={{color:"white", fontWeight:"bold", textAlign:"center"}}>{proxyStatus=="Connected" ? cityConnected : cityLocal }</Text>
          </Stack>
        </Group>
        <Group position="center">
          <Group w={200} position="apart">
              <DetailCircle data={(proxyStatus=="Connecting" || proxyStatus=="Connected" ) ? nodeId.toString() : ".."} title="NODE" icon={<FaServer color="cyan" />} />
              <DetailCircle data={(proxyStatus=="Connecting" || proxyStatus=="Connected" ) ? (nodePrice / 100).toFixed(2).toString() : "0"} title="Cost/GB" icon={<Text style={{fontWeight:"bold", color:"cyan"}}>Ø</Text>} />
          </Group>
        </Group>
        </Stack>
        <Notifications style={{width:'auto'}} position="bottom-right" zIndex={6}/>
        <Load />
        </BackgroundImage>
        </Box>
        
    </>
  )
}

export default Home
