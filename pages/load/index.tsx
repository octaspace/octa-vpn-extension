import { Text, useMantineTheme, Box } from "@mantine/core";
import { keyframes } from "@emotion/react";
import logo from "data-base64:~assets/img/octa.png";
import { Image } from '@mantine/core';
import { useEffect, useState } from "react";
import { updateBalance } from "~helpers/balance";
import { NotifiyError } from "~components/notifiyerror";
import { RiGlobalLine } from "react-icons/ri";
import type { VpnNode } from "@octaspace/sdk";
import { secureStorage, storage } from "~helpers/storage";
import { wait } from "~helpers/wait";
import { OctaAuthenticationError, OctaClient, OctaError } from "@octaspace/sdk";
import { BsEmojiDizzy } from "react-icons/bs";
import { LocalInfo } from "~helpers/localinfo";

export type SelectedVPNNode = {
  node_id: number;
  country: string;
  country_iso: string;
  traffic_price_ether: number;
};

export type NodeDataType = {
  node_id: number;
  download:string;
  upload:string;
};


export type countryInfoType = { 
  [country: string]: { 
    node_id: number; 
    traffic_price_ether: number 
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
      const { country, node_id, traffic_price_ether, country_iso } = node;
      acc[country] = acc[country] || [];
      acc[country].push({ node_id, traffic_price_ether, country_iso });
      return acc;
    }, {});
    for (const country in groupedData) {
      groupedData[country].sort((a, b) => a.traffic_price_ether - b.traffic_price_ether);
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
      let timestamp:number = await storage.getItem("last_interacted")
      let nodeDataChunks = await storage.getItem("nodeInfoChunks")
      let countryDataChunks = await storage.getItem("countryInfoChunks")
      let avgPrice:number = await storage.getItem("avgPrice")
      //fetch new data not before 1 hour
      if((Date.now()-timestamp)>3_600_000||nodeDataChunks==undefined||countryDataChunks==undefined||avgPrice==0.00){
        LocalInfo()
        const octa = new OctaClient({ apiKey: await secureStorage.getItem("token") })
        let data:VpnNode[] = await octa.services.vpn.available()
        const avgTrafficPrice:number = parseFloat((data.reduce((sum, node) => sum + (node.traffic_price_ether), 0) / data.length).toFixed(2));
        await storage.setItem("avgPrice",avgTrafficPrice)
        // Clear stale chunks before saving fresh data
        await clearOldChunks("countryInfo", "countryInfoChunks")
        await clearOldChunks("nodeInfo", "nodeInfoChunks")
        let countryData: SelectedVPNNode[] = data.map(node => ({
          node_id: node.node_id,
          country: node.country,
          country_iso: node.country_iso.toUpperCase(),
          traffic_price_ether: parseFloat((node.traffic_price_ether).toFixed(4))
        }));
        let nodeData: NodeDataType[] = data.map(node => ({
          node_id: node.node_id,
          download: Number(node.net_down_mbits / 125_000).toFixed(0),
          upload: Number(node.net_up_mbits / 125_000).toFixed(0),
        }));
        await saveCountryData(countryData)
        await saveNodeData(nodeData)
        let balance = ((await octa.accounts.balance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
      }
      await storage.setItem("last_interacted",Date.now())
    }
    catch(err:any)
    {
      if(err instanceof OctaAuthenticationError){
        await secureStorage.set("token", "")
        await storage.setItem("authExpired", true)
      } else if(err instanceof OctaError){
        NotifiyError('Network Error', <RiGlobalLine />)
      } else {
        console.error("loadNodes error:", err)
        NotifiyError("Failed to load nodes", <BsEmojiDizzy />)
      }
    }
    finally {
      // Always hide the loader — even on error
      await wait(1000)
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
    updateBalance()
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
