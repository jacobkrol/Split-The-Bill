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
  InputLabel,
  LinearProgress,
  makeStyles,
  MenuItem,
  Select,
  Typography
} from "@material-ui/core";
import converter from "number-to-words";

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

export default function ItemDialog({
  open,
  setOpen,
  receipt,
  setReceipt,
  isLoading,
  setCosts,
  people
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
    setDialogText("");
    setItemPlural(false);
    setItemOrdinal(0);
    setRunningCosts([]);
    setRunningCostIndex(0);
    setSelectedPeople([]);
    setLoadingText("Loading results...");
    setAssignMultiple(false);
    setReceipt({});
    setOpen(false);
  };

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
    setAssignMultiple(false);
  }, [runningCosts, runningCostIndex]);

  const assignCost = () => {
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

    setRunningCosts(newRunningCosts);
    setRunningCostIndex((prev) => prev + 1);
    setSelectedPeople("");
    setAssignMultiple(false);

    // finished assigning costs
    const noCostsRemaining = !newRunningCosts.filter(
      (cost) => cost.person.length === 0
    ).length;
    if (noCostsRemaining) {
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
      cancelDialog();
      return;
    }
  };

  const backCost = () => {
    if (runningCostIndex === 0) return;

    setRunningCostIndex((prev) => prev - 1);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>Split Receipt Items</DialogTitle>
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
        <Button
          color="primary"
          onClick={() => {
            const res = window.confirm(
              "Are you sure you would like to stop assigning the items on this receipt? All progress will be lost and the image will not be stored."
            );
            if (!res) return;
            cancelDialog();
          }}
        >
          Cancel
        </Button>
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
