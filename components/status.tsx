import { Text, useMantineColorScheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { storage } from "~helpers/storage";


export function Status(){
    const [Status, setStatus] = useState("")
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    useEffect(()=>{
        storage.watch({"proxyStatus":(key)=>{ setStatus(key.newValue) }})
        async function getStatus(){
            setStatus(await storage.getItem("proxyStatus"))
        }
        getStatus()
    },[])
    return(
        <>
        <Text fw={"bold"} color={isDark ? "white" : "dark.9"}>{Status}</Text>
        </>
    )
}