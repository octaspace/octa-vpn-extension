import { Button, Group, ScrollArea, Stack } from "@mantine/core";
import { useEffect } from "react";
import fetch from 'node-fetch';
import { useRemark } from 'react-remark';
import { NotifiyError } from "~components/notifiyerror";
import { RiGlobalLine } from "react-icons/ri";

interface TOSProps{
    close(isUserAccepted:boolean):void
}
export function TOS({close}:TOSProps){
    const [tosData, setTOSData] = useRemark();

    async function fetchData() {
        try{
            const response = await fetch("https://raw.githubusercontent.com/octaspace/octaspace/main/tos_octavpn.md",{method: 'GET',headers: {'Content-Type': 'application/json'}});
            if(response.status==200){
                const data: string = await response.text();
                let lines = data.split("\n")
                lines.shift()
                lines.join("\n")
                setTOSData(lines.join("\n"))
            }
        }
        catch(err:any){
            NotifiyError("Network Error",<RiGlobalLine />)
        }
    }

    useEffect(()=>{
        fetchData()
    },[])
    return(
        <>
        <Stack w={280}>
            <ScrollArea h={320}>
            {tosData}
            </ScrollArea>
            <Group position="apart">
                <Button styles={{root:{backgroundColor:"red", "&:hover":{backgroundColor:"red", opacity:"0.8"}}}} onClick={()=>{close(false)}}>Cancel</Button>
                <Button styles={{root:{backgroundColor:"green", "&:hover":{backgroundColor:"green", opacity:"0.8"}}}} onClick={()=>{close(true)}}>Accept</Button>
            </Group>
            </Stack>
        </>
    )
}