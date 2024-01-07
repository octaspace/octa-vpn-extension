import { useEffect, useState } from "react"
import { ActionIcon, BackgroundImage, Box, Button, Group, HoverCard, Modal, ScrollArea, Stack, Text, Title } from '@mantine/core';
import Settings from "./settings";
import { useDisclosure } from "@mantine/hooks";
import { RiSettings5Line, RiEdit2Line, RiArrowDownFill, RiArrowUpFill } from "react-icons/ri";
import stars from "data-base64:~assets/img/stars.png";
import { HomeButton } from "~components/connectbtn";
import { List } from "./list";
import { Status } from "~components/status";
import { type NodeStorageData, storage } from "~helpers/storage";
import { Load, type NodeDataType, type countryInfoType } from "~pages/load";
import { Notifications } from "@mantine/notifications";
import { DetailCircle } from "~components/detailCircle";
import { FaServer } from "react-icons/fa6";
import { FlagIcon } from "./flagicon";
import { proxy } from "~background";
import { connect, disconnect } from "~helpers/connection";

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
  const [nodeDownload, setNodeDownload] = useState("")
  const [nodeUpload, setNodeUpload] = useState("")
  const [advancedView, setAdvancedView] = useState(false)

  const CloseModel = async (country:string,data:countryInfoType, nodeData:NodeDataType[], auto:boolean, nodeid?:number, node_price?:number) =>{
    const avgPrice: number = await storage.getItem("avgPrice")
    if(auto){
        const countries = Object.keys(data);
        let randomCountryIndex = Math.floor(countries.length* Math.random());
        let randomCountry = countries[randomCountryIndex];
        let eligibleNodes = data[randomCountry].filter(node => node.traffic_price*0.01 <= avgPrice && node.traffic_price*0.01 <= parseFloat(balanceValue));
        while (!eligibleNodes || eligibleNodes.length === 0) {
          randomCountryIndex = Math.floor(countries.length * Math.random());
          randomCountry = countries[randomCountryIndex];
          eligibleNodes = data[randomCountry]?.filter(node => node.traffic_price*0.01 <= avgPrice && node.traffic_price*0.01 <= parseFloat(balanceValue));
        }
        const randomIndex = Math.floor(Math.random() * eligibleNodes.length);
        let singleNodeData:NodeDataType
        for (const node of nodeData) {
          if (node.node_id === eligibleNodes[randomIndex].node_id) {
            singleNodeData = node;
            break;
          }
        }
        const selectedNodeData : NodeStorageData = {
          country_iso:data[randomCountry][0].country_iso,
          country_name:randomCountry,
          node_id:eligibleNodes[randomIndex].node_id,
          traffic_price:eligibleNodes[randomIndex].traffic_price,
          download_speed:singleNodeData.download,
          upload_speed:singleNodeData.upload
        }
        await storage.setItem("selectedNodeData", selectedNodeData)
        reconnect(eligibleNodes[randomIndex].node_id)
    }
    else{
      if(!advancedView){
        let oldvalue: {
          node_id: number; 
          traffic_price: number 
          country_iso: string   
        }[] =[]
        data[country].forEach((value)=>{
          if(value.traffic_price*0.01 <= avgPrice && value.traffic_price*0.01 <= parseFloat(balanceValue))
          oldvalue.push(value)
        })
        let lastSelectedNodeIndex = await storage.getItem<number>('lastSelectedNodeIndex');
        if (lastSelectedNodeIndex === undefined || lastSelectedNodeIndex >= oldvalue.length || countryName!=country) {
          lastSelectedNodeIndex = 0;
        }
        const nextNodeIndex = (lastSelectedNodeIndex + 1) % oldvalue.length;    
        let singleNodeData:NodeDataType
        for (const node of nodeData) {
          if (node.node_id === oldvalue[nextNodeIndex].node_id) {
            singleNodeData = node;
            break;
          }
        }
        const selectedNodeData : NodeStorageData = {
          country_iso:oldvalue[nextNodeIndex].country_iso,
          country_name:country,
          node_id:oldvalue[nextNodeIndex].node_id,
          traffic_price:oldvalue[nextNodeIndex].traffic_price,
          download_speed:singleNodeData.download,
          upload_speed:singleNodeData.upload
        }
        await storage.setItem("lastSelectedNodeIndex", nextNodeIndex)
        await storage.setItem("selectedNodeData", selectedNodeData)
        reconnect(oldvalue[nextNodeIndex].node_id)
      }
      else{
        let singleNodeData:NodeDataType
        for (const node of nodeData) {
          if (node.node_id === nodeid) {
            singleNodeData = node;
            break;
          }
        }
        const selectedNodeData : NodeStorageData = {
          country_iso:data[country][0].country_iso,
          country_name:country,
          node_id:nodeid,
          traffic_price:node_price,
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
    setcountryName(selectedNodeData.country_name)
    setcountry(selectedNodeData.country_iso)
    setnodeId(selectedNodeData.node_id)
    setnodePrice(selectedNodeData.traffic_price)
    setNodeDownload(selectedNodeData.download_speed)
    setNodeUpload(selectedNodeData.upload_speed)

    setBalanceValue(await storage.getItem("balance"))
    setProxyStatus(await storage.getItem("proxyStatus"))
    setcountryConnected(await storage.getItem("countryConnected"))
    setcountryLocal(await storage.getItem("countryLocal"))
    setcityConnected(await storage.getItem("cityConnected"))
    setcityLocal(await storage.getItem("cityLocal"))
    setipConnected(await storage.getItem("ipConnected"))
    setipLocal(await storage.getItem("ipLocal"))
    setAdvancedView(await storage.getItem("advancedView"))
    if(proxyStatus==undefined){
      await storage.setItem("proxyStatus",await proxy.getState())
    }
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

  const listenNodeInfo = ()=>{
    storage.watch({"selectedNodeData":(key)=>{
      const selectedNodeData :NodeStorageData = key.newValue
      setcountryName(selectedNodeData.country_name)
      setcountry(selectedNodeData.country_iso)
      setnodeId(selectedNodeData.node_id)
      setnodePrice(selectedNodeData.traffic_price)
      setNodeDownload(selectedNodeData.download_speed)
      setNodeUpload(selectedNodeData.upload_speed)
      
    }})

    storage.watch({"node_id":(key)=>{setnodeId(key.newValue)}})
    storage.watch({"node_price":(key)=>{setnodePrice(key.newValue)}})
    storage.watch({"country":(key)=>{setcountry(key.newValue)}})
    storage.watch({"country_name":(key)=>{setcountryName(key.newValue)}})
    storage.watch({"node_download_speed":(key)=>{setNodeDownload(key.newValue)}})
    storage.watch({"node_upload_speed":(key)=>{setNodeUpload(key.newValue)}})
  }

  const listenLocalInfo = ()=>{
    storage.watch({"countryLocal":(key)=>{setcountryLocal(key.newValue)}})
    storage.watch({"cityLocal":(key)=>{setcityLocal(key.newValue)}})
    storage.watch({"ipLocal":(key)=>{setipLocal(key.newValue)}})
  }

  async function listenSettings() {
    storage.watch({"advancedView":(key)=>{setAdvancedView(key.newValue)}})
  }

  useEffect(()=>{
    getData()
    balance()
    listenProxyStatus()
    listenConnectionInfo()
    listenLocalInfo()
    listenSettings()
    listenNodeInfo()
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
            <FlagIcon country={country} />
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
            <HoverCard width="auto" shadow="md" disabled={proxyStatus=="Disconnected"}>
                <HoverCard.Target>
                  <div>
                  <DetailCircle data={(proxyStatus=="Connecting" || proxyStatus=="Connected" ) ? nodeId.toString() : ".."} title="NODE" icon={<FaServer color="cyan" />} ></DetailCircle>
                  </div>
                </HoverCard.Target>
                <HoverCard.Dropdown style={{border:"1px solid grey"}}>
                  <Group>
                    <RiArrowDownFill />
                    <Text>{nodeDownload} Mbps</Text>
                  </Group>
                  <Group>
                    <RiArrowUpFill />
                    <Text>{nodeUpload} Mbps</Text>
                  </Group>
                </HoverCard.Dropdown>
              </HoverCard>
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
