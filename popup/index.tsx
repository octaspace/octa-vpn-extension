import { useEffect, useState } from "react"
import { Button, ConfigProvider, Space, Spin } from 'antd';
import Login from "~pages/login";
import Home from "~pages/home";
import { tokenExists } from "~helpers/login";
import { LoadingOutlined } from '@ant-design/icons';

function IndexPopup() {
  const [data, setData] = useState("")
  const [isLoggedIn, setisLoggedIn] = useState(false)
  const [isLoading, setisLoading] = useState(true)
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  useEffect(()=>{
    async function fetchData() {
        setisLoggedIn(await tokenExists())
        setisLoading(false)
    }
    fetchData();
})
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifycontent: "center",
        alignitems: "center",
        width: 350,
        height:500,
        backgroundImage: "linear-gradient(150deg,#CC1B99, #040308, #471288)",
      }}>
        {isLoading ?? <Spin indicator={antIcon} />}
        {isLoggedIn ? <Home /> : <Login />}
    </div>
  )
}

export default IndexPopup
