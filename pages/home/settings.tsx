import { Button, Group } from "@mantine/core";
import { clearData } from "~helpers/storage";

function Settings() {
  return (
    <>
      <Group position="center">
        <Button variant="gradient" gradient={{ from: 'orange', to: 'red' }} onClick={clearData}>Sign Out</Button>
      </Group>
    </>
  )
}

export default Settings
