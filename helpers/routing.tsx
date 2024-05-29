import { Route, Routes } from "react-router-dom"
import Home from "~pages/home"
import Login from "~pages/login"
import Main from "~pages/main"

export const Routing = () => (
  <Routes>
    <Route path="/" element={<Main />} />
    <Route path="/home" element={<Home />} />
    <Route path="/login" element={<Login />} />
  </Routes>
)