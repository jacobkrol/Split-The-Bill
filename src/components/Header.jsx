import React from 'react';
import { AppBar, makeStyles, Toolbar, Typography } from '@material-ui/core';
import { MonetizationOn } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
	offset: theme.mixins.toolbar,
	title: {
		margin: '12px 0',
		textAlign: 'center'
	}
}));

export default function Header() {
	const classes = useStyles();

	return (
		<React.Fragment>
			<AppBar position="fixed" color="primary">
				<Toolbar>
					<MonetizationOn />
				</Toolbar>
			</AppBar>
			<div className={classes.offset} />
			<Typography variant="h3" component="h1" className={classes.title}>Split The Bill</Typography>
		</React.Fragment>
	)
}