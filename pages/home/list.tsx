import { Box, Button, Group, Input, Stack, Switch, Text, UnstyledButton, useMantineTheme, useMantineColorScheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { RiSearchLine } from "react-icons/ri";
import { storage } from "~helpers/storage";
import type { NodeDataType, countryInfoType } from "~pages/load";
import { FcGlobe } from "react-icons/fc";
import { FlagIcon } from "./flagicon";
import { ArrowDownIcon as ArrowDown, ArrowUpIcon as ArrowUp } from "@phosphor-icons/react";

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
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    
    const [countryInfo, setCountryData] = useState<countryInfoType | undefined>(undefined);
    const [nodeData, setNodeData] = useState<NodeDataType[] | undefined>(undefined);
    const [advancedView, setAdvancedView] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [avgPrice, setAvgPrice] = useState(0.00);
    const [searchQuery, setSearchQuery] = useState('');

    async function loadValues() {
      setAdvancedView(await storage.getItem("advancedView"))
      setAvgPrice(await storage.getItem("avgPrice"))
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
          if (chunk) {
            mergedGroupedData = [...mergedGroupedData, ...chunk];
          }
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

      const advancedViewCb = {"advancedView":(key: any)=>{setAdvancedView(key.newValue)}}
      storage.watch(advancedViewCb)
      return () => { storage.unwatch(advancedViewCb) }
    }, []);
  
    const sortedEntries = Object.entries(countryInfo ?? {})
  .filter(([countryName, countryData]) => countryData[0].traffic_price_ether <= avgPrice || advancedView)
  .filter(([countryName]) => countryName.toLowerCase().includes(searchQuery.toLowerCase()))
  .sort(([countryA], [countryB]) => countryA.localeCompare(countryB));

  const handleCountryClick = (countryName: string) => {
      setSelectedCountry(countryName);
    };

    return (
      <>
        {Object.keys(countryInfo ?? {}).length === 0 ? (
          <>
            <Group position="center">
              <Text c={isDark ? "dimmed" : "gray.6"}>No Servers Available</Text>
            </Group>
          </>
        ) : (
          <>
          <Group position="apart" style={{ backgroundColor: isDark ? theme.colors.dark[7] : theme.colors.gray[0], borderWidth: 1, borderColor: isDark ? theme.colors.dark[5] : theme.colors.gray[3], borderStyle: 'solid', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
            <Group>
              <Text c={isDark ? "gray.3" : "dark.7"} size="sm" weight={600}>Manual Node Selection</Text>
            </Group>
            <Switch size="sm" color="cube" checked={advancedView} onChange={(event)=>{setAdvView(event.currentTarget.checked);setSelectedCountry(null)}}/>
          </Group>
          
          {advancedView ? <NodeList close={close} countryName={selectedCountry} nodeData={nodeData} countryInfo={countryInfo} /> : ""}

          {selectedCountry==null && <Input
            mb={8}
            placeholder="Search country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            icon={<RiSearchLine size="0.9rem" />}
            radius="md"
            styles={{
              input: {
                backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
                borderColor: isDark ? theme.colors.dark[4] : theme.colors.gray[3],
                color: isDark ? theme.colors.gray[2] : theme.colors.dark[8],
                '&::placeholder': { color: isDark ? theme.colors.dark[2] : theme.colors.gray[5] },
                '&:focus': { borderColor: theme.colors.cube[5] },
              },
              icon: { color: isDark ? theme.colors.dark[2] : theme.colors.gray[5] }
            }}
          />}

          {selectedCountry==null ? <>
            <Stack w="100%" spacing={4}>
              <UnstyledButton
                sx={(theme) => ({
                  display: 'flex', width: '100%', padding: '10px 14px', borderRadius: theme.radius.md,
                  transition: 'background-color 150ms ease',
                  '&:hover': { backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[1] }
                })}
                onClick={() => {
                  close("countryName", countryInfo ,nodeData, true, 0, 0)
                }}
              >
                <Group position="apart" w="100%" align="center">
                  <Group spacing="sm">
                    <Box style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FcGlobe size="1.2rem" />
                    </Box>
                    <Text weight={600} size="sm" color={isDark ? "gray.2" : "dark.8"}>Random</Text>
                  </Group>
                  <Text size="xs" weight={500} color={isDark ? "cube.4" : "cube.6"}>Lowest Price</Text>
                </Group>
              </UnstyledButton>
              {sortedEntries.map(([country_Name, countryData]) => {
                return (
                  <UnstyledButton
                    key={country_Name}
                    sx={(theme) => ({
                      display: 'flex', width: '100%', padding: '10px 14px', borderRadius: theme.radius.md,
                      transition: 'background-color 150ms ease',
                      '&:hover': { backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[1] }
                    })}
                    onClick={() => {
                      advancedView ? handleCountryClick(country_Name) :
                      close(country_Name, countryInfo ,nodeData, false, 0, 0)
                    }}
                  >
                    <Group position="apart" w="100%" align="center">
                      <Group spacing="sm">
                        <Box style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FlagIcon country={countryData[0].country_iso} />
                        </Box>
                        <Text weight={500} size="sm" color={isDark ? "gray.3" : "dark.7"} style={{maxWidth:"150px",textOverflow:"ellipsis",whiteSpace:"nowrap",overflow:"hidden"}}>{country_Name}</Text>
                      </Group>
                      <Text size="xs" weight={600} color={isDark ? "gray.5" : "dark.3"} style={{ fontVariantNumeric: 'tabular-nums' }}>{(countryData[0].traffic_price_ether).toString()} Ø</Text>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </>: <>
          <Stack w="100%">
            <Button size="sm" fullWidth color="cube" variant="light" leftIcon={<FaArrowLeft size={12} />} onClick={()=>{setSelectedCountry(null)}}>Back</Button>
          </Stack>
          </>
          }
            
          </>
        )}
      </>
    );
  }

 function NodeList({ close, countryName, nodeData, countryInfo }: NodeListParam) {
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const speeds = (nodeId: number) =>
      nodeData?.find((node) => node.node_id === nodeId) ?? { download: "–", upload: "–" }

    const handleNodeClick = (nodeId: number) => {
        const selectedCountryData = countryInfo?.[countryName];
        const selectedNode = selectedCountryData?.find((node) => node.node_id === nodeId);
        if (!selectedNode) return
        close(countryName, countryInfo, nodeData, false, nodeId, selectedNode.traffic_price_ether);
      }

    return (
      <>
      {countryInfo?.[countryName]!=null ? <>
              {Object.keys(countryInfo ?? {}).length === 0 ? (
          <>
            <Group position="center">
              <Text c={isDark ? "dimmed" : "gray.6"}>No Servers Available</Text>
            </Group>
          </>
        ) : (
          <>
            
          <Stack w="100%" spacing={6}>
            <Group position="apart" px={4} pb={4} style={{ borderBottom: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}` }}>
              <Text size="xs" weight={600} color={isDark ? "dimmed" : "gray.5"} tt="uppercase" style={{ letterSpacing: 0.5 }}>Available Nodes</Text>
              <Text size="xs" weight={600} color="dimmed">{countryInfo[countryName].length} total</Text>
            </Group>
            {countryInfo[countryName].map((node) => (
              <UnstyledButton
                key={node.node_id}
                onClick={() => handleNodeClick(node.node_id)}
                sx={(theme) => ({
                  display: 'flex', width: '100%',
                  borderWidth: 1, borderColor: isDark ? theme.colors.dark[5] : theme.colors.gray[3], borderStyle: 'solid', 
                  borderRadius: theme.radius.md, padding: '10px 14px',
                  backgroundColor: isDark ? theme.colors.dark[6] : theme.white,
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                  '&:hover': { 
                    backgroundColor: isDark ? theme.colors.dark[5] : theme.colors.gray[0],
                    borderColor: theme.colors.cube[5]
                  }
                })}
              >
                <Group position="apart" w="100%" align="center">
                  <Text weight={600} size="sm" color={isDark ? "gray.2" : "dark.8"}>Node #{node.node_id}</Text>
                  <Group spacing={8} noWrap>
                    <Group spacing={4} noWrap bg={isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'} px={6} py={2} style={{ borderRadius: 4 }}>
                      <ArrowDown color={theme.colors.green[6]} weight="bold" size={14} />
                      <Text size="xs" weight={600} color={isDark ? "gray.3" : "gray.7"}>{speeds(node.node_id).download} <span style={{fontSize: '9px', opacity: 0.7}}>Mb</span></Text>
                    </Group>
                    <Group spacing={4} noWrap bg={isDark ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)'} px={6} py={2} style={{ borderRadius: 4 }}>
                      <ArrowUp color={theme.colors.blue[6]} weight="bold" size={14} />
                      <Text size="xs" weight={600} color={isDark ? "gray.3" : "gray.7"}>{speeds(node.node_id).upload} <span style={{fontSize: '9px', opacity: 0.7}}>Mb</span></Text>
                    </Group>
                  </Group>
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
  
