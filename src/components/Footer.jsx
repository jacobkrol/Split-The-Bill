import React from 'react';
import { Grid, Link, makeStyles, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  footer: {
    marginTop: '3rem'
  },
  separator: {
    margin: '0 12px'
  }
}));

export default function Footer() {
  const classes = useStyles();

  return (
    <Grid container justifyContent="center" className={classes.footer}>
      <Typography variant="body1">
        Copyright {new Date().getFullYear()}
      </Typography>
      <Typography className={classes.separator}>{'//'}</Typography>
      <Typography variant="body1">
        <Link
          href="https://kroljs.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jacob Krol
        </Link>
      </Typography>
    </Grid>
  );
}
