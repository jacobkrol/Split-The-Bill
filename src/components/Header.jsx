import React from 'react';
import { AppBar, makeStyles, Toolbar, Typography } from '@material-ui/core';
import Logo from '../data/logo-64.png';

const useStyles = makeStyles(theme => ({
	offset: theme.mixins.toolbar,
	title: {
		margin: '12px 0',
		textAlign: 'center'
	},
	image: {
		borderRadius: '5px',
		margin: '0.5rem',
		height: '2.5rem'
	}
}));

export default function Header() {
	const classes = useStyles();

	return (
		<React.Fragment>
			<AppBar position="fixed" color="primary">
				<Toolbar>
					<img src={Logo} alt="Split the bill logo" className={classes.image} />
				</Toolbar>
			</AppBar>
			<div className={classes.offset} />
			<Typography variant="h3" component="h1" className={classes.title}>Split The Bill</Typography>
		</React.Fragment>
	)
}