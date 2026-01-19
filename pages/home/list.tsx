import { Box, Button, Group, HoverCard, Modal, Stack, Switch, Text, UnstyledButton } from "@mantine/core";
import * as CountryIcons from 'country-flag-icons/react/3x2'
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCircleInfo } from "react-icons/fa6";
import { storage } from "~helpers/storage";
import type { NodeDataType, countryInfoType } from "~pages/load";
import { FcGlobe } from "react-icons/fc";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";

interface ListParam {
    close(country: string, data: countryInfoType, nodeData:NodeDataType[], auto:boolean, nodeid:number, node_price:number): void;
  }

  interface NodeListParam {
    countryName:string
    nodeData:NodeDataType[]
    countryInfo:countryInfoType
    close(countryName: string, data: countryInfoType, nodeData:NodeDataType[], auto:boolean, nodeid:number, node_price:number): void;
  }
  
  export function List({ close }: ListParam) {
    const [countryInfo, setCountryData] = useState<countryInfoType | undefined>(undefined);
    const [nodeData, setNodeData] = useState<NodeDataType[] | undefined>(undefined);
    const [advancedView, setAdvancedView] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [avgPrice, setAvgPrice] = useState(0.00);

    async function loadValues() {
      setAdvancedView(await storage.getItem("advancedView"))
      setAvgPrice(await storage.getItem("avgPrice"))
    }

    async function listenValues() {
      storage.watch({"advancedView":(key)=>{setAdvancedView(key.newValue)}})
    }

    async function setAdvView(value:boolean) {
      await storage.setItem("advancedView",value)
    }

    const fetchCountryData = async () => {
      try{
        const totalChunks: number = await storage.getItem('countryInfoChunks');
        let mergedGroupedData: countryInfoType = {};
        for (let i = 0; i <= totalChunks; i++) {
          const chunkKey = `countryInfo${i}`;
          const chunk: countryInfoType = await storage.getItem(chunkKey);
          if (chunk) {
            mergedGroupedData = { ...mergedGroupedData, ...chunk };
          }
        }
        setCountryData(mergedGroupedData);  
      }
      catch(error:any){
        console.error('Error fetching country data:', error);
      }
    };

    const fetchNodeData = async () => {
      try {
        let totalChunks: number = await storage.getItem('nodeInfoChunks');
        let mergedGroupedData: NodeDataType[] = [];
        for (let i = 0; i <= totalChunks; i++) {
          const chunk: NodeDataType[] | null = await storage.getItem(`nodeInfo${i}`);
          mergedGroupedData = [...mergedGroupedData, ...chunk];
        }
        setNodeData(mergedGroupedData);
      } catch (error) {
        console.error('Error fetching node data:', error);
      }
    };

    useEffect(() => {      
      loadValues()
      fetchCountryData()
      fetchNodeData()
      listenValues()
    }, []);
  
    const sortedEntries = Object.entries(countryInfo ?? {})
  .filter(([countryName, countryData]) => countryData[0].traffic_price_ether <= avgPrice || advancedView)
  .sort(([countryA], [countryB]) => countryA.localeCompare(countryB));

  const handleCountryClick = (countryName: string) => {
      setSelectedCountry(countryName);
    };

    return (
      <>
        {Object.keys(countryInfo ?? {}).length === 0 ? (
          <>
            <Group position="center">
              <Text c="white">No Servers Available</Text>
            </Group>
          </>
        ) : (
          <>
          <Group position="apart" style={{ borderWidth: 1, borderColor: 'purple', borderStyle: 'solid', borderRadius: 5, padding: 5 }}>
            <Group>
                <Text c="white">Manual Node Selection</Text>
            </Group>
            <Switch checked={advancedView} onChange={(event)=>{setAdvView(event.currentTarget.checked);setSelectedCountry(null)}}/>
          </Group>
          {advancedView ? <NodeList close={close} countryName={selectedCountry} nodeData={nodeData} countryInfo={countryInfo} /> : ""}
          {selectedCountry==null ? <>
            <Stack w={280}>
            <Group mb={10} position="apart">
            <Box w={50}></Box>
            </Group>
            <UnstyledButton
                    onClick={() => {
                      close("countryName", countryInfo ,nodeData, true, null, null)
                    }}
                  >
                    <Group position="apart">
                      <FcGlobe size="2rem" />
                      <Text color="white">Random</Text>
                      <Text color="white" style={{ marginLeft: 'auto' }}>Lowest</Text>
                    </Group>
                  </UnstyledButton>
              {sortedEntries.map(([countryName, countryData]) => {
                const CountryIconComponent = CountryIcons[countryData[0].country_iso];
                return (
                  <UnstyledButton
                    key={countryName}
                    onClick={() => {
                      advancedView ? handleCountryClick(countryName) :
                      close(countryName, countryInfo ,nodeData, false, null, null)
                    }}
                  >
                    <Group>
                      <CountryIconComponent title={countryName} height={25} style={{ borderRadius: 5 }} />
                      {countryName.length>20 ? <><Text color="white" style={{textAlign:"left",fontSize:"14px"}}>{countryName}</Text></> : <><Text color="white" style={{textAlign:"left"}}>{countryName}</Text></>}
                      <Text style={{ marginLeft: 'auto' }} color="white">{(countryData[0].traffic_price_ether).toString()}</Text>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </>: <>
          <Stack w={280}>
            <Button ml={10} mt={10} w={260} fullWidth leftIcon={<FaArrowLeft color="white" />} onClick={()=>{setSelectedCountry(null)}}>Back</Button>
          </Stack>
          </>
          }
            
          </>
        )}
      </>
    );
  }

 function NodeList({ close, countryName, nodeData, countryInfo }: NodeListParam) {

    const returnNodeData = (nodeId: number):NodeDataType => {
      const selectedNode = nodeData?.find((node) => node.node_id === nodeId);
      return selectedNode
    }

    const handleNodeClick = (nodeId: number) => {
        const selectedCountryData = countryInfo?.[countryName];
        const selectedNode = selectedCountryData?.find((node) => node.node_id === nodeId);
        close(countryName, countryInfo, nodeData, false, nodeId, selectedNode.traffic_price_ether);
      }

    return (
      <>
      {countryInfo[countryName]!=null ? <>
              {Object.keys(countryInfo ?? {}).length === 0 ? (
          <>
            <Group position="center">
              <Text c="white">No Servers Available</Text>
            </Group>
          </>
        ) : (
          <>
            
          <Stack w={280}>
          <Group position="apart">
          </Group>
                      {countryInfo[countryName].map((node) => (
                        <UnstyledButton
                          key={node.node_id}
                          onClick={() => handleNodeClick(node.node_id)}
                          style={{ borderWidth: 1, borderColor: 'grey', borderStyle: 'solid', borderRadius: 5, padding: 5, marginTop: 5 }}
                        >
                          <Group position="apart">
                            <Text color="white">{`${node.node_id}`}</Text>
                                <Text color="white">
                                    <ArrowDown color="white" style={{ verticalAlign: "middle" }} />
                                    {` ${returnNodeData(node.node_id).download} `}
                                    <ArrowUp color="white" style={{ verticalAlign: "middle" }} />
                                   {` ${returnNodeData(node.node_id).upload}`} Mbit
                                </Text>
                          </Group>
                        </UnstyledButton>
                      ))}
                      </Stack>
          </>
        )}
        </>:""}
      
      </>
    );
  }
  
