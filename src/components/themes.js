import { createTheme } from "@material-ui/core/styles";

const colors = {
  background: "#F7F2F7",
  foreground: "#FCFAFC",
  text: "#393239",
  primary: "#957FEF",
  primaryDesat: "#c8c2e0", //"#a79cd3",
  faded: "#696969"
};
export const scPurplishTheme = {
  background: colors.background,
  foreground: colors.foreground,
  text: colors.text,
  primary: colors.primary
};

export const muiPurplishTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      faded: colors.primaryDesat
    },
    text: {
      main: colors.text,
      faded: colors.faded
    },
    background: {
      main: colors.background
    },
    foreground: {
      main: colors.foreground
    }
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Signika",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(",")
  }
});
