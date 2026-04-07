import { useMantineTheme, useMantineColorScheme } from '@mantine/core';
import * as CountryIcons from 'country-flag-icons/react/3x2'
import { RiMapPin2Line } from 'react-icons/ri';

interface FlagIconProps{
    country:string
}

export function FlagIcon({country}:FlagIconProps){
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const theme = useMantineTheme();

    const CountryIconComponent = CountryIcons[country];
    return(
        <>
        {!country || !CountryIconComponent
            ? <RiMapPin2Line size={20} color={isDark ? theme.colors.gray[5] : theme.colors.gray[6]} />
            : <CountryIconComponent height={20} style={{borderRadius:5, display:'block'}} />
        }
        </>
    )
}