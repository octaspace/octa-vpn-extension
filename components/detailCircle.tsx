import { Box, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface DetailCircleProps{
    icon:ReactNode
    data:string
    title:string
}

export function DetailCircle({icon,data,title}:DetailCircleProps){
    return(
        <>
        <Stack h={150} w={50} align="center" spacing="xs">
        <Box h={50} w={50} style={{
              border:"2px solid cyan",
                justifyContent:"center",
                alignItems:"center",
                borderRadius:'50%',
                backgroundColor:"black",
                display:"flex",
            }}>
                {icon}
            </Box>
            <Text color="white" style={{fontWeight:"bold", fontSize:"13px"}}>{data}</Text>
            <Text style={{fontSize:"13px",fontWeight:"bold"}} color="white">{title}</Text>
        </Stack>
        </>
    )
}