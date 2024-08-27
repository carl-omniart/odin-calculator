// Events

function initializeListeners() {
  document.getElementById("keys").addEventListener("click", onClickKeys);
}

function onClickKeys(event) {
  const key = event.target;

  switch (key.textContent) {
    case "AC":
      onClickAllClear();
      break;
    case "CE":
      onClickClearEntry();
      break;
    case "+/-":
      onClickPlusMinus();
      break;
    case ".":
      onClickDecimal();
      break;
    default:
      if (key.classList.contains("operator")) onClickOperator(event);
      if (key.classList.contains(   "digit")) onClickDigit(event);
  };
}

function onClickAllClear() {
  clearEntry();
  clearMemory();
  refreshDisplay();
}

function onClickClearEntry() {
  clearEntry();
  refreshDisplay();
  setClearKeyToAllClear();
}

function onClickPlusMinus() {
  entry.togglePlusMinus();
  refreshDisplay();
}

function onClickDecimal() {
  switchToInputMode();
  entry.appendDecimal();
  refreshDisplay();
}

function onClickDigit(event) {
  const digit = event.target.textContent;

  switchToInputMode();
  entry.appendDigit(digit);
  refreshDisplay();
}

function onClickOperator(event) {
  if (mode == "output") return;

  let currOperator = event.target.id;
  let currNumber   = entry.toNumber();

  if (prevOperator) {
    currNumber = operate(prevOperator, prevNumber, currNumber);
    setEntry(currNumber);
    refreshDisplay();
  };

  if (currOperator == "equals") {
    currOperator = null;
  } else {
    switchToOutputMode();
  };

  pushMemory(currNumber, currOperator);
}

// Display

function refreshDisplay() {
  document.getElementById("display").textContent = entry.toDisplay();
}

function Entry(number = 0) {
  this.string = this.stringify(number);
}

// The following hodge-podge wrangles a number into a string suitable to
// the calculator display.

Entry.prototype.stringify = function(number) {

  if (!Number.isFinite(number)) return "Infinity";

  // Retrieves the exponent in exponential notation. Can also be calculated by
  // Math.floor(Math.log10(number)), however Math.log10(0) returns -Infinity,

  const exp = Number(number.toExponential().split("e")[1]);
  
  if (exp < (1 - MAX_DIGITS) || MAX_DIGITS <= exp) {
    
    // Out of Range Numbers
    // - Numbers with negative exponents (i.e. numbers that begin "0.") have one
    //   fewer display digit available due to the leading zero.
    // - Returns number in exponential notation. From available display digits,
    //   four are given to the exponent ("e", "-", and two digits for value),
    //   and one is given to the digit before the decimal point. This leaves
    //   MAX_DIGITS - 5 for fractional digits.
    
    const string = number.toExponential(MAX_DIGITS - 5);
    return string;

  } else if (exp >= 0) {

    // In-Range Numbers, absolute value >= 1
    // - From available display digits, one is given to the digit before the
    //   decimal point, leaving MAX_DIGITS - 1 for fractional digits.
    // - Returns number in standard notation. String methods are used to convert
    //   the significand (i.e. the "1.234" part of "1.234e5") into standard
    //   notation. Decimal is removed, then re-inserted into proper location.
    //   Remove trailing zeroes. Remove terminal decimal. For example,
    //   "1.230000" with exponent of 2 => "123.0000" => "123." => "123".

    let string = number.toExponential(MAX_DIGITS - 1).split("e")[0]
    string     = string.replace(".", "");
    string     = string.slice(0, exp + 1) + "." + string.slice(exp + 1);
    string     = string.replace(/0*$/, "").replace(/\.$/, "");
    return string;

  } else if (exp < 0) {

    // In-Range Number, absolute value < 1
    // - From available display digits, the absolute value of the exponent
    //   ennumerates the number to be allocated to leading zeroes (1.23e3 =>
    //   0.00123). Because all exponents are negative, this leaves MAX_DIGITS +
    //   exp for fractional digits.
    // - Returns the number in standard notation. String methods are used to
    //   convert the significand (i.e. the "1.234" part or "1.234e-5") into
    //   standard notation. Front of string is padded with zeroes. Trailing
    //   zeroes are removed. Decimal is removed, then re-inserted into proper
    //   location. For example, "1.230000" with exponent of -2 => "001.230000"
    //    => "001.23" => "0.0123".

    let string = number.toExponential(MAX_DIGITS + exp).split("e")[0]
    string     = string.padStart(MAX_DIGITS + 2, "0");
    string     = string.replace(/0*$/, "").replace(".", "");
    string     = string.slice(0, 1) + "." + string.slice(1);
    return string;
  };
}

Entry.prototype.toDisplay = function() {
  if (this.string == "Infinity") {
    return pickOne(SNARKY_RESPONSES);
  } else if (this.string.includes("e")) {
    return this.string;
  } else {
    const string = (this.hasDecimal()) ? this.string : (this.string + ".")
    return string;
  };
}

Entry.prototype.toNumber = function() {
  return Number(this.string);
}

Entry.prototype.isNegative = function() {
  return this.string[0] == "-";
}

Entry.prototype.hasDecimal = function() {
  return this.string.includes(".");
}

Entry.prototype.digitCount = function() {
  return this.string.replace("-", "").replace(".", "").length;
}

Entry.prototype.togglePlusMinus = function() {
  if (this.isNegative()) {
    this.string = this.string.slice(1);
  } else if (this.string != "0") {
    this.string = "-" + this.string
  };
}

Entry.prototype.appendDecimal = function() {
  if (!this.hasDecimal()) this.string += ".";
}

Entry.prototype.appendDigit = function(digit) {
  if (this.string == "0") {
    this.string = digit;
  } else if (this.digitCount() + 1 <= MAX_DIGITS) {
    this.string += digit;
  };
}

// Operators

function operate(operator, a, b) {
  switch (operator) {
    case "plus":
      return add(a, b);
    case "minus":
      return subtract(a, b);
    case "times":
      return multiply(a, b);
    case "divide-by":
      return divide(a, b);
  };
}

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  return a / b;
}

// Modes

function switchToInputMode() {
  if (mode != "input") {
    mode = "input";
    clearEntry();
    setClearKeyToClearEntry();
  };
}

function switchToOutputMode() {
  if (mode != "output") {
    mode = "output";
  }
}

// Clear

function clearEntry() {
  entry = new Entry();
}

function setEntry(number) {
  entry = new Entry(number);
}

function setClearKeyToAllClear() {
  document.getElementById("clear").textContent = "AC";
}

function setClearKeyToClearEntry() {
  document.getElementById("clear").textContent = "CE";
}

// Memory

function clearMemory() {
  prevNumber   =    0;
  prevOperator = null;
}

function pushMemory(newNumber, newOperator) {
  prevNumber   = newNumber;
  prevOperator = newOperator;
}

// Helpers

function pickOne(array) {
  const index = Math.floor(Math.random() * array.length);
  return array.at(index);
}

const MAX_DIGITS = 11; // just the digits, not decimal or minus sign

const SNARKY_RESPONSES = [
  ":(",
  "A BAJILLION",
  "A HEADACHE",
  "ASK LATER",
  "BLESS UR <3",
  "EGADS!",
  "GO FISH",
  "LOL",
  "MY OH MY",
  "NO, JUST NO",
  "PLZ STOP",
  "REALLY?",
  "REPLY HAZY",
  "TRY AGAIN",
  "UMMM...NO"
].filter(response => response.length <= MAX_DIGITS + 2);

let mode;
let entry;
let prevNumber;
let prevOperator; 

clearEntry();
clearMemory();
refreshDisplay();
initializeListeners();
