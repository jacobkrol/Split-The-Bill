import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grow,
  IconButton,
  InputLabel,
  LinearProgress,
  makeStyles,
  MenuItem,
  Select,
  Typography
} from "@material-ui/core";
import converter from "number-to-words";
import { MinimizeRounded } from "@material-ui/icons";

const loadingPhrases = [
  "Parsing receipt...",
  "Contacting server...",
  "Itemizing items...",
  "Judging your purchases...",
  "Analyzing pixels...",
  "Getting you photography lessons..."
];

const useStyles = makeStyles((theme) => ({
  indent: {
    margin: "0.5rem"
  },
  itemHelpText: {
    color: theme.palette.text.faded
  },
  select: {
    minWidth: "125px"
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    margin: "2px -2px"
  },
  chip: {
    margin: "2px"
  },
  windowButton: {
    position: "absolute",
    top: "10px",
    right: "15px",
    height: "1rem",
    width: "1rem",
    border: "2px solid rgba(150,150,150,0.5)",
    borderRadius: "4px"
  }
}));

const getSharedPriceArr = (amountToSplit, numOfPeople) => {
  // create even split array
  const evenSplit = Math.floor((amountToSplit * 100) / numOfPeople);
  let resultArr = new Array(numOfPeople).fill(evenSplit);

  // find error from rounding to 2 decimals on every index
  const error =
    amountToSplit * 100 - resultArr.reduce((sum, cur) => cur + sum, 0);

  // give additional penny to some people
  for (let i = 0; i < error; i++) {
    resultArr[i]++;
  }

  // correct from cents to dollars (at the end to avoid floating point errors)
  return resultArr.map((cents) => cents / 100);
};

let offsets;
const Transition = React.forwardRef(function Transition(props, ref) {
  return (
    <Grow
      ref={ref}
      {...props}
      timeout={500}
      style={
        offsets ? { transformOrigin: `${offsets.x}px ${offsets.y}px` } : {}
      }
    />
  );
});

export default function ItemDialog({
  open,
  setOpen,
  receipt,
  isLoading,
  setCosts,
  people,
  growOffsets,
  getGrowOffsets
}) {
  const classes = useStyles();

  const [dialogText, setDialogText] = useState("");
  const [itemPlural, setItemPlural] = useState(false);
  const [itemOrdinal, setItemOrdinal] = useState(0);
  const [runningCosts, setRunningCosts] = useState([]);
  const [runningCostIndex, setRunningCostIndex] = useState(0);
  const [selectedPeople, setSelectedPeople] = useState("");
  const [loadingText, setLoadingText] = useState("Loading results...");
  const [assignMultiple, setAssignMultiple] = useState(false);
  const loadingTextIntRef = useRef(null);

  const cancelDialog = () => {
    offsets = getGrowOffsets();
    assignCost({ advance: false });
    setOpen(false);
  };

  useEffect(() => {
    offsets = growOffsets;
  }, [growOffsets]);

  useEffect(() => {
    if (!isLoading) {
      clearInterval(loadingTextIntRef.current);
      return;
    }

    loadingTextIntRef.current = setInterval(() => {
      // set random phrase as loading text
      setLoadingText(
        loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]
      );
    }, 3000);

    return () => {
      clearInterval(loadingTextIntRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!receipt?.items?.length) return;

    const itemArr = [];
    receipt.items.forEach((item) => {
      const perCost = (item.amount / (item.qty ?? 1)).toString();
      for (let i = 0; i < (item.qty ?? 1); i++) {
        itemArr.push({
          qty: item.qty ?? 1,
          n: i,
          cost: perCost,
          description: item.description,
          person: ""
        });
      }
    });
    setRunningCosts(itemArr);
  }, [receipt]);

  useEffect(() => {
    // const nextItem = runningCosts.find((item) => item.person === "");
    const nextItem = runningCosts[runningCostIndex];
    if (!nextItem) return;

    setItemPlural((nextItem.qty ?? 1) > 1);
    setItemOrdinal(nextItem.n + 1);
    setDialogText(
      `${nextItem.qty ?? 1} x ${nextItem.description} for $${nextItem.cost}${
        nextItem.qty > 1 ? " each" : ""
      }.`
    );
    if (Array.isArray(nextItem.person) && nextItem.person.length === 1) {
      setSelectedPeople(nextItem.person[0].toString());
      setAssignMultiple(false);
    } else if (Array.isArray(nextItem.person) && nextItem.person.length > 1) {
      setSelectedPeople(nextItem.person);
      setAssignMultiple(true);
    } else {
      setSelectedPeople("");
      setAssignMultiple(false);
    }
  }, [runningCosts, runningCostIndex]);

  const assignCost = ({ advance = true, clickOnNext = false }) => {
    if (
      Array.isArray(selectedPeople)
        ? !selectedPeople.length
        : selectedPeople === ""
    )
      return;

    let newRunningCosts = [...runningCosts];
    newRunningCosts[runningCostIndex].person = Array.isArray(selectedPeople)
      ? selectedPeople.filter((person) => person !== "")
      : [selectedPeople];
    const newRunningCostIndex = runningCostIndex + 1;

    setRunningCosts(newRunningCosts);
    if (advance) setRunningCostIndex(newRunningCostIndex);
    setSelectedPeople("");
    setAssignMultiple(false);

    // finished assigning costs
    const noCostsRemaining = !newRunningCosts.filter(
      (cost) => cost.person.length === 0
    ).length;
    const atEndOfList = newRunningCostIndex === newRunningCosts.length;
    if ((clickOnNext && atEndOfList) || (!clickOnNext && noCostsRemaining)) {
      const finalCosts = [];
      runningCosts.forEach((item) => {
        if (item.person.length > 1) {
          const sharedPriceArr = getSharedPriceArr(
            item.cost,
            item.person.length
          );
          item.person.forEach((name, i) => {
            finalCosts.push({ cost: sharedPriceArr[i], person: name });
          });
        } else {
          finalCosts.push({ cost: item.cost, person: item.person[0] });
        }
      });
      setCosts(finalCosts);
      if (clickOnNext && atEndOfList) setRunningCostIndex(0);
      setOpen(false);
      return;
    }
  };

  const backCost = () => {
    if (runningCostIndex === 0) return;

    assignCost({ advance: false });
    setRunningCostIndex((prev) => prev - 1);
  };

  return (
    <Dialog
      id="receipt-dialog"
      open={open}
      onClose={() => setOpen(false)}
      TransitionComponent={Transition}
      keepMounted
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Split Receipt Items</DialogTitle>
      <IconButton
        color="primary"
        aria-label="minimize receipt window"
        className={classes.windowButton}
        onClick={cancelDialog}
      >
        <MinimizeRounded />
      </IconButton>
      <DialogContent>
        {isLoading ? (
          <>
            <DialogContentText>{loadingText}</DialogContentText>
            <LinearProgress color="primary" />
          </>
        ) : receipt?.items?.length ? (
          <>
            <Typography variant="subtitle1" className={classes.itemHelpText}>
              Reading the receipt, we found...
            </Typography>
            <Typography variant="subtitle1" className={classes.indent}>
              {dialogText}
            </Typography>
            <Typography variant="subtitle1" className={classes.itemHelpText}>
              Who would you like to assign{" "}
              {itemPlural ? (
                <span>
                  the <strong>{converter.toWordsOrdinal(itemOrdinal)}</strong>
                </span>
              ) : (
                "this"
              )}{" "}
              to?
            </Typography>
            <FormGroup className={classes.indent}>
              <FormControl>
                <InputLabel id={`item-select-label`}>Assign to...</InputLabel>
                <Select
                  multiple={assignMultiple}
                  // native={assignMultiple}
                  labelId={`item-select-label`}
                  id={`item-select`}
                  value={selectedPeople}
                  onChange={(evt) => setSelectedPeople(evt.target.value)}
                  className={classes.select}
                  inputProps={{
                    id: "item-select-label"
                  }}
                  renderValue={
                    assignMultiple
                      ? (selected) => (
                          <div className={classes.chips}>
                            {selected.map((id) => (
                              <Chip
                                key={id}
                                label={people[id]}
                                className={classes.chip}
                              />
                            ))}
                          </div>
                        )
                      : undefined
                  }
                >
                  {people.map(
                    (person, i) =>
                      !!person.length && (
                        <MenuItem key={i} value={i}>
                          {person}
                        </MenuItem>
                      )
                  )}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={assignMultiple}
                    onChange={() => {
                      setAssignMultiple((prev) => !prev);
                      setSelectedPeople((prev) =>
                        Array.isArray(prev)
                          ? prev[0]
                          : [prev].filter((id) => id !== "")
                      );
                    }}
                    name="assignMultipleCheck"
                    color="primary"
                  />
                }
                label="Shared"
              />
            </FormGroup>
          </>
        ) : (
          <DialogContentText>
            An error occurred reading your receipt. Please try again later.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        {!isLoading && (
          <Button
            color="primary"
            onClick={backCost}
            disabled={runningCostIndex === 0}
          >
            Back
          </Button>
        )}
        {!isLoading && (
          <Button
            color="primary"
            variant="contained"
            onClick={assignCost}
            disabled={
              Array.isArray(selectedPeople)
                ? !selectedPeople.length
                : selectedPeople === ""
            }
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
