import { useState } from "react"
import { clearData, setToken } from "~helpers/storage";
import logo from "data-base64:~assets/img/octa.png";
import { ActionIcon, Box, Button, Group, Modal, Overlay, ScrollArea, Stack, Text, TextInput, Title } from '@mantine/core';
import { Image } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RiQuestionLine, RiKeyFill } from "react-icons/ri";
import { Octa } from "@octaspace/api.js";
import { wait } from "~helpers/wait";
import { FaCircleCheck } from "react-icons/fa6";
import { TOS } from "./tos";
import { useDisclosure } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";

function Login() {
  const [IsLoading, setIsLoading] = useState(false)
  const [Status, setStatus] = useState(false)
  const [BtnColor, setBtnColor] = useState("")
  const [openedTOS, { open:openTOS, close:closeTOS }] = useDisclosure(false);
  const navigate = useNavigate();

  async function submit(apikey:string) {
    try{
      await clearData()
      let octa = new Octa(apikey)
      await octa.getAccountInfo()
      setIsLoading(false)
      setBtnColor("green")
      setStatus(true)
      await wait(1000)
      setToken(apikey);
      navigate('/home')
    }
    catch(err:any){
      setIsLoading(false)
      form.setFieldError('apikey', err.message);
    }
  }

  const form = useForm({
    initialValues: { apikey: ''},
    validate: {
      apikey: (value) => {
        if(value.length==0){
          return 'API Key required'
        }
        if(value.length !== 64)
        {
          return 'Invalid Key'
        }
        setIsLoading(true)
        submit(value)
        return undefined;
      }
    },
  });

  function closeModal(isUserAccepted:boolean){
    if(isUserAccepted){
      form.validate()
    }
    closeTOS()
  }
  return (
    <>
        <Modal opened={openedTOS} onClose={closeTOS} scrollAreaComponent={ScrollArea.Autosize} styles={{ title: { color: 'white' } }} overlayProps={{blur: 2,}} title="Terms of Service">
          <TOS close={closeModal} />
        </Modal>

    <Box w={350} h={500} p={10}
      style={{
        backgroundImage: "linear-gradient(150deg,#CC1B99, #040308, #471288)",
      }}>
    <Overlay color="#000" opacity={0.2} zIndex={0}/>
    <Group h={100}></Group>
    <Stack justify="center">
      <Group position="center">
        <Image
              width={70}
              alt="OctaVPN"
              src={logo}
              style={{filter:'drop-shadow(0 0 4mm rgb(160, 0, 210))'}}
            />
        </Group>
      <Group position="center">
        <Title color="#ffffff" style={{zIndex:0}}>OctaVPN</Title>
      </Group>
      <Box maw={320} mx="auto">
        <form onSubmit={form.onSubmit(()=>{})}>
          <TextInput  name="apikey" styles={{label:{color:"white"}}}
          icon={<RiKeyFill color="white" />} 
          placeholder="Enter your API key"
          rightSection={<ActionIcon color="dark" onClick={() => window.open("https://cube.octa.computer/profile")} variant="filled"><RiQuestionLine size={14} /></ActionIcon>}
          {...form.getInputProps('apikey')} />
          <Text ta="center" fw="bold">By proceeding you agree to Octa.Space terms</Text>
          <Button bg={BtnColor} onClick={openTOS} styles={{root:{"&:hover":{backgroundColor:BtnColor}}}} loading={IsLoading} fullWidth mt="sm">
            {Status ? <><FaCircleCheck />
</> : "Submit"}
          </Button>
      </form>
    </Box>
    </Stack>
    </Box>
          </>
  )
}

export default Login
