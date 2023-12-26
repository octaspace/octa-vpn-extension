import { useState } from "react"
import { clearData, setToken, storage } from "~helpers/storage";
import logo from "data-base64:~assets/img/octa.png";
import { ActionIcon, Box, Button, Group, Overlay, Stack, TextInput, Title } from '@mantine/core';
import { Image } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RiQuestionLine, RiKeyFill } from "react-icons/ri";
import { Octa } from "@octaspace/api.js";
import { wait } from "~helpers/wait";

function Login() {
  const [IsLoading, setIsLoading] = useState(false)

  async function submit(apikey:string) {
    try{
      await clearData()
      let octa = new Octa(apikey)
      const data = await octa.getAccountInfo()
      setIsLoading(false)
      if(data.deposit_address){
        setToken(apikey);
        form.setFieldError('apikey', "Success");
        await wait(2000)
      }
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

  return (
    <>
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
          rightSection={<ActionIcon color="dark" onClick={() => window.open("https://cube.octa.space/settings")} variant="filled"><RiQuestionLine size={14} /></ActionIcon>}
          {...form.getInputProps('apikey')} />
          <Button type="submit" loading={IsLoading} fullWidth mt="sm">
            Submit
          </Button>
      </form>
    </Box>
    </Stack>
    </Box>
          </>
  )
}

export default Login
