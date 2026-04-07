import type { EmotionCache, MantineProviderProps } from "@mantine/core"
import { type ColorScheme, ColorSchemeProvider, MantineProvider } from "@mantine/core"
import { useLocalStorage } from '@mantine/hooks';
import type { PropsWithChildren } from "react"

interface Props extends PropsWithChildren<MantineProviderProps> {
  emotionCache?: EmotionCache
}

export function ThemeProvider({ emotionCache, children, ...props }: Props) {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'dark',
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{
        colorScheme,
        primaryColor: 'cube',
        colors: {
          cube: ['#FFECFB', '#FFC3F4', '#FF9CEC', '#FF70E4', '#FF44D4', '#D32CB4', '#B11995', '#8F0B77', '#6D0159', '#4B003D'],
        },
        globalStyles: (theme) => ({
          body: {
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          },
        }),
      }}
      emotionCache={emotionCache} {...props}>
        {children}
      </MantineProvider>
    </ColorSchemeProvider>
  )
}