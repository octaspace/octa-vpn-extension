import { UnstyledButton } from "@mantine/core";
import { useEffect, useState } from "react";
import { FaPowerOff } from "react-icons/fa6";
import { connect, disconnect } from "~helpers/connection";
import { storage } from "~helpers/storage";

interface HomeButtonProps{
    node_id:number
}

export function HomeButton({node_id}:HomeButtonProps){
    const [Status, setStatus] = useState("")
    const [BackCir1Color, setBackCir1Color] = useState("rgba(0, 0, 0, 0.1)")
    const [BackCir2Color, setBackCir2Color] = useState("rgba(0, 0, 0, 0.3)")
    const [IconColor, setIconColor] = useState("white")

    storage.watch({"proxyStatus":(key)=>{
        setStatus(key.newValue)
    }})
    useEffect(()=>{
        async function getStatus(){
            let status:string = await storage.getItem("proxyStatus")
            setStatus(status)
            if(status=="Connecting"){
                setBackCir1Color("rgba(255, 209, 128, 0.5)")
                setBackCir2Color("rgba(255, 209, 128, 1)")
                setIconColor("red")
            }
            if(status=="Connected"){
                setBackCir1Color("rgba(200, 230, 201, 0.5)")
                setBackCir2Color("rgba(200, 230, 201, 1)")
                setIconColor("red")
            }
            if(status=="Disconnected"||status=="NoPermission"){
                setBackCir1Color("rgba(0, 0, 0, 0.1)")
                setBackCir2Color("rgba(0, 0, 0, 0.3)")
                setIconColor("white")
            }
        }
        getStatus()
    },[Status])

    return(
        <>
        <UnstyledButton onClick={()=>{console.log(Status);Status=="Disconnected" ? connect(node_id): disconnect()}}>
            <div style={{
                justifyContent:"center",
                alignItems:"center",
                borderRadius:'50%',
                backgroundColor:BackCir1Color,
                height:100,
                width:100,
                display:"flex",
                zIndex:0
            }}>

                <div style={{
                    borderRadius:'50%',
                    position:"relative",
                    justifyContent:"center",
                    alignItems:"center",
                    backgroundColor:BackCir2Color,
                    height:80,
                    width:80,
                    display:"flex",
                    zIndex:1
                }}>
                    <FaPowerOff style={{color:IconColor}} size={30}  />
                </div>
            </div>
        </UnstyledButton>
        </>
    )
}