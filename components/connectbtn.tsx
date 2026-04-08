import { UnstyledButton, useMantineTheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { FaPowerOff } from "react-icons/fa6";
import { connect, disconnect } from "~helpers/connection";
import { storage } from "~helpers/storage";

interface HomeButtonProps{
    node_id:number
}

export function HomeButton({node_id}:HomeButtonProps){
    const [Status, setStatus] = useState("")
    const [hovered, setHovered] = useState(false)
    const theme = useMantineTheme()
    
    const isDark = theme.colorScheme === 'dark'

    useEffect(()=>{
        async function getStatus(){
            const status:string = await storage.getItem("proxyStatus")
            setStatus(status)
        }
        getStatus()

        const proxyCb = {"proxyStatus":(key: any)=>{ setStatus(key.newValue) }}
        storage.watch(proxyCb)
        return () => { storage.unwatch(proxyCb) }
    },[])

    const activeBg1 = Status === 'Connecting'
        ? (isDark ? 'rgba(230, 119, 0, 0.2)' : 'rgba(255, 169, 77, 0.3)')
        : Status === 'Connected'
            ? theme.fn.rgba(theme.colors.cube[5], 0.2)
            : hovered
                ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')

    const activeBg2 = Status === 'Connecting'
        ? (isDark ? 'rgba(230, 119, 0, 0.4)' : 'rgba(255, 169, 77, 0.6)')
        : Status === 'Connected'
            ? theme.fn.rgba(theme.colors.cube[5], 0.3)
            : hovered
                ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.13)')
                : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')

    const iconColor = Status === 'Connecting'
        ? theme.colors.orange[5]
        : Status === 'Connected'
            ? theme.colors.cube[5]
            : (isDark ? theme.colors.gray[6] : theme.colors.gray[4])

    return(
        <>
        <UnstyledButton
            onClick={()=>{
                if(Status === "Connecting") return
                Status === "Disconnected" ? connect(node_id) : disconnect()
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ transition: 'transform 150ms ease', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
            onMouseDown={(e:any) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e:any) => e.currentTarget.style.transform = hovered ? 'scale(1.04)' : 'scale(1)'}
        >
            <div style={{
                justifyContent:"center",
                alignItems:"center",
                borderRadius:'50%',
                backgroundColor: activeBg1,
                height:140,
                width:140,
                display:"flex",
                transition: 'background-color 250ms ease',
            }}>
                <div style={{
                    borderRadius:'50%',
                    position:"relative",
                    justifyContent:"center",
                    alignItems:"center",
                    backgroundColor: activeBg2,
                    height:100,
                    width:100,
                    display:"flex",
                    transition: 'background-color 250ms ease, box-shadow 250ms ease',
                    boxShadow: Status === 'Connected'
                        ? `0 0 30px ${theme.fn.rgba(theme.colors.cube[5], 0.5)}`
                        : hovered
                            ? (isDark ? '0 0 20px rgba(255,255,255,0.1)' : '0 0 20px rgba(0,0,0,0.12)')
                            : 'none'
                }}>
                    <FaPowerOff style={{color: iconColor, transition: 'color 300ms ease, transform 150ms ease', transform: hovered ? 'scale(1.1)' : 'scale(1)'}} size={38} />
                </div>
            </div>
        </UnstyledButton>
        </>
    )
}