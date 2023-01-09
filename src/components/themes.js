import { createTheme } from "@material-ui/core/styles";

export const scPurplishTheme = {
  background: "#F7F2F7", //"#F9F2F9",
  foreground: "#F6E3D6", //"#EFD9CE",
  text: "#393239",
  primary: "#957FEF",
  secondary: "#B79CED"
};

export const muiPurplishTheme = createTheme({
  palette: {
    primary: {
      main: "#957FEF"
    },
    secondary: {
      main: "#B79CED"
    },
    text: {
      main: "#393239",
      faded: "#696969"
    },
    background: {
      main: "#F7F0F7"
    },
    foreground: {
      main: "#FCFAFC"
    }
  }
});
