import React from 'react';
import { ThemeProvider as ScThemeProvider } from 'styled-components';
import { Grid } from '@material-ui/core';
import { makeStyles, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';
import { scPurplishTheme, muiPurplishTheme } from './components/themes';
import GlobalStyles from './components/global';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.main
  }
}));

export default function App() {
  const classes = useStyles();

  return (
    <MuiThemeProvider theme={muiPurplishTheme}>
      <ScThemeProvider theme={scPurplishTheme}>
        <GlobalStyles />
        <Grid 
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
          <Grid item style={{marginTop: "auto"}}>
            <Footer />
          </Grid>
        </Grid>
      </ScThemeProvider>
    </MuiThemeProvider>
  );
}
