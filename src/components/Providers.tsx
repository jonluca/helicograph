import React from "react";
import baseThemeOptions from "../components/theme";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider, createTheme } from "@mui/material/styles";
import { AppContext, appStore } from "../../context";
import dynamic from "next/dynamic";

const ToastContainerDynamic = dynamic(() => import("react-toastify").then((module) => module.ToastContainer), {
  ssr: false,
});

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((module) => module.ReactQueryDevtools),
  {
    ssr: false,
  },
);

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const theme = React.useMemo(
    () =>
      createTheme({
        ...baseThemeOptions,
        palette: {
          mode: "light",
        },
      }),
    [],
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <AppContext.Provider value={appStore}>
          <CssBaseline />
          <ReactQueryDevtools position="bottom-right" />
          <ToastContainerDynamic position="top-right" />
          {children}
        </AppContext.Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
