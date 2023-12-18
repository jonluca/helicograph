import { Poppins } from "next/font/google";

export const poppins = Poppins({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["sans-serif"],
});
const colors = {
  black: "#000000",
  lowBlack: "#1E1D1D",
  background: "#1e1e1e",
  neutral5: "hsl(0, 0%, 20%)",
  slate: "#6B6B72",
  chatbotShadow: "rgba(0, 0, 0, 0.25)",
  buttonShadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.3)",
  monte: "#A9B2FE",
  ghostWhite: "#ECEEFF",
  white: "#FFFFFF",
  greenLight: "#bdffcb",
  lightGreen: "#8aff8d",
  darkGreen: "#4F7C6C",
  sandstone: "#F9F4EA",
  atlas: "#FFFAE6",
  quartz: "#F6F7FF",
  gray: "#EDEDED",
  error: "#E01515",
  himalayas: "#FEF4F4",
  lightGray: "#6B6B72",
  shale: "#9A6804",
  toubkal: "#FFC146",
  orient: "#214170",
  poloBlue: "#84a0c8",
  lavenderBlue: "#C9DFFF",
  semiGray: "#F8F8F8",
  darkCerulean: "#083F8F",
  paleBlue: "#4456F5",
  mayaBlue: "#6EA7FA",
  aliceBlue: "#E9F2FF",
  linkWater: "#E0E0E3",
  aliceBlue1: "#F5F9FF",
  madison: "#2E3A59",
} as const;
const palette = {
  primary: {
    main: "#000",
    dark: "#fff",
  },
  secondary: {
    main: "#fff",
    dark: "#3c3c3c",
  },
  error: {
    main: "#ff1403",
  },
  success: {
    main: "#e5e7eb",
  },
  action: {
    disabled: "#6B6B72",
  },
} as const;
export const baseThemeOptions = {
  colors,
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset": {
            borderRadius: "8px",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          p: 1,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginTop: 0,
          marginBottom: 0,
        },
      },
    },
  },

  typography: {
    fontFamily: poppins.style.fontFamily,
    h1: {
      fontWeight: 600,
      fontSize: 24,
      lineHeight: 1.5,
    },
    h2: {
      fontSize: 22,
    },
    h3: {
      fontSize: 18,
    },
    h4: {
      fontSize: 16,
    },
    h5: {
      fontSize: 14,
    },
  },
  palette,
} as const;
type Colors = typeof colors;
declare module "@mui/material/styles" {
  interface Theme {
    colors: Colors;
  }

  interface ThemeOptions {
    colors: Colors;
  }
}

export default baseThemeOptions;
