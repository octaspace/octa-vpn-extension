import { Group, Stack, Text, UnstyledButton } from "@mantine/core";
import * as CountryIcons from 'country-flag-icons/react/3x2'
import { useEffect, useState } from "react";
import { storage } from "~helpers/storage";
import type { countryInfoType } from "~pages/load";
interface ListParam {
    close(country: string, data: countryInfoType): void;
  }
  
  export function List({ close }: ListParam) {
    const [nodeInfo, setNodeInfo] = useState<countryInfoType | undefined>(undefined);
  
    useEffect(() => {
      const fetchData = async () => {
        const totalChunks: number = await storage.getItem('countryInfoChunks');
  
        let mergedGroupedData: countryInfoType = {};
  
        for (let i = 0; i <= totalChunks; i++) {
          const chunkKey = `countryInfo${i}`;
          const chunk: countryInfoType = await storage.getItem(chunkKey);
  
          if (chunk) {
            mergedGroupedData = { ...mergedGroupedData, ...chunk };
          }
        }

        setNodeInfo(mergedGroupedData);
      };
  
      fetchData();
    }, []);
  
    const sortedEntries = Object.entries(nodeInfo ?? {}).sort(([countryA], [countryB]) =>
      countryA.localeCompare(countryB)
    );
  
    return (
      <>
        {Object.keys(nodeInfo ?? {}).length === 0 ? (
          <>
            <Group position="center">
              <Text c="white">No Servers Available</Text>
            </Group>
          </>
        ) : (
          <>
            <Stack w={280}>
              {sortedEntries.map(([countryName, countryData]) => {
                const CountryIconComponent = CountryIcons[countryData[0].country_iso];
                return (
                  <UnstyledButton
                    key={countryName}
                    onClick={() => close(countryName, nodeInfo)}
                    style={{ borderWidth: 2, borderColor: 'grey', borderStyle: 'solid', borderRadius: 10, padding: 5 }}
                  >
                    <Group position="apart">
                      <CountryIconComponent title={countryName} height={25} style={{ borderRadius: 5 }} />
                      {countryName.length>20 ? <><Text color="white" style={{textAlign:"center",fontSize:"14px"}}>{countryName}</Text></> : <><Text color="white" style={{textAlign:"center"}}>{countryName}</Text></>}
                      <Text color="white">{(countryData[0].traffic_price*0.01).toString()}</Text>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </>
        )}
      </>
    );
  }
  