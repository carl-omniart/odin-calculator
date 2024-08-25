// Math

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, operator, b) {
  return a * b;
}

function divide(a, operator, b) {
  return a / b;
}

function operate(operator, a, b) {
  switch (operator) {
    case "+":
      return add(a, b);
    case "-":
      return subtract(a, b);
    case "*":
      return multiply(a, b);
    case "/":
      return divide(a, b);
  };
}

// Display

function refreshDisplay() {
  document.getElementById("display").textContent = displayNumberGetString();
}

// Events

function onClickKeys(event) {
  const key = event.target;

  switch (key.textContent) {
    case "AC":
      displayNumberReset();
      break;
    case "+/-":
      displayNumberToggleNegative();
      break;
    case "%":
      displayNumberToPercentage();
      break;
    case ".":
      displayNumberAddDecimal();
      break;
    case "0":
      displayNumberAddZero();
      break;
    default:
      if (key.classList.contains("operator")) onClickOperator(event);
      if (key.classList.contains(   "digit")) onClickDigit(event);
  };

  refreshDisplay();
}

function onClickDigit(event) {
  const digit = event.target.textContent;
  displayNumberAddDigit(digit);
}

function onClickOperator(event) {
  const operator = event.target.textContent;
}

// Display Number

function displayNumberReset() {
  displayNumber.digits   =    "";
  displayNumber.decimal  =  null;
  displayNumber.negative = false;
}

function displayNumberToggleNegative() {
  displayNumber.negative = !displayNumber.negative;
}

function displayNumberAddDecimal() {
  if (displayNumber.decimal != null) return;
  displayNumber.decimal = 0;
}

function displayNumberToPercentage() {
  if (+displayNumber.digits > 0) displayNumber.decimal += 2; // null + 2 = 2
}

function displayNumberAddZero() {
  if (displayNumber.decimal == null && +displayNumber.digits == 0) return;
  displayNumberAddDigit("0");
}

function displayNumberAddDigit(digit) {
  if (displayNumber.digits.length >= MAX_DISPLAY_DIGITS) return;
  if (displayNumber.digits == "0" && displayNumber.decimal == null) {
    displayNumber.digits = digit;
  } else {
    displayNumber.digits += digit;
    if (displayNumber.decimal != null) displayNumber.decimal += 1;
  };
}

function displayNumberGetValue() {
  let value = +displayNumber.digits;
  if (displayNumber.decimal != null) value /= 10**displayNumber.decimal;
  if (displayNumber.negative) value = -value;
  return value;
}

function displayNumberGetString() {
  displayNumberPad();
  displayNumberRound();

  let string = displayNumber.digits;
  string     = insertDecimal(string, displayNumber.decimal);
  if (displayNumber.negative) string = "-" + string;
  return string;
}

function displayNumberPad() {
  const digits  = displayNumber.digits;
  const decimal = displayNumber.decimal;

  displayNumber.digits = digits.padStart(decimal + 1, "0"); // null + 1 = 1
}

function displayNumberRound() {
  const digits = displayNumber.digits;
  const trim   = digits.length - MAX_DISPLAY_DIGITS;

  if (trim > 0) {
    displayNumber.digits = Math
      .round(+digits / (10**trim))
      .toString()
      .padStart(MAX_DISPLAY_DIGITS, "0");
    displayNumber.decimal -= trim;
  };
}

function insertDecimal(string, index) {
  index = string.length - index;
  return string.slice(0, index) + "." + string.slice(index);
}

const MAX_DISPLAY_DIGITS = 9;
const displayNumber      = {}

displayNumberReset();
refreshDisplay();

document.getElementById("keys").addEventListener("click", onClickKeys);
