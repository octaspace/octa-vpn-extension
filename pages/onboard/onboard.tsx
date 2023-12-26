import logo from "data-base64:~assets/img/octa.png";
import {  Box, Button, Overlay, Title } from '@mantine/core';
import { Image } from '@mantine/core';
import { RiArrowRightCircleFill } from "react-icons/ri";

function OnBoard() {


  return (
    <>
    <Box w={350} h={500} p={10}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "linear-gradient(150deg,#CC1B99, #040308, #471288)",
      }}>
    <Overlay color="#000" blur={1} opacity={0.2} zIndex={0}/>
        <Image
              width={70}
              alt="OctaVPN"
              src={logo}
              style={{filter:'drop-shadow(0 0 4mm rgb(160, 0, 210))'}}
            />
        <Title color="#ffffff" style={{zIndex:0}}>OctaVPN</Title>
        <Box maw={320} mx="auto">
      <form onSubmit={console.log}>
        <Button type="submit" fullWidth mt="sm">
        <RiArrowRightCircleFill size={20} />
        </Button>
      </form>
    </Box>
    </Box>
          </>
  )
}

export default OnBoard
