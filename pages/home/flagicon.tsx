import { Text } from '@mantine/core';
import * as CountryIcons from 'country-flag-icons/react/3x2'
import { useEffect, useState } from 'react';
import { storage } from '~helpers/storage';


export function FlagIcon(){
    const [country, setCountry] = useState("");
    storage.watch({"country":(key)=>{setCountry(key.newValue)}})

    const loadCountry = async () =>{
        setCountry(await storage.getItem("country"))
    }

    useEffect(()=>{
        loadCountry()
    },[country])

    const CountryIconComponent = CountryIcons[country];
    return(
        <>
        {country=="" ? <><Text c="white">Select Node</Text></> : 
        <>
            <CountryIconComponent height={20} style={{borderRadius:5}}/>
        </>
        }
        </>
    )
}