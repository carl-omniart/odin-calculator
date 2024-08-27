// Events

function initializeListeners() {
  document.getElementById("keys").addEventListener("click", onClick);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
}

function onClick(event) {
  const key = event.target;

  switch (key.id) {
    case "clear":
      onClear();
      break;
    case "plus-minus":
      onPlusMinus();
      break;
    case "decimal":
      onDecimal();
      break;
    default:
      if (key.classList.contains(   "digit")) onDigit(key.textContent);
      if (key.classList.contains("operator")) onOperator(key.id);
  };
}

function onKeyDown(event) {
  const id = SHORTCUT_KEYS[event.key];
  if (id == null) return;
  const elem = document.getElementById(id);
  elem.classList.add("active");
  elem.click();
}

function onKeyUp(event) {
  const id = SHORTCUT_KEYS[event.key];
  if (id == null) return;
  const elem = document.getElementById(id);
  elem.classList.remove("active");
}

function onClear() {
  if (document.getElementById("clear").textContent == "AC") {
    onAllClear();
  } else {
    onClearEntry();
  };
}

function onAllClear() {
  clearMemory();
  refreshDisplay();
}

function onClearEntry() {
  clearDisplay();
  refreshDisplay();
  setClearKeyToAllClear();
}

function onPlusMinus() {
  display.togglePlusMinus();
  refreshDisplay();
}

function onDecimal() {
  switchModeToInput();
  display.appendDecimal();
  refreshDisplay();
}

function onDigit(digit) {
  switchModeToInput();
  display.appendDigit(digit);
  refreshDisplay();
}

function onOperator(operator) {
  if (currOperator != null) return;

  currOperator = operator;
  currNumber   = display.toNumber();

  if (prevOperator) {
    currNumber = operate(prevOperator, prevNumber, currNumber);
    setDisplay(currNumber);
    refreshDisplay();
  };

  switchModeToOutput();
}

// Modes

function switchModeToInput() {
  setClearKeyToClearEntry();
  if (mode == "input") return;

  mode = "input";
  pushMemory();
  clearDisplay();
}

function switchModeToOutput() {
  mode = "output";
  if (currOperator == "equals") clearMemory();
}

// Memory

function clearMemory() {
  currNumber   = null;
  currOperator = null;
  prevNumber   = null;
  prevOperator = null;
}

function pushMemory() {
  prevNumber   = currNumber;
  prevOperator = currOperator;
  currNumber   = null;
  currOperator = null;
}

// Clear

function setClearKeyToAllClear() {
  document.getElementById("clear").textContent = "AC";
}

function setClearKeyToClearEntry() {
  document.getElementById("clear").textContent = "CE";
}

// Display

function refreshDisplay() {
  document.getElementById("display").textContent = getDisplayLine();
}

function getDisplayLine() {
  if (display.isInfinite()) {
    return pickOne(SNARKY_RESPONSES);
  } else if (display.isExponential()) {
    return display.string;
  } else if (display.hasDecimal()) {
    return display.string;
  } else {
    return display.string + ".";
  };
}

function clearDisplay() {
  display = new Display();
}

function setDisplay(number) {
  display = new Display(number);
}

// Display Object

function Display(number = 0) {
  this.string = this.stringify(number);
}

// The following hodge-podge wrangles a number into a string suitable to
// the calculator display.

Display.prototype.stringify = function(number) {

  if (!Number.isFinite(number)) return "Infinity";

  // Retrieves the exponent in exponential notation. Can also be calculated by
  // Math.floor(Math.log10(number)), however Math.log10(0) returns -Infinity,

  const exp = Number(number.toExponential().split("e")[1]);
  
  if (exp <= -MAX_DIGITS || MAX_DIGITS <= exp) {
    
    // Out of Range Numbers
    // - If MAX_DIGITS is 3, then the highest in-range whole number is 9.99e2
    //   => 999, and the lowest in-range decimal is 1.0e-2 => 0.01.
    // - Returns number in exponential notation. From available display digits,
    //   four are given to the exponent ("e", "-", and two digits for value),
    //   and one is given to the digit before the decimal point. This leaves
    //   MAX_DIGITS - 5 for fractional digits.
    
    let string = number.toExponential(MAX_DIGITS - 5);
    return string;

  } else if (exp >= 0) {

    // In-Range Numbers, absolute value >= 1
    // - Returns number in standard notation, using string methods.
    //   1. Get number in exponential notation: "-1.230000e2".
    //      - Significant digits include the digit before the decimal (1) and
    //        the fractional digits after the decimal point ("230000"). Thus
    //        the number of fractional digits = MAX_DIGITS - 1.
    //   2. Remove exponent: "-1.230000".
    //   3. Extract minus sign, if present: minus = "" or "-".
    //   4. Remove minus sign: "1.230000".
    //   5. Remove decimal: "1230000".
    //   6. Insert decimal into new location: "123.0000"
    //   7. Append extracted minus sign to front: "-123.0000".
    //   8. Remove trailing zeroes, if present: "-123.".
    //   9. Remove terminal decimal, if present; "-123".

    let string;
    let minus;
    string = number.toExponential(MAX_DIGITS - 1);                   // 1
    string = string.replace(/e.*$/, "");                             // 2
    minus  = string[0] == "-" ? "-" : "";                            // 3
    string = string.replace("-", "").replace(".", "");               // 4 5
    string = string.slice(0, exp + 1) + "." + string.slice(exp + 1); // 6
    string = minus + string.replace(/0*$/, "").replace(/\.$/, "");   // 7 8 9
    return string;

  } else if (exp < 0) {

    // In-Range Number, absolute value < 1
    // - Returns the number in standard notation, using string methods.
    //   1. Get number in exponential notation: "-1.230000e-2".
    //      - The absolute value of the exponent equals the number of 
    //        display digits used by leading zeroes (1.23e-3 => 0.00123).
    //        This leaves MAX_DIGITS - abs(exp) for significant digits and
    //        MAX_DIGITS - abs(exp) - 1 for fractional digits. Because all
    //        exponents here are negative, abs(exp) == -exp, and MAX_DIGITS -
    //        abs(exp) - 1 == MAX_DIGITS + exp - 1.
    //   2. Remove exponent: "-1.230000".
    //   3. Extract minus sign, if present: minus = "" or "-".
    //   4. Remove minus sign: "1.230000".
    //   5. Remove decimal: "1230000".
    //   6. Pad front with zeroes: "001230000".
    //   7. Insert decimal after first zero: "0.01230000".
    //   8. Append extracted minus sign to front: "-0.01230000".
    //   9. Remove trailing zeros: "0.0123".

    let string;
    let minus;
    string = number.toExponential(MAX_DIGITS + exp - 1)   // 1
    string = string.replace(/e.*$/, "")                   // 2
    minus  = string[0] == "-" ? "-" : "";                 // 3
    string = string.replace("-", "").replace(".", "");    // 4 5
    string = string.padStart(MAX_DIGITS, "0");            // 6
    string = string.slice(0, 1) + "." + string.slice(1);  // 7
    string = minus + string.replace(/0*$/, "");           // 8 9
    return string;
  };
}

Display.prototype.toNumber = function() {
  return Number(this.string);
}

Display.prototype.isNegative = function() {
  return this.string[0] == "-";
}

Display.prototype.isInfinite = function() {
  return this.string == "Infinity" || this.string == "-Infinity";
}

Display.prototype.isExponential = function() {
  return this.string.includes("e");
}

Display.prototype.hasDecimal = function() {
  return this.string.includes(".");
}

Display.prototype.digitCount = function() {
  return this.string.replace("-", "").replace(".", "").length;
}

Display.prototype.togglePlusMinus = function() {
  if (this.isNegative()) {
    this.string = this.string.slice(1);
  } else if (this.string != "0") {
    this.string = "-" + this.string
  };
}

Display.prototype.appendDecimal = function() {
  if (!this.hasDecimal()) this.string += ".";
}

Display.prototype.appendDigit = function(digit) {
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

// Helpers

function pickOne(array) {
  const index = Math.floor(Math.random() * array.length);
  return array.at(index);
}

const MAX_DIGITS       = 11;   // just the digits, not decimal or minus sign
const SNARKY_RESPONSES = [
  ":(",
  "A BAJILLION?",
  "ASK LATER",
  "BEATS ME",
  "BLESS UR <3",
  "EGADS!",
  "FACEPALM",
  "GO FISH",
  "LOL",
  "MATH IS HARD",
  "MORE THAN 3",
  "MY HEAD HURTS",
  "NO, JUST NO",
  "PLATYPUS",
  "PLZ STOP",
  "REALLY?",
  "REPLY HAZY",
  "SHYEAH RIGHT",
  "TRY AGAIN",
  "UMMM...NO",
  "WHO CARES?"
].filter(response => response.length <= MAX_DIGITS + 2);

const SHORTCUT_KEYS = {
  "c":      "clear",
  "C":      "clear",
  "0":      "zero",
  "1":      "one",
  "2":      "two",
  "3":      "three",
  "4":      "four",
  "5":      "five",
  "6":      "six",
  "7":      "seven",
  "8":      "eight",
  "9":      "nine",
  ".":      "decimal",
  "+":      "plus",
  "-":      "minus",
  "*":      "times",
  "/":      "divide-by",
  "=":      "equals",
  "Enter":  "equals",
  "Escape": "clear",
}

let mode;
let display;
let currNumber;
let prevNumber;
let currOperator;
let prevOperator; 

clearDisplay();
clearMemory();
refreshDisplay();
initializeListeners();
