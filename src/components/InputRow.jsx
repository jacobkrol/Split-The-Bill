import React from 'react';
import { FormControl, IconButton, InputLabel, makeStyles, MenuItem, Select, useTheme } from '@material-ui/core';
import { Grid, TextField } from '@material-ui/core';
import { DeleteRounded } from '@material-ui/icons';

const useStyles = makeStyles(theme => ({
	inputRow: {
		color: theme.palette.text.main
	},
	button: {
		padding: '0.5rem'
	},
	buttonDisabled: {
		color: theme.palette.text.faded,
		cursor: 'not-allowed'
	},
	textField: {
		marginRight: '1rem'
	},
	shortTextField: {
		width: '100px',
		marginRight: theme.spacing(1)
	},
	longTextField: {
		marginRight: theme.spacing(1)
	},
	select: {
		minWidth: '125px'
	}
}))

export default function InputRow(props) {
	const { 
		id, label, value, setByIndex, deleteByIndex, placeholder = "", 
		error = false, options = [], selectedOption, selectOptionByIndex,
		deleteDisabled
	} = props;

	const classes = useStyles();
	const theme = useTheme();

  	return (
		<Grid container alignItems="center" className={classes.inputRow} spacing={1}>
			<Grid item>
				<TextField 
					id={`${label}-${id}`}
					label={label}
					// variant="outlined" 
					value={value} 
					onChange={(evt) => setByIndex(evt.target.value,id)} 
					placeholder={placeholder}
					margin="dense"
					error={error}
					className={options.length ? classes.shortTextField : classes.longTextField}
				/>
			</Grid>
			
			{options.length ? (
				<Grid item>
					<FormControl>
						<InputLabel id={`${label}-${id}-select-label`}>Assign to...</InputLabel>
						<Select
							labelId={`${label}-${id}-select-label`}
							id={`${label}-${id}-select`}
							value={selectedOption}
							onChange={(evt) => selectOptionByIndex(id,evt.target.value)}
							className={classes.select}
						>
							{options.map((op,i) =>
								!!op.length && <MenuItem key={i} value={i}>{op}</MenuItem>
							)}
						</Select>
					</FormControl>
				</Grid>
			) : null}
			<Grid item>
				<IconButton onClick={() => deleteByIndex(id)} className={`${classes.button} ${deleteDisabled ? classes.buttonDisabled : null}`}>
					<DeleteRounded htmlColor={deleteDisabled ? theme.palette.text.faded : theme.palette.text.main} />
				</IconButton>
			</Grid>
		</Grid>
	)
}