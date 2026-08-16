import { createTheme } from "@mui/material/styles";

// An original visual identity: deep teal + warm coral, distinct from any existing
// quick-commerce app's branding.
const theme = createTheme({
  palette: {
    primary: { main: "#0F766E", light: "#14B8A6", dark: "#0B4F49", contrastText: "#fff" },
    secondary: { main: "#F97316", light: "#FDBA74", dark: "#C2410C", contrastText: "#fff" },
    background: { default: "#F6F8F7", paper: "#FFFFFF" },
    success: { main: "#16A34A" },
    warning: { main: "#D97706" },
    error: { main: "#DC2626" },
    text: { primary: "#111827", secondary: "#4B5563" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Poppins', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 18 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 500 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "0 1px 6px rgba(15, 23, 42, 0.08)" },
      },
    },
  },
});

export default theme;
