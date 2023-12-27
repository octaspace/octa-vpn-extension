import { Button, Group } from "@mantine/core";
import { disconnect } from "~helpers/connection";
import { clearData, storage } from "~helpers/storage";

function Settings() {
  const signout = async ()=>{
    clearData()
    let proxyStatus = await storage.getItem("proxyStatus");
    if(proxyStatus=="Connected"||proxyStatus=="Connecting"){
      disconnect()
    }
  }
  return (
    <>
      <Group position="center">
        <Button variant="gradient" gradient={{ from: 'orange', to: 'red' }} onClick={signout}>Sign Out</Button>
      </Group>
    </>
  )
}

export default Settings
