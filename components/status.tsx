import { Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { storage } from "~helpers/storage";


export function Status(){
    const [Status, setStatus] = useState("")
    storage.watch({"proxyStatus":(key)=>{setStatus(key.newValue)}})
    useEffect(()=>{
        async function getStatus(){
            setStatus(await storage.getItem("proxyStatus"))
        }
        getStatus()
    })
    return(
        <>
        <Text fw={"bold"} color="white">{Status}</Text>
        </>
    )
}