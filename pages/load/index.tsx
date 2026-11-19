import { Text, useMantineTheme, Box } from "@mantine/core";
import { keyframes } from "@emotion/react";
import logo from "data-base64:~assets/img/octa.png";
import { Image } from '@mantine/core';
import { useEffect, useState } from "react";
import { notify } from "~components/notify";
import { RiGlobalLine } from "react-icons/ri";
import { getToken, setToken, storage } from "~helpers/storage";
import { OctaAuthenticationError, OctaError } from "@octaspace/sdk";
import { createApi } from "~helpers/octa";
import { NODES_TTL_MS } from "~helpers/config";

export type SelectedVPNNode = {
  node_number: string;
  country: string;
  country_iso: string;
  price: number;
};

export type NodeDataType = {
  node_number: string;
  download:string;
  upload:string;
};


export type countryInfoType = { 
  [country: string]: { 
    node_number: string; 
    price: number 
    country_iso: string 
  }[]}

export function Load(){
  const [applyScale, setApplyScale] = useState(false);
  const [zIndexValue, setZIndexValue] = useState(5);
  const theme = useMantineTheme()
  const isDark = theme.colorScheme === 'dark'

  async function clearOldChunks(prefix: string, countKey: string) {
    const oldCount: number = await storage.getItem(countKey)
    if (oldCount != null && oldCount >= 0) {
      const removals: Promise<void>[] = []
      for (let i = 0; i <= oldCount; i++) {
        removals.push(storage.removeItem(`${prefix}${i}`))
      }
      await Promise.all(removals)
    }
  }

  async function saveCountryData(selectedData: SelectedVPNNode[]) {
    let groupedData: countryInfoType = selectedData.reduce((acc, node) => {
      const { country, node_number, price, country_iso } = node;
      acc[country] = acc[country] || [];
      acc[country].push({ node_number, price, country_iso });
      return acc;
    }, {});
    for (const country in groupedData) {
      groupedData[country].sort((a, b) => a.price - b.price);
    }
    const countryKeys = Object.keys(groupedData);
    const countryPerChunk = 1;
    for (let i = 0; i < countryKeys.length; i += countryPerChunk) {
      const chunkKeys = countryKeys.slice(i, i + countryPerChunk);
      const chunk: countryInfoType = {};
      chunkKeys.forEach((countryKey) => {
        chunk[countryKey] = groupedData[countryKey];
      });
      await storage.setItem(`countryInfo${i / countryPerChunk}`, chunk);
    }
    // Set final count AFTER loop — reflects actual number of chunks saved
    await storage.setItem("countryInfoChunks", Math.ceil(countryKeys.length / countryPerChunk) - 1)
  }

  async function saveNodeData(selectedData: NodeDataType[]) {
    const nodesPerChunk = 50;
    for (let i = 0; i < selectedData.length; i += nodesPerChunk) {
      const chunk = selectedData.slice(i, i + nodesPerChunk);
      const chunkNumber = Math.floor(i / nodesPerChunk);
      await storage.setItem(`nodeInfo${chunkNumber}`, chunk);
    }
    // Set final count AFTER loop
    await storage.setItem("nodeInfoChunks", Math.floor((selectedData.length - 1) / nodesPerChunk))
  }

  async function loadNodes() {
    try{
      const api = createApi(await getToken())
      const [balance, geo] = await Promise.all([api.balance(), api.geo().catch(() => null)])
      await storage.setItem("balance", balance.toFixed(2))
      // the real address: the API is never proxied
      if (geo) {
        await storage.setItem("ipLocal", geo.ip)
        await storage.setItem("countryLocal", geo.country)
        await storage.setItem("cityLocal", geo.city)
      }
      // with a key the listing is at most 10 s old: no point keeping it long
      const timestamp: number = (await storage.getItem("last_interacted")) ?? 0
      if (Date.now() - timestamp > NODES_TTL_MS || (await storage.getItem("nodeInfoChunks")) == undefined) {
        const nodes = await api.nodes()
        await clearOldChunks("countryInfo", "countryInfoChunks")
        await clearOldChunks("nodeInfo", "nodeInfoChunks")
        await saveCountryData(nodes.map(({ node_number, country, country_iso, price }) => ({ node_number, country, country_iso, price })))
        await saveNodeData(nodes.map((n) => ({ node_number: n.node_number, download: String(n.down), upload: String(n.up) })))
        await storage.setItem("last_interacted", Date.now())
      }
    }
    catch(err:any)
    {
      if(err instanceof OctaAuthenticationError){
        await setToken("")
        await storage.setItem("authExpired", true)
      } else if(err instanceof OctaError){
        notify('Network Error', <RiGlobalLine />)
      } else {
        console.error("loadNodes error:", err)
        notify("Failed to load nodes")
      }
    }
    finally {
      // Always hide the loader — even on error
      await new Promise((r) => setTimeout(r, 1000))
      setZIndexValue(-3)
    }
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setApplyScale(prevState => !prevState);
    }, 800);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(()=>{
    setZIndexValue(5)
    loadNodes()
  }, [])

  const pulseGlow = keyframes`
    0% { transform: scale(0.8); opacity: 0.1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(0.8); opacity: 0.1; }
  `;

  const shimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  `;
  
    return(
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 350,
          height: 520,
          top: 0,
          left: 0,
          position: "absolute",
          backgroundColor: isDark ? theme.colors.dark[8] : theme.fn.lighten(theme.colors.gray[1], 0.5),
          zIndex: zIndexValue,
          overflow: "hidden",
        }}
      >
        {/* Animated Background Glow */}
        <Box
          sx={{
            position: 'absolute',
            top: 117, // Center is exactly at 217px to match the power button on the main screen
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${theme.colors.cube[5]} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            animation: `${pulseGlow} 4s ease-in-out infinite`,
            zIndex: 1,
          }}
        />

        {/* Logo Container */}
        <Box
          sx={{
            position: 'absolute',
            top: 157, // Center is exactly at 217px
            width: 120,
            height: 120,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: applyScale ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <Image
            width={56}
            alt="OctaVPN"
            src={logo}
            style={{
              filter: isDark 
                ? `drop-shadow(0 0 15px ${theme.fn.rgba(theme.colors.cube[5], 0.6)})`
                : `drop-shadow(0 0 10px ${theme.fn.rgba(theme.colors.cube[5], 0.5)})`,
              transition: 'all 0.8s ease-in-out',
            }}
          />
        </Box>

        {/* Text Container aligned with Login page text spacing */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 157 + 120 + 32, // Matches Title placement of Login screen roughly 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: '100%',
            zIndex: 2
          }}
        >
          <Text 
            sx={{
              fontWeight: 700, 
              letterSpacing: 4,
              textTransform: 'uppercase',
              fontSize: 13,
              backgroundImage: isDark 
                ? 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.2) 100%)'
                : `linear-gradient(90deg, ${theme.colors.gray[4]} 0%, ${theme.colors.gray[8]} 50%, ${theme.colors.gray[4]} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${shimmer} 2.5s linear infinite`,
            }}
          >
            Loading
          </Text>
        </Box>
      </Box>
    )
}
