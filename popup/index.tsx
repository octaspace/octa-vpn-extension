import { useEffect, useState } from "react"
import Login from "~pages/login";
import Home from "~pages/home";
import { tokenExists } from "~helpers/storage";
import { Loader } from '@mantine/core';
import { ThemeProvider } from "~theme";
import { storage } from "~helpers/storage";

function IndexPopup() {
  const [isLoggedIn, setisLoggedIn] = useState(false)
  const [isLoading, setisLoading] = useState(true)

  useEffect(()=>{
    storage.watch({"token":()=>{fetchData()}})
    async function fetchData() {
        setisLoggedIn(await tokenExists())
        setisLoading(true)
    }
    fetchData();
})
  return (
    <>
    <ThemeProvider withNormalizeCSS withGlobalStyles>

        {isLoading ?? <Loader />}
        {isLoggedIn ? <Home /> : <Login />}
      </ThemeProvider>
      </>
  )
}

export default IndexPopup
