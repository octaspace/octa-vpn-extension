import { ThemeProvider } from "~theme";
import { MemoryRouter } from "react-router-dom"
import { Routing } from "~helpers/routing";

function IndexPopup() {
  return (
    <ThemeProvider withNormalizeCSS withGlobalStyles>
      <MemoryRouter>
      <Routing />
    </MemoryRouter>
    </ThemeProvider>
  );
}

export default IndexPopup;
