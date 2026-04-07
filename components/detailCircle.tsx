import { Box, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { forwardRef, type ReactNode } from "react";

interface DetailCircleProps{
    icon:ReactNode
    data:string
    title:string
}

export const DetailCircle = forwardRef<HTMLDivElement, DetailCircleProps>(
    ({ icon, data, title }, ref) => {
        const { colorScheme } = useMantineColorScheme();
        const isDark = colorScheme === 'dark';
        
        return (
        <>
        <Stack h={150} w={50} align="center" spacing="xs">
        <Box ref={ref} h={50} w={50} style={{
              border:"2px solid cyan",
                justifyContent:"center",
                alignItems:"center",
                borderRadius:'50%',
                backgroundColor:"black",
                display:"flex",
            }}>
                {icon}
            </Box>
            <Text color={isDark ? "white" : "dark.9"} style={{fontWeight:"bold", fontSize:"13px"}}>{data}</Text>
            <Text style={{fontSize:"13px",fontWeight:"bold"}} color={isDark ? "white" : "dark.9"}>{title}</Text>
        </Stack>
        </>
    )}
  );