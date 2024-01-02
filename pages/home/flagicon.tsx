import { Text } from '@mantine/core';
import * as CountryIcons from 'country-flag-icons/react/3x2'

interface FlagIconProps{
    country:string
}

export function FlagIcon({country}:FlagIconProps){

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