import { Button, Group, HoverCard, NumberInput, Stack, Switch, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { disconnect } from "~helpers/connection";
import { clearData, storage } from "~helpers/storage";

function Settings() {
  const [advancedView, setAdvancedView] = useState(false)
  const [maxPrice, setMaxPrice] = useState(0.00)

  const version = "v0.0.1"

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
  }
  return (
    <>
    <Stack>
    <Group position="apart" style={{ borderWidth: 2, borderColor: 'grey', borderStyle: 'solid', borderRadius: 10, padding: 5 }}>
        <Group>
          <Text c="white">Advanced View</Text>
          <HoverCard width={240} shadow="md">
                  <HoverCard.Target>
                    <div>
                    <FaCircleInfo color="#8B68FF" />
                    </div>
                  </HoverCard.Target>
                  <HoverCard.Dropdown style={{border:"1px solid grey"}}>
                    {advancedView ? <Text c="white">Disable this to select nodes randomly</Text> : <Text c="white">Enable this to Manually choose the Node</Text> }
                  </HoverCard.Dropdown>
                </HoverCard>
        </Group>
        <Switch checked={advancedView} onChange={(event)=>{setAdvView(event.currentTarget.checked)}}/>
      </Group>
      {/* <Group position="apart" style={{ borderWidth: 2, borderColor: 'grey', borderStyle: 'solid', borderRadius: 10, padding: 5 }}>
        <Group>
          <Text>Max. Price</Text>
          <HoverCard width="auto" shadow="md">
                  <HoverCard.Target>
                    <div>
                    <FaCircleInfo color="#8B68FF" />
                    </div>
                  </HoverCard.Target>
                  <HoverCard.Dropdown style={{border:"1px solid grey"}}>
                    <Text c="white">Set's upper limit for price to filter the Nodes</Text>
                  </HoverCard.Dropdown>
                </HoverCard>
        </Group>
        <NumberInput step={0.01} min={0.01} defaultValue={maxPrice} onChange={setMaximumPrice} variant="filled" />
      </Group> */}
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
