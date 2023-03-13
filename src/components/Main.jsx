import React, { useRef, useState } from "react";
import {
  Card,
  Typography,
  makeStyles,
  CardHeader,
  CardContent,
  IconButton,
  Collapse,
  useTheme,
  Grid,
  Button,
  List,
  ListItem,
  TextField
} from "@material-ui/core";
import { ExpandMoreRounded, PhotoCamera } from "@material-ui/icons";
import InputRow from "./InputRow";
import { names } from "../data/names";
import ItemDialog from "./ItemDialog";
// import response from "../data/receipt-response-short.json";

const useStyles = makeStyles((theme) => ({
  card: {
    margin: "0 auto",
    width: "clamp(325px, 90vw, 750px)",
    color: theme.palette.text.main,
    backgroundColor: theme.palette.foreground.main
  },
  cardWidth: {
    margin: "0 auto",
    width: "clamp(325px, 90vw, 750px)"
  },
  contentRemoveMargin: {
    paddingTop: "0"
  },
  listItemDense: {
    padding: "0"
  },
  resultsText: {
    fontWeight: "bold"
  },
  fadedText: {
    color: theme.palette.text.faded
  },
  input: {
    display: "none"
  }
}));

const expandIcon = {
  transition: "all 200ms"
};

const expandIconOpen = {
  transform: "rotate(180deg)"
};

const nullifyInputValue = (evt) => (evt.target.value = null);

const getGrowOffsets = () => {
  const dialogRect = document
    .getElementById("receipt-dialog")
    ?.getBoundingClientRect();
  const buttonRect = document
    .getElementById("reopen-receipt")
    ?.getBoundingClientRect();

  if (!dialogRect || !buttonRect) return;

  return {
    x: Math.round(buttonRect.x - dialogRect.x),
    y: Math.round(buttonRect.y - dialogRect.y)
  };
};

export default function Main() {
  const classes = useStyles();
  const theme = useTheme();
  const [openPhases, setOpenPhases] = useState([1]);
  const [people, setPeople] = useState([""]);
  const [costs, setCosts] = useState([{ cost: "", person: "" }]);
  const [billTotal, setBillTotal] = useState("");
  const [billTotalError, setBillTotalError] = useState(false);
  const [results, setResults] = useState([]);
  const [enteringData, setEnteringData] = useState(true);
  const [showCosts, setShowCosts] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState({});
  const growOffsets = useRef();

  const togglePhase = (n) => {
    setOpenPhases((current) => {
      return current.includes(n)
        ? current.filter((p) => p !== n)
        : [...current, n];
    });
  };

  const nextPhase = (current) => {
    setOpenPhases([current + 1]);
  };

  const setNameByIndex = (name, index) => {
    let newNames = [...people];
    newNames[index] = name;
    setPeople(newNames);
  };

  const deletePersonByIndex = (index) => {
    // return if final person
    if (people.length <= 1) return;

    // update cost associations
    const newCosts = costs.map(({ cost, person }) => {
      let newPerson = person;
      if (String(person) === String(index)) newPerson = "";
      if (String(person) !== "" && Number(person) > Number(index))
        newPerson = Number(person) - 1;
      return {
        cost,
        person: newPerson
      };
    });
    setCosts(newCosts);

    // update people
    let newPeople = [...people];
    newPeople.splice(index, 1);
    setPeople(newPeople);
  };

  const addPerson = () => {
    setPeople([...people, ""]);
  };

  const setCostByIndex = (cost, index) => {
    // update value in state
    let newCosts = [...costs];
    if (
      cost !== "" &&
      cost !== cost.match(/([0-9]+([.][0-9]{0,2})?|[.][0-9]{1,2})/g)?.[0]
    )
      return;
    newCosts[index] = { cost, person: costs[index].person };
    setCosts(newCosts);
  };

  const deleteCostByIndex = (index) => {
    // return if final cost
    if (costs.length <= 1) return;

    let newCosts = [...costs];
    newCosts.splice(index, 1);
    setCosts(newCosts);
  };

  const addCost = () => {
    setCosts([...costs, { cost: "", person: "" }]);
  };

  const assignCostByCostIndexAndNameIndex = (costIndex, nameIndex) => {
    let newCosts = [...costs];
    newCosts[costIndex].person = nameIndex;
    setCosts(newCosts);
  };

  const updateBillTotal = (evt) => {
    const value = evt.target.value;
    if (
      value !== "" &&
      value !== value.match(/([0-9]+([.][0-9]{0,2})?|[.][0-9]{1,2})/g)?.[0]
    )
      return;
    setBillTotal(value);
    const billSubtotal = costs.reduce(
      (prev, curr) => prev + Number(curr.cost),
      0
    );
    setBillTotalError(isNaN(Number(value)) || Number(value) < billSubtotal);
  };

  const calculateResults = () => {
    // prevent calculation without valid data
    let errors = "";
    const unassignedCosts = costs.filter((x) => x.person === "");
    const unfilledCosts = costs.filter((x) => x.cost === "");
    const billSubtotal = costs.reduce(
      (prev, curr) => prev + Number(curr.cost),
      0
    );
    if (unassignedCosts.length) {
      errors += "• All costs must be assigned to a person\n";
    }
    if (unfilledCosts.length) {
      errors += "• All costs must have a valid number entered\n";
    }
    if (people.filter((x) => x.replace(" ", "").length).length === 0) {
      errors += "• Must have at least one valid person entered\n";
    }
    if (billSubtotal === 0) {
      errors += "• Must have a non-zero cost entered\n";
    }
    if (billTotal === "") {
      errors += "• Must have a bill total entered\n";
    }
    if (errors.length) {
      alert("Please correct the following errors to continue:\n\n" + errors);
      return;
    }
    if (billTotalError) {
      const res = window.confirm(
        "The bill total is less than the subtotal of items. Are you sure you'd like to continue?"
      );
      if (!res) return;
    }

    // calculate results
    let halfRounded = false;
    const personCosts = people
      .filter((x) => x.length)
      .map((name, index) => {
        const personalSubtotal = costs.reduce(
          (prev, curr) =>
            String(curr.person) === String(index)
              ? prev + Number(curr.cost)
              : prev,
          0
        );
        const personalShare = personalSubtotal / billSubtotal;
        const costRounded =
          Math.round(Number(billTotal) * personalShare * 100) / 100;

        // account for multiple half pennies rounding total up
        const isHalfPenny =
          String(Number(billTotal) * personalShare * 100).slice(-2) === ".5";
        let cost = costRounded;
        if (isHalfPenny) {
          if (halfRounded) {
            cost = costRounded - 0.01;
            halfRounded = false;
          } else {
            halfRounded = true;
          }
        }
        return { name, cost };
      });
    setResults(personCosts);

    // update step to display results
    setEnteringData(false);
  };

  const returnFromResults = () => {
    setEnteringData(true);
  };

  const handleReceiptInput = async (evt) => {
    if (!evt.target.files?.length) return;
    const file = evt.target.files[0];

    // open dialog and show as loading
    setOcrLoading(true);
    setItemDialogOpen(true);

    // post receipt image to OCR
    const receiptOcrEndpoint = "https://ocr.asprise.com/api/v1/receipt";
    let formData = new FormData();
    formData.append("api_key", "TEST");
    formData.append("recognizer", "auto");
    formData.append("file", file);
    const fetchResponse = await fetch(receiptOcrEndpoint, {
      method: "POST",
      body: formData
    });
    const data = await fetchResponse.json();
    // const fetchResponse = { status: 200 };
    // const data = await new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve(response);
    //   }, 15000);
    // });

    // mark as no longer loading
    setOcrLoading(false);

    // inform user in case of failure
    if (!data.success || !data?.receipts?.[0]) {
      setItemDialogOpen(false);
      alert(
        "Failure to read receipt. Please try again later or enter the receipt data manually." +
          ` [${fetchResponse.status}]`
      );
      return;
    }

    // pass receipt response to item dialog
    const receipt = data.receipts[0];
    setOcrData(receipt);
  };

  return (
    <Grid container direction="column" spacing={2}>
      <ItemDialog
        open={itemDialogOpen}
        setOpen={setItemDialogOpen}
        receipt={ocrData}
        setReceipt={setOcrData}
        isLoading={ocrLoading}
        setCosts={setCosts}
        people={people}
        growOffsets={growOffsets.current}
        getGrowOffsets={getGrowOffsets}
      />
      {enteringData ? (
        <>
          <Grid item>
            <Card className={classes.card}>
              <CardHeader
                title="Phase 1: Enter Names"
                onClick={() => togglePhase(1)}
                action={
                  <IconButton>
                    <ExpandMoreRounded
                      htmlColor={theme.palette.text.main}
                      style={
                        openPhases.includes(1)
                          ? { ...expandIcon, ...expandIconOpen }
                          : expandIcon
                      }
                    />
                  </IconButton>
                }
              />
              <Collapse in={openPhases.includes(1)}>
                <CardContent className={classes.contentRemoveMargin}>
                  <Grid container direction="column" spacing={1}>
                    <Grid item>
                      <List dense>
                        {people.map((name, index) => (
                          <ListItem key={index}>
                            <InputRow
                              id={index}
                              value={name}
                              setByIndex={setNameByIndex}
                              deleteByIndex={deletePersonByIndex}
                              placeholder={
                                names[Math.floor(Math.random() * names.length)]
                              }
                              label="Name"
                              deleteDisabled={people.length <= 1}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item>
                      <Grid container justifyContent="space-between">
                        <Grid item>
                          <Button onClick={addPerson}>
                            <Typography color="primary">Add Person</Typography>
                          </Button>
                        </Grid>
                        <Grid item>
                          <Button onClick={() => nextPhase(1)}>
                            <Typography color="primary">Continue</Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
          <Grid item>
            <Card className={classes.card}>
              <CardHeader
                title="Phase 2: Enter Costs"
                onClick={() => togglePhase(2)}
                action={
                  <IconButton>
                    <ExpandMoreRounded
                      htmlColor={theme.palette.text.main}
                      style={
                        openPhases.includes(2)
                          ? { ...expandIcon, ...expandIconOpen }
                          : expandIcon
                      }
                    />
                  </IconButton>
                }
              />
              <Collapse in={openPhases.includes(2)}>
                <CardContent className={classes.contentRemoveMargin}>
                  <Grid container direction="column" spacing={1}>
                    <Grid item>
                      <Typography
                        variant="subtitle1"
                        className={classes.fadedText}
                      >
                        Scan the receipt
                      </Typography>
                      <input
                        accept="image/*"
                        className={classes.input}
                        id="contained-button-file"
                        type="file"
                        onChange={handleReceiptInput}
                        onClick={nullifyInputValue}
                      />
                      <label htmlFor="contained-button-file">
                        <Button
                          variant="contained"
                          color="primary"
                          component="span"
                        >
                          Upload
                        </Button>
                      </label>
                      <input
                        accept="image/*"
                        className={classes.input}
                        id="icon-button-file"
                        type="file"
                        capture="environment"
                        onChange={handleReceiptInput}
                        onClick={nullifyInputValue}
                      />
                      <label htmlFor="icon-button-file">
                        <IconButton
                          color="primary"
                          aria-label="upload picture"
                          component="span"
                        >
                          <PhotoCamera />
                        </IconButton>
                      </label>
                      <Collapse in={!!Object.keys(ocrData).length}>
                        <Button
                          id="reopen-receipt"
                          variant="outlined"
                          onClick={() => {
                            growOffsets.current = getGrowOffsets();
                            setItemDialogOpen(true);
                          }}
                          style={{ margin: "8px 0" }}
                        >
                          <Typography color="primary">
                            Reopen Current Receipt
                          </Typography>
                        </Button>
                      </Collapse>
                      <Collapse in={!(costs.length > 1 || showCosts)}>
                        <Button
                          variant="outlined"
                          onClick={() => setShowCosts(true)}
                          style={{ margin: "8px 0" }}
                        >
                          <Typography
                            color="primary"
                            className={classes.fadedText}
                          >
                            Enter costs manually
                          </Typography>
                        </Button>
                      </Collapse>
                    </Grid>

                    <Grid item>
                      <Collapse in={costs.length > 1 || showCosts}>
                        <List dense>
                          {costs.map((cost, index) => (
                            <ListItem
                              className={classes.listItemDense}
                              key={index}
                            >
                              <InputRow
                                id={index}
                                value={cost.cost}
                                setByIndex={setCostByIndex}
                                deleteByIndex={deleteCostByIndex}
                                placeholder={(Math.random() * 15).toFixed(2)}
                                label="Cost"
                                options={people}
                                selectedOption={cost.person}
                                selectOptionByIndex={
                                  assignCostByCostIndexAndNameIndex
                                }
                                deleteDisabled={costs.length <= 1}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </Grid>
                    <Grid item>
                      <Collapse in={costs.length > 1 || showCosts}>
                        <Grid container justifyContent="space-between">
                          <Grid item>
                            <Button onClick={addCost}>
                              <Typography color="primary">Add Cost</Typography>
                            </Button>
                          </Grid>
                          <Grid item>
                            <Button onClick={() => nextPhase(2)}>
                              <Typography color="primary">Continue</Typography>
                            </Button>
                          </Grid>
                        </Grid>
                      </Collapse>
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
          <Grid item>
            <Card className={classes.card}>
              <CardHeader
                title="Phase 3: Enter Total"
                onClick={() => togglePhase(3)}
                action={
                  <IconButton>
                    <ExpandMoreRounded
                      htmlColor={theme.palette.text.main}
                      style={
                        openPhases.includes(3)
                          ? { ...expandIcon, ...expandIconOpen }
                          : expandIcon
                      }
                    />
                  </IconButton>
                }
              />
              <Collapse in={openPhases.includes(3)}>
                <CardContent className={classes.contentRemoveMargin}>
                  <Grid container direction="column" spacing={1}>
                    <Grid item>
                      <TextField
                        id="bill-total-id"
                        label="Total Cost"
                        variant="outlined"
                        value={billTotal}
                        onChange={updateBillTotal}
                        margin="dense"
                        error={billTotalError}
                      />
                    </Grid>
                    <Grid item>
                      <Grid container justifyContent="flex-end">
                        <Grid item>
                          <Button onClick={() => nextPhase(3)}>
                            <Typography color="primary">Continue</Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          </Grid>
          <Grid item>
            <div className={classes.cardWidth}>
              <Button
                variant="contained"
                color="primary"
                className={classes.button}
                onClick={calculateResults}
              >
                <Typography variant="subtitle1">View Results</Typography>
              </Button>
            </div>
          </Grid>
        </>
      ) : (
        <>
          <Grid item>
            <Grid container direction="column" spacing={2}>
              <Grid item>
                <Card className={classes.card}>
                  <CardHeader title="Results" />
                  <CardContent className={classes.contentRemoveMargin}>
                    {!!results.length &&
                      results.map((person, i) => (
                        <Typography
                          key={i}
                          variant="body1"
                          className={classes.resultsText}
                        >
                          {`${person.name}: $${person.cost.toFixed(2)}`}
                        </Typography>
                      ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item>
                <div className={classes.cardWidth}>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={returnFromResults}
                  >
                    <Typography variant="subtitle1">Go Back</Typography>
                  </Button>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </Grid>
  );
}
