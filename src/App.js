import React from "react";
import { Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import Header from "./components/Header";
import Main from "./components/Main";
import Footer from "./components/Footer";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    background: `radial-gradient(circle farthest-side, ${theme.palette.primary.faded}, ${theme.palette.background.main})`
  }
}));

export default function App() {
  const classes = useStyles();

  return (
    <Grid
      id="app-container"
      container
      direction="column"
      alignContent="stretch"
      justifyContent="flex-start"
      className={classes.root}
      spacing={2}
    >
      <Grid item>
        <Header />
      </Grid>
      <Grid item>
        <Main />
      </Grid>
      <Grid item style={{ marginTop: "auto" }}>
        <Footer />
      </Grid>
    </Grid>
  );
}

