import { Button, Group, HoverCard, NumberInput, Stack, Switch, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { disconnect } from "~helpers/connection";
import { clearData, storage } from "~helpers/storage";

function Settings() {
  const [advancedView, setAdvancedView] = useState(false)
  const [maxPrice, setMaxPrice] = useState(0.00)
  const navigate = useNavigate();

  const version = "v1.0.0"

  async function loadValues() {
    setAdvancedView(await storage.getItem("advancedView"))
    if(await storage.getItem<number>("maxPrice")!=0){
      setMaxPrice(await storage.getItem("avgPrice"))
    }
    else{
      setMaxPrice(await storage.getItem("maxPrice"))
    }
  }

  async function setAdvView(value:boolean) {
    await storage.setItem("advancedView",value)
  }

  async function setMaximumPrice(value:number | '') {
    if(typeof(value)=="string"||value==0){
      value=await storage.getItem("avgPrice")
    }
    await storage.setItem("maxPrice",value)
  }

  async function listenValues() {
    storage.watch({"advancedView":(key)=>{setAdvancedView(key.newValue)}})
    storage.watch({"maxPrice":(key)=>{setMaxPrice(key.newValue)}})
  }

  useEffect(()=>{
    loadValues()
    listenValues()
  },[])
  const signout = async ()=>{
    clearData()
    let proxyStatus = await storage.getItem("proxyStatus");
    if(proxyStatus=="Connected"||proxyStatus=="Connecting"){
      disconnect()
    }
    navigate('/login')
  }
  return (
    <>
    <Stack>
    <Group position="apart" style={{ borderWidth: 1, borderColor: 'purple', borderStyle: 'solid', borderRadius: 5, padding: 5 }}>
        <Group>
            <Text c="white">Manual Node Selection</Text>
        </Group>
        <Switch checked={advancedView} onChange={(event)=>{setAdvView(event.currentTarget.checked)}}/>
      </Group>
      <Group position="center" style={{ padding: 5 }}>
        <Button variant="gradient" gradient={{ from: 'orange', to: 'red' }} onClick={signout}>Sign Out</Button>
      </Group>
      <Group position="center">
        <Text c="white" fw="bold">{version}</Text>
      </Group>
    </Stack>
    </>
  )
}

export default Settings
