import { useState } from "react"
import { Button, ConfigProvider, Space } from 'antd';
import Login from "~pages/login";

function Home() {
  const [data, setData] = useState("")
  const [isLoggedIn, setisLoggedIn] = useState(false)
  return (
    <div
      style={{
        textalign:"center"
      }}>
        <p>Homepage, loggedin</p>
    </div>
  )
}

export default Home
