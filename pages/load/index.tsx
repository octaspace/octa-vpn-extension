import { Text } from "@mantine/core";
import logo from "data-base64:~assets/img/octa.png";
import { Image } from '@mantine/core';
import { useEffect, useState } from "react";
import { updateBalance } from "~helpers/balance";
import { NotifiyError } from "~components/notifiyerror";
import { RiGlobalLine } from "react-icons/ri";
import type { vpnNodes } from "@octaspace/api.js/build/src/types";
import { storage } from "~helpers/storage";
import { wait } from "~helpers/wait";
import { ApiError, Octa } from "@octaspace/api.js";
import { BsEmojiDizzy } from "react-icons/bs";
import { LocalInfo } from "~helpers/localinfo";
import { proxy } from "~background";

export type SelectedVPNNode = {
  node_id: number;
  country: string;
  country_iso: string;
  traffic_price: number;
};

export type NodeDataType = {
  node_id: number;
  download:string;
  upload:string;
};


export type countryInfoType = { 
  [country: string]: { 
    node_id: number; 
    traffic_price: number 
    country_iso: string 
  }[]}

export function Load(){
  const [applyScale, setApplyScale] = useState(false);
  const [zIndexValue, setZIndexValue] = useState(5);

  async function saveCountryData(selectedData){
    let groupedData: countryInfoType = selectedData.reduce((acc, node) => {
      const { country, node_id, traffic_price, country_iso } = node;
      acc[country] = acc[country] || [];
      acc[country].push({ node_id, traffic_price, country_iso });
      return acc;
  }, {});
    selectedData.sort((a, b) => a.country.localeCompare(b.country));
    for (const country in groupedData) {
      groupedData[country].sort((a, b) => a.traffic_price - b.traffic_price);
    }
    const countryKeys = Object.keys(groupedData);
    const countryPerChunk = 1;
    for (let i = 0; i < countryKeys.length; i += countryPerChunk) {
      const chunkKeys = countryKeys.slice(i, i + countryPerChunk);
      const chunk: countryInfoType = {};
    
      chunkKeys.forEach((countryKey) => {
        chunk[countryKey] = groupedData[countryKey];
      });
      await storage.setItem("countryInfoChunks",i/countryPerChunk)
      await storage.setItem(`countryInfo${i / countryPerChunk}`, chunk);
    }
  }

  async function saveNodeData(selectedData: NodeDataType[]) {
    const nodesPerChunk = 50;
    for (let i = 0; i < selectedData.length; i += nodesPerChunk) {
      const chunk = selectedData.slice(i, i + nodesPerChunk);
      const chunkNumber = Math.floor(i / nodesPerChunk);
      await storage.setItem("nodeInfoChunks", chunkNumber);
      await storage.setItem(`nodeInfo${chunkNumber}`, chunk);
    }
  }

  async function loadNodes() {
    try{
      let timestamp:number = await storage.getItem("last_interacted")
      let nodeDataChunks = await storage.getItem("nodeInfoChunks")
      let countryDataChunks = await storage.getItem("countryInfoChunks")
      let avgPrice:number = await storage.getItem("avgPrice")
      //fetch new data not before 2 hours
      if((Date.now()-timestamp)>7200000||nodeDataChunks==undefined||countryDataChunks==undefined||avgPrice==0.00){
        LocalInfo()
        let data:vpnNodes[] = await new Octa(await storage.getItem("token")).getVPNNodes()
        const avgTrafficPrice:number = parseFloat((data.reduce((sum, node) => sum + (node.traffic_price * 0.01), 0) / data.length).toFixed(2));
        await storage.setItem("avgPrice",avgTrafficPrice)
        let countryData: SelectedVPNNode[] = data.map(node => ({
          node_id: node.node_id,
          country: node.country,
          country_iso: node.country_iso.toUpperCase(),
          traffic_price: node.traffic_price
        }));
        let nodeData: NodeDataType[] = data.map(node => ({
          node_id: node.node_id,
          download: (node.net_down_mbs/1000000).toFixed(2),
          upload: (node.net_up_mbs/1000000).toFixed(2),
        }));
        await saveCountryData(countryData)
        await saveNodeData(nodeData)
        let balance = ((await new Octa(await storage.getItem("token")).getAccountBalance()).balance * 1e-18).toFixed(3)
        await storage.setItem("balance",balance)
      }
      await storage.setItem("last_interacted",Date.now())
      await wait(1000)
      setZIndexValue(-3)
    }
    catch(err:any)
    {
      if(err instanceof ApiError){
        NotifiyError('Network Error', <RiGlobalLine />)
        return
      }
      console.log(err.message)
      NotifiyError('Unexpected Error',<BsEmojiDizzy />)
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
  
    return(
        <>
        <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: 350,
        height: 500,
        top:0,
        left:0,
        position: "absolute",
        backgroundImage: "linear-gradient(150deg,#CC1B99, #040308, #471288)",
        zIndex:zIndexValue
      }}>
        <Image
              width={70}
              alt="OctaVPN"
              src={logo}
              style={{
                filter:'drop-shadow(0 0 4mm rgb(160, 0, 210))',
                transform: applyScale ? 'scale(1.2)' : 'scale(1.1)',
                transition: 'transform 0.5s ease-in-out'
              }}
            />
        <Text style={{color:'rgba(255,255,255,0.8)', fontWeight:'bold', position:'absolute', top:400, left: 140}}>Loading...</Text>
      </div>
        </>
    )
}