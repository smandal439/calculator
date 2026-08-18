const tabButtons = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;

    tabButtons.forEach((tab) => {
      const isActive = tab === button;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `${target}-panel`);
    });
  });
});

const standardCalc = {
  current: '0',
  previous: '',
  operation: null,
  shouldReset: false,
};

const standardCurrent = document.getElementById('standard-current');
const standardPrevious = document.getElementById('standard-previous');

function formatStandardNumber(value) {
  if (value === 'Error') return 'Error';
  if (value === '') return '';

  const number = Number(value);
  if (!Number.isFinite(number)) return 'Error';
  if (Number.isInteger(number)) return String(number);

  return Number(number.toFixed(10)).toString();
}

function updateStandardDisplay() {
  standardCurrent.textContent = formatStandardNumber(standardCalc.current);

  if (standardCalc.operation && standardCalc.previous) {
    const symbol = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷',
      '%': '%',
    }[standardCalc.operation] || standardCalc.operation;
    standardPrevious.textContent = `${formatStandardNumber(standardCalc.previous)} ${symbol}`;
  } else {
    standardPrevious.textContent = '';
  }
}

function applyStandardOperation(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) return 'Error';
      return a / b;
    case '%':
      return (a / 100) * b;
    default:
      return 'Error';
  }
}

function standardCompute() {
  if (standardCalc.operation === null || !standardCalc.previous) return;

  const prev = Number(standardCalc.previous);
  const current = Number(standardCalc.current);
  const result = applyStandardOperation(prev, current, standardCalc.operation);

  if (result === 'Error') {
    standardCalc.current = 'Error';
    standardCalc.previous = '';
    standardCalc.operation = null;
    standardCalc.shouldReset = true;
    updateStandardDisplay();
    return;
  }

  standardCalc.current = formatStandardNumber(result);
  standardCalc.previous = '';
  standardCalc.operation = null;
  standardCalc.shouldReset = true;
  updateStandardDisplay();
}

function standardAppendNumber(number) {
  if (standardCalc.current === 'Error') {
    standardCalc.current = '0';
  }

  if (standardCalc.shouldReset) {
    standardCalc.current = '0';
    standardCalc.shouldReset = false;
  }

  if (number === '.' && standardCalc.current.includes('.')) return;

  if (standardCalc.current === '0' && number !== '.') {
    standardCalc.current = number;
  } else {
    standardCalc.current += number;
  }

  updateStandardDisplay();
}

function standardChooseOperator(operator) {
  if (standardCalc.current === 'Error') return;

  if (operator === '%') {
    standardCalc.current = formatStandardNumber(Number(standardCalc.current) / 100);
    standardCalc.previous = '';
    standardCalc.operation = null;
    standardCalc.shouldReset = true;
    updateStandardDisplay();
    return;
  }

  if (standardCalc.previous && standardCalc.operation && !standardCalc.shouldReset) {
    standardCompute();
  }

  standardCalc.previous = standardCalc.current;
  standardCalc.operation = operator;
  standardCalc.shouldReset = true;
  updateStandardDisplay();
}

function standardDelete() {
  if (standardCalc.current === 'Error') {
    standardCalc.current = '0';
    standardCalc.previous = '';
    standardCalc.operation = null;
    updateStandardDisplay();
    return;
  }

  if (standardCalc.current.length <= 1) {
    standardCalc.current = '0';
  } else {
    standardCalc.current = standardCalc.current.slice(0, -1);
  }

  updateStandardDisplay();
}

function standardClear() {
  standardCalc.current = '0';
  standardCalc.previous = '';
  standardCalc.operation = null;
  standardCalc.shouldReset = false;
  updateStandardDisplay();
}

document.querySelectorAll('[data-number]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.closest('#standard-panel')) {
      standardAppendNumber(button.dataset.number);
    }
  });
});

document.querySelectorAll('[data-operator]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.closest('#standard-panel')) {
      standardChooseOperator(button.dataset.operator);
    }
  });
});

document.getElementById('standard-clear').addEventListener('click', standardClear);
document.getElementById('standard-delete').addEventListener('click', standardDelete);
document.getElementById('standard-equals').addEventListener('click', standardCompute);

const scientificCalc = {
  expression: '0',
  shouldReset: false,
};

const scientificCurrent = document.getElementById('scientific-current');
const scientificPrevious = document.getElementById('scientific-previous');

function stripTrailingOperator(value) {
  return value.replace(/[+\-*/%^]$/, '');
}

function evaluateScientificExpression(expression) {
  let prepared = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/sin\(/g, 'sinDeg(')
    .replace(/cos\(/g, 'cosDeg(')
    .replace(/tan\(/g, 'tanDeg(')
    .replace(/log\(/g, 'log10(')
    .replace(/ln\(/g, 'ln(')
    .replace(/sqrt\(/g, 'sqrt(')
    .replace(/\^/g, '**')
    .replace(/%/g, '/100');

  const openParens = (prepared.match(/\(/g) || []).length;
  const closeParens = (prepared.match(/\)/g) || []).length;
  if (openParens > closeParens) {
    prepared += ')'.repeat(openParens - closeParens);
  }

  try {
    const sinDeg = (value) => Math.sin((Number(value) * Math.PI) / 180);
    const cosDeg = (value) => Math.cos((Number(value) * Math.PI) / 180);
    const tanDeg = (value) => Math.tan((Number(value) * Math.PI) / 180);
    const log10 = (value) => Math.log10(Number(value));
    const ln = (value) => Math.log(Number(value));
    const sqrt = (value) => Math.sqrt(Number(value));

    const result = Function(
      'sinDeg',
      'cosDeg',
      'tanDeg',
      'log10',
      'ln',
      'sqrt',
      `return (${prepared});`
    )(sinDeg, cosDeg, tanDeg, log10, ln, sqrt);

    if (!Number.isFinite(result)) return 'Error';
    return Number(result.toFixed(12)).toString();
  } catch (error) {
    return 'Error';
  }
}

function updateScientificDisplay() {
  scientificCurrent.textContent = scientificCalc.expression || '0';
  scientificPrevious.textContent = '';
}

function scientificAppendNumber(number) {
  if (scientificCalc.shouldReset) {
    scientificCalc.expression = '0';
    scientificCalc.shouldReset = false;
  }

  if (scientificCalc.expression === 'Error') {
    scientificCalc.expression = '0';
  }

  if (scientificCalc.expression === '0' && number !== '.') {
    scientificCalc.expression = number;
  } else {
    scientificCalc.expression += number;
  }

  updateScientificDisplay();
}

function scientificAppendFunction(name) {
  if (scientificCalc.shouldReset) {
    scientificCalc.expression = '0';
    scientificCalc.shouldReset = false;
  }

  if (scientificCalc.expression === 'Error') {
    scientificCalc.expression = '0';
  }

  if (scientificCalc.expression === '0' && !['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt('].includes(name)) {
    scientificCalc.expression = '';
  }

  scientificCalc.expression += name;
  updateScientificDisplay();
}

function scientificAppendOperator(operator) {
  if (scientificCalc.expression === 'Error') {
    scientificCalc.expression = '0';
  }

  if (scientificCalc.shouldReset) {
    scientificCalc.expression = '0';
    scientificCalc.shouldReset = false;
  }

  const lastChar = scientificCalc.expression.slice(-1);
  const operators = ['+', '-', '*', '/', '%', '^'];
  if (operators.includes(lastChar) && operators.includes(operator)) {
    scientificCalc.expression = stripTrailingOperator(scientificCalc.expression) + operator;
  } else {
    scientificCalc.expression += operator;
  }

  updateScientificDisplay();
}

function scientificDelete() {
  if (scientificCalc.expression === 'Error') {
    scientificCalc.expression = '0';
    updateScientificDisplay();
    return;
  }

  scientificCalc.expression = scientificCalc.expression.slice(0, -1) || '0';
  updateScientificDisplay();
}

function scientificClear() {
  scientificCalc.expression = '0';
  scientificCalc.shouldReset = false;
  updateScientificDisplay();
}

function scientificCalculate() {
  if (scientificCalc.expression === 'Error' || scientificCalc.expression === '0') return;

  const result = evaluateScientificExpression(scientificCalc.expression);
  scientificCalc.expression = result;
  scientificCalc.shouldReset = true;
  updateScientificDisplay();
}

document.querySelectorAll('#scientific-panel [data-number]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.number === 'π' || button.dataset.number === 'e') {
      scientificAppendFunction(button.dataset.number);
      return;
    }
    scientificAppendNumber(button.dataset.number);
  });
});

document.querySelectorAll('#scientific-panel [data-function]').forEach((button) => {
  button.addEventListener('click', () => {
    scientificAppendFunction(button.dataset.function);
  });
});

document.querySelectorAll('#scientific-panel [data-operator]').forEach((button) => {
  button.addEventListener('click', () => {
    scientificAppendOperator(button.dataset.operator);
  });
});

document.getElementById('scientific-clear').addEventListener('click', scientificClear);
document.getElementById('scientific-delete').addEventListener('click', scientificDelete);
document.getElementById('scientific-equals').addEventListener('click', scientificCalculate);

const programmerState = {
  current: '0',
  base: 10,
  operator: null,
  previousValue: null,
  shouldReset: false,
};

const programmerBase = document.getElementById('programmer-base');
const programmerCurrent = document.getElementById('programmer-current');
const programmerDec = document.getElementById('programmer-dec');
const programmerBin = document.getElementById('programmer-bin');
const programmerHex = document.getElementById('programmer-hex');
const programmerLabel = document.getElementById('programmer-label');

function getAllowedDigits(base) {
  const digits = [];
  for (let i = 0; i < Math.min(10, base); i += 1) {
    digits.push(String(i));
  }
  for (let i = 10; i < base; i += 1) {
    digits.push(String.fromCharCode(65 + (i - 10)));
  }
  return digits;
}

function parseValueInBase(value, base) {
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return 0;
  const parsed = Number.parseInt(normalized, base);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatValueInBase(value, base) {
  if (!Number.isFinite(value)) return 'Error';
  if (base === 10) {
    return Number(value).toString();
  }

  const digits = '0123456789ABCDEF';
  let result = '';
  let current = Math.trunc(value);

  if (current === 0) return '0';

  if (current < 0) {
    result = '-';
    current = Math.abs(current);
  }

  while (current > 0) {
    const remainder = current % base;
    result += digits[remainder];
    current = Math.floor(current / base);
  }

  return result.split('').reverse().join('');
}

function updateProgrammerDisplay() {
  const baseLabel = {
    2: 'BIN',
    8: 'OCT',
    10: 'DEC',
    16: 'HEX',
  }[programmerState.base] || 'DEC';

  programmerLabel.textContent = baseLabel;
  programmerCurrent.textContent = programmerState.current.toUpperCase();

  const decimal = parseValueInBase(programmerState.current, programmerState.base);
  programmerDec.textContent = formatValueInBase(decimal, 10);
  programmerBin.textContent = formatValueInBase(decimal, 2);
  programmerHex.textContent = formatValueInBase(decimal, 16);
}

function programmerAppendDigit(digit) {
  const allowedDigits = getAllowedDigits(programmerState.base);
  if (!allowedDigits.includes(String(digit).toUpperCase())) return;

  if (programmerState.shouldReset) {
    programmerState.current = '0';
    programmerState.shouldReset = false;
  }

  if (programmerState.current === '0') {
    programmerState.current = String(digit).toUpperCase();
  } else {
    programmerState.current += String(digit).toUpperCase();
  }

  updateProgrammerDisplay();
}

function programmerClear() {
  programmerState.current = '0';
  programmerState.operator = null;
  programmerState.previousValue = null;
  programmerState.shouldReset = false;
  updateProgrammerDisplay();
}

function programmerDelete() {
  if (programmerState.current.length <= 1) {
    programmerState.current = '0';
  } else {
    programmerState.current = programmerState.current.slice(0, -1);
  }
  updateProgrammerDisplay();
}

function applyProgrammerOperation(a, b, op) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? 'Error' : a / b;
    case 'AND':
      return a & b;
    case 'OR':
      return a | b;
    case 'XOR':
      return a ^ b;
    case '<<':
      return a << b;
    case '>>':
      return a >> b;
    default:
      return 'Error';
  }
}

function programmerSetOperator(operator) {
  if (programmerState.current === 'Error') {
    programmerState.current = '0';
    updateProgrammerDisplay();
    return;
  }

  const currentValue = parseValueInBase(programmerState.current, programmerState.base);

  if (programmerState.operator && programmerState.previousValue !== null && !programmerState.shouldReset) {
    const result = applyProgrammerOperation(programmerState.previousValue, currentValue, programmerState.operator);
    programmerState.current = formatValueInBase(result, programmerState.base);
    programmerState.previousValue = parseValueInBase(programmerState.current, programmerState.base);
  } else {
    programmerState.previousValue = currentValue;
  }

  programmerState.operator = operator;
  programmerState.shouldReset = true;
  updateProgrammerDisplay();
}

function programmerEquals() {
  if (programmerState.operator === null || programmerState.previousValue === null) return;

  const currentValue = parseValueInBase(programmerState.current, programmerState.base);
  const result = applyProgrammerOperation(programmerState.previousValue, currentValue, programmerState.operator);

  if (result === 'Error') {
    programmerState.current = 'Error';
    programmerState.operator = null;
    programmerState.previousValue = null;
    programmerState.shouldReset = true;
    updateProgrammerDisplay();
    return;
  }

  programmerState.current = formatValueInBase(result, programmerState.base);
  programmerState.operator = null;
  programmerState.previousValue = null;
  programmerState.shouldReset = true;
  updateProgrammerDisplay();
}

function programmerApplyNot() {
  const decimalValue = parseValueInBase(programmerState.current, programmerState.base);
  const result = ~decimalValue;
  programmerState.current = formatValueInBase(result, programmerState.base);
  updateProgrammerDisplay();
}

programmerBase.addEventListener('change', (event) => {
  const oldBase = programmerState.base;
  const newBase = Number(event.target.value);
  const decimalValue = parseValueInBase(programmerState.current, oldBase);

  programmerState.base = newBase;
  programmerState.current = formatValueInBase(decimalValue, newBase);
  programmerState.shouldReset = false;
  updateProgrammerDisplay();
});

document.querySelectorAll('[data-programmer-digit]').forEach((button) => {
  button.addEventListener('click', () => programmerAppendDigit(button.dataset.programmerDigit));
});

document.querySelectorAll('[data-programmer-op]').forEach((button) => {
  button.addEventListener('click', () => {
    const op = button.dataset.programmerOp;
    if (op === 'NOT') {
      programmerApplyNot();
      return;
    }
    programmerSetOperator(op);
  });
});

document.getElementById('programmer-clear').addEventListener('click', programmerClear);
document.getElementById('programmer-delete').addEventListener('click', programmerDelete);
document.getElementById('programmer-equals').addEventListener('click', programmerEquals);

const targetDateGroup = document.getElementById('target-date-group');
const useCurrentDate = document.getElementById('use-current-date');
const ageResult = document.getElementById('age-result');

useCurrentDate.addEventListener('change', () => {
  targetDateGroup.classList.toggle('hidden', useCurrentDate.checked);
});

document.getElementById('age-calculate').addEventListener('click', () => {
  const birthDateValue = document.getElementById('birthdate').value;
  const targetDateValue = document.getElementById('targetdate').value;

  if (!birthDateValue) {
    ageResult.textContent = 'Please enter a valid birth date.';
    return;
  }

  const birthDate = new Date(birthDateValue);
  const targetDate = useCurrentDate.checked ? new Date() : new Date(targetDateValue);

  if (targetDateValue && useCurrentDate.checked === false && isNaN(targetDate.getTime())) {
    ageResult.textContent = 'Please enter a valid target date.';
    return;
  }

  if (birthDate > targetDate) {
    ageResult.textContent = 'Birth date cannot be after the target date.';
    return;
  }

  let years = targetDate.getFullYear() - birthDate.getFullYear();
  let months = targetDate.getMonth() - birthDate.getMonth();
  let days = targetDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  ageResult.innerHTML = `You are <strong>${years}</strong> years, <strong>${months}</strong> months, and <strong>${days}</strong> days old.`;
});

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, select')) return;

  if (event.key >= '0' && event.key <= '9' || event.key === '.') {
    if (document.querySelector('.tab-panel.active').id === 'standard-panel') {
      standardAppendNumber(event.key);
    }
  }

  if (['+', '-', '*', '/', '%'].includes(event.key)) {
    if (document.querySelector('.tab-panel.active').id === 'standard-panel') {
      standardChooseOperator(event.key);
    }
  }

  if (event.key === 'Enter' || event.key === '=') {
    if (document.querySelector('.tab-panel.active').id === 'standard-panel') {
      standardCompute();
    } else if (document.querySelector('.tab-panel.active').id === 'scientific-panel') {
      scientificCalculate();
    }
  }

  if (event.key === 'Backspace') {
    if (document.querySelector('.tab-panel.active').id === 'standard-panel') {
      standardDelete();
    } else if (document.querySelector('.tab-panel.active').id === 'scientific-panel') {
      scientificDelete();
    } else if (document.querySelector('.tab-panel.active').id === 'programmer-panel') {
      programmerDelete();
    }
  }

  if (event.key === 'Escape') {
    if (document.querySelector('.tab-panel.active').id === 'standard-panel') {
      standardClear();
    } else if (document.querySelector('.tab-panel.active').id === 'scientific-panel') {
      scientificClear();
    } else if (document.querySelector('.tab-panel.active').id === 'programmer-panel') {
      programmerClear();
    }
  }
});

updateStandardDisplay();
updateScientificDisplay();
updateProgrammerDisplay();
