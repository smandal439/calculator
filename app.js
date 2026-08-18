(function() {
    // ---- THEME TOGGLE ----
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    let currentTheme = localStorage.getItem('calcTheme') || 'dark';
    html.setAttribute('data-theme', currentTheme);
    themeToggle.textContent = currentTheme === 'dark' ? '🌙 Dark' : '☀️ Light';

    themeToggle.addEventListener('click', function() {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('calcTheme', next);
      themeToggle.textContent = next === 'dark' ? '🌙 Dark' : '☀️ Light';
    });

    // ---- TABS ----
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        const target = this.dataset.tab;
        tabs.forEach(t => {
          t.classList.toggle('active', t === this);
          t.setAttribute('aria-selected', t === this ? 'true' : 'false');
        });
        panels.forEach(p => {
          p.classList.toggle('active', p.id === target + '-panel');
        });
      });
    });

    // ---- STANDARD ----
    const std = { current: '0', previous: '', operation: null, reset: false };
    const stdCurr = document.getElementById('standard-current');
    const stdPrev = document.getElementById('standard-previous');

    function fmt(v) {
      if (v === 'Error') return 'Error';
      if (v === '') return '';
      const n = Number(v);
      if (!Number.isFinite(n)) return 'Error';
      if (Number.isInteger(n)) return String(n);
      return Number(n.toFixed(10)).toString();
    }

    function updateStd() {
      stdCurr.textContent = fmt(std.current);
      if (std.operation && std.previous) {
        const sym = { '+':'+', '-':'−', '*':'×', '/':'÷', '%':'%' }[std.operation] || std.operation;
        stdPrev.textContent = fmt(std.previous) + ' ' + sym;
      } else stdPrev.textContent = '';
    }

    function applyOp(a,b,op) {
      switch(op) { case '+': return a+b; case '-': return a-b; case '*': return a*b; case '/': return b===0?'Error':a/b; case '%': return (a/100)*b; default: return 'Error'; }
    }

    function stdCompute() {
      if (!std.operation || !std.previous) return;
      const prev = Number(std.previous), curr = Number(std.current);
      const res = applyOp(prev, curr, std.operation);
      if (res === 'Error') { std.current = 'Error'; std.previous = ''; std.operation = null; std.reset = true; updateStd(); return; }
      std.current = fmt(res);
      std.previous = '';
      std.operation = null;
      std.reset = true;
      updateStd();
    }

    function stdAppend(n) {
      if (std.current === 'Error') std.current = '0';
      if (std.reset) { std.current = '0'; std.reset = false; }
      if (n === '.' && std.current.includes('.')) return;
      std.current = (std.current === '0' && n !== '.') ? n : std.current + n;
      updateStd();
    }

    function stdOp(op) {
      if (std.current === 'Error') return;
      if (op === '%') { std.current = fmt(Number(std.current)/100); std.previous = ''; std.operation = null; std.reset = true; updateStd(); return; }
      if (std.previous && std.operation && !std.reset) stdCompute();
      std.previous = std.current;
      std.operation = op;
      std.reset = true;
      updateStd();
    }

    function stdDel() {
      if (std.current === 'Error') { std.current = '0'; std.previous = ''; std.operation = null; updateStd(); return; }
      std.current = std.current.length <= 1 ? '0' : std.current.slice(0, -1);
      updateStd();
    }

    function stdClear() { std.current = '0'; std.previous = ''; std.operation = null; std.reset = false; updateStd(); }

    document.querySelectorAll('#standard-panel [data-number]').forEach(b => b.addEventListener('click', () => stdAppend(b.dataset.number)));
    document.querySelectorAll('#standard-panel [data-operator]').forEach(b => b.addEventListener('click', () => stdOp(b.dataset.operator)));
    document.getElementById('standard-clear').addEventListener('click', stdClear);
    document.getElementById('standard-delete').addEventListener('click', stdDel);
    document.getElementById('standard-equals').addEventListener('click', stdCompute);

    // ---- SCIENTIFIC ----
    const sci = { expression: '0', reset: false };
    const sciCurr = document.getElementById('scientific-current');
    const sciPrev = document.getElementById('scientific-previous');

    function evalSci(expr) {
      let prep = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/π/g,'Math.PI').replace(/e/g,'Math.E')
        .replace(/sin\(/g,'sinDeg(').replace(/cos\(/g,'cosDeg(').replace(/tan\(/g,'tanDeg(')
        .replace(/log\(/g,'log10(').replace(/ln\(/g,'ln(').replace(/sqrt\(/g,'sqrt(').replace(/\^/g,'**').replace(/%/g,'/100');
      const open = (prep.match(/\(/g)||[]).length, close = (prep.match(/\)/g)||[]).length;
      if (open > close) prep += ')'.repeat(open-close);
      try {
        const sinDeg = v => Math.sin(v*Math.PI/180), cosDeg = v => Math.cos(v*Math.PI/180), tanDeg = v => Math.tan(v*Math.PI/180);
        const log10 = v => Math.log10(v), ln = v => Math.log(v), sqrt = v => Math.sqrt(v);
        const res = Function('sinDeg','cosDeg','tanDeg','log10','ln','sqrt', `return (${prep});`)(sinDeg,cosDeg,tanDeg,log10,ln,sqrt);
        if (!Number.isFinite(res)) return 'Error';
        return Number(res.toFixed(12)).toString();
      } catch(e) { return 'Error'; }
    }

    function updateSci() { sciCurr.textContent = sci.expression || '0'; sciPrev.textContent = ''; }

    function sciAppendNum(n) {
      if (sci.reset) { sci.expression = '0'; sci.reset = false; }
      if (sci.expression === 'Error') sci.expression = '0';
      if (sci.expression === '0' && n !== '.') sci.expression = n;
      else sci.expression += n;
      updateSci();
    }
    function sciAppendFunc(f) {
      if (sci.reset) { sci.expression = '0'; sci.reset = false; }
      if (sci.expression === 'Error') sci.expression = '0';
      if (sci.expression === '0' && ['sin(','cos(','tan(','log(','ln(','sqrt(','π','e'].includes(f)) sci.expression = '';
      sci.expression += f;
      updateSci();
    }
    function sciAppendOp(op) {
      if (sci.expression === 'Error') sci.expression = '0';
      if (sci.reset) { sci.expression = '0'; sci.reset = false; }
      const last = sci.expression.slice(-1);
      if (['+','-','*','/','%','^'].includes(last) && ['+','-','*','/','%','^'].includes(op)) {
        sci.expression = sci.expression.slice(0,-1) + op;
      } else sci.expression += op;
      updateSci();
    }
    function sciDel() {
      if (sci.expression === 'Error') { sci.expression = '0'; updateSci(); return; }
      sci.expression = sci.expression.slice(0,-1) || '0';
      updateSci();
    }
    function sciClear() { sci.expression = '0'; sci.reset = false; updateSci(); }
    function sciCalc() {
      if (sci.expression === 'Error' || sci.expression === '0') return;
      const res = evalSci(sci.expression);
      sci.expression = res;
      sci.reset = true;
      updateSci();
    }

    document.querySelectorAll('#scientific-panel [data-number]').forEach(b => {
      b.addEventListener('click', function() {
        if (this.dataset.number === 'π' || this.dataset.number === 'e') { sciAppendFunc(this.dataset.number); return; }
        sciAppendNum(this.dataset.number);
      });
    });
    document.querySelectorAll('#scientific-panel [data-function]').forEach(b => b.addEventListener('click', () => sciAppendFunc(b.dataset.function)));
    document.querySelectorAll('#scientific-panel [data-operator]').forEach(b => b.addEventListener('click', () => sciAppendOp(b.dataset.operator)));
    document.getElementById('scientific-clear').addEventListener('click', sciClear);
    document.getElementById('scientific-delete').addEventListener('click', sciDel);
    document.getElementById('scientific-equals').addEventListener('click', sciCalc);

    // ---- PROGRAMMER ----
    const prog = { current: '0', base: 10, operator: null, prev: null, reset: false };
    const progBase = document.getElementById('programmer-base');
    const progCurr = document.getElementById('programmer-current');
    const progDec = document.getElementById('programmer-dec');
    const progBin = document.getElementById('programmer-bin');
    const progHex = document.getElementById('programmer-hex');
    const progLabel = document.getElementById('programmer-label');

    function digitsForBase(b) {
      const d = [];
      for (let i=0; i<Math.min(10,b); i++) d.push(String(i));
      for (let i=10; i<b; i++) d.push(String.fromCharCode(65 + i - 10));
      return d;
    }

    function parseBase(v,b) { const p = parseInt(String(v).trim().toUpperCase(), b); return isNaN(p) ? 0 : p; }
    function fmtBase(v,b) {
      if (!Number.isFinite(v)) return 'Error';
      if (b===10) return Number(v).toString();
      const digits = '0123456789ABCDEF';
      let cur = Math.trunc(v), neg = false;
      if (cur === 0) return '0';
      if (cur < 0) { neg = true; cur = Math.abs(cur); }
      let res = '';
      while (cur > 0) { res = digits[cur % b] + res; cur = Math.floor(cur/b); }
      return (neg ? '-' : '') + res;
    }

    function updateProg() {
      const labels = { 2:'BIN', 8:'OCT', 10:'DEC', 16:'HEX' };
      progLabel.textContent = labels[prog.base] || 'DEC';
      progCurr.textContent = prog.current.toUpperCase();
      const dec = parseBase(prog.current, prog.base);
      progDec.textContent = fmtBase(dec, 10);
      progBin.textContent = fmtBase(dec, 2);
      progHex.textContent = fmtBase(dec, 16);
    }

    function progAppend(d) {
      const allowed = digitsForBase(prog.base);
      if (!allowed.includes(String(d).toUpperCase())) return;
      if (prog.reset) { prog.current = '0'; prog.reset = false; }
      prog.current = (prog.current === '0') ? String(d).toUpperCase() : prog.current + String(d).toUpperCase();
      updateProg();
    }
    function progClear() { prog.current = '0'; prog.operator = null; prog.prev = null; prog.reset = false; updateProg(); }
    function progDel() {
      prog.current = (prog.current.length <= 1) ? '0' : prog.current.slice(0,-1);
      updateProg();
    }
    function applyProgOp(a,b,op) {
      switch(op) { case '+': return a+b; case '-': return a-b; case '*': return a*b; case '/': return b===0?'Error':a/b; case 'AND': return a&b; case 'OR': return a|b; case 'XOR': return a^b; case '<<': return a<<b; case '>>': return a>>b; default: return 'Error'; }
    }
    function progSetOp(op) {
      if (prog.current === 'Error') { prog.current = '0'; updateProg(); return; }
      const curr = parseBase(prog.current, prog.base);
      if (prog.operator && prog.prev !== null && !prog.reset) {
        const res = applyProgOp(prog.prev, curr, prog.operator);
        prog.current = fmtBase(res, prog.base);
        prog.prev = parseBase(prog.current, prog.base);
      } else {
        prog.prev = curr;
      }
      prog.operator = op;
      prog.reset = true;
      updateProg();
    }
    function progEquals() {
      if (!prog.operator || prog.prev === null) return;
      const curr = parseBase(prog.current, prog.base);
      const res = applyProgOp(prog.prev, curr, prog.operator);
      if (res === 'Error') { prog.current = 'Error'; prog.operator = null; prog.prev = null; prog.reset = true; updateProg(); return; }
      prog.current = fmtBase(res, prog.base);
      prog.operator = null; prog.prev = null; prog.reset = true;
      updateProg();
    }
    function progNot() {
      const dec = parseBase(prog.current, prog.base);
      const res = ~dec;
      prog.current = fmtBase(res, prog.base);
      updateProg();
    }

    progBase.addEventListener('change', function() {
      const old = prog.base, nb = Number(this.value);
      const dec = parseBase(prog.current, old);
      prog.base = nb;
      prog.current = fmtBase(dec, nb);
      prog.reset = false;
      updateProg();
    });

    document.querySelectorAll('[data-programmer-digit]').forEach(b => b.addEventListener('click', () => progAppend(b.dataset.programmerDigit)));
    document.querySelectorAll('[data-programmer-op]').forEach(b => {
      b.addEventListener('click', function() {
        if (this.dataset.programmerOp === 'NOT') { progNot(); return; }
        progSetOp(this.dataset.programmerOp);
      });
    });
    document.getElementById('programmer-clear').addEventListener('click', progClear);
    document.getElementById('programmer-delete').addEventListener('click', progDel);
    document.getElementById('programmer-equals').addEventListener('click', progEquals);

    // ---- AGE ----
    const targetGroup = document.getElementById('target-date-group');
    const useCurrent = document.getElementById('use-current-date');
    const ageResult = document.getElementById('age-result');
    useCurrent.addEventListener('change', () => targetGroup.classList.toggle('hidden', useCurrent.checked));
    document.getElementById('age-calculate').addEventListener('click', function() {
      const birthVal = document.getElementById('birthdate').value;
      const targetVal = document.getElementById('targetdate').value;
      if (!birthVal) { ageResult.textContent = 'Please enter a valid birth date.'; return; }
      const birth = new Date(birthVal);
      const target = useCurrent.checked ? new Date() : new Date(targetVal);
      if (!useCurrent.checked && targetVal && isNaN(target.getTime())) { ageResult.textContent = 'Please enter a valid target date.'; return; }
      if (birth > target) { ageResult.textContent = 'Birth date cannot be after target date.'; return; }
      let y = target.getFullYear() - birth.getFullYear();
      let m = target.getMonth() - birth.getMonth();
      let d = target.getDate() - birth.getDate();
      if (d < 0) { m--; const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0); d += prevMonth.getDate(); }
      if (m < 0) { y--; m += 12; }
      ageResult.innerHTML = `You are <strong>${y}</strong> years, <strong>${m}</strong> months, <strong>${d}</strong> days old.`;
    });

    // ---- KEYBOARD ----
    document.addEventListener('keydown', function(e) {
      if (e.target.matches('input, select, textarea')) return;
      const activePanel = document.querySelector('.tab-panel.active');
      if (!activePanel) return;
      const id = activePanel.id;

      if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
        if (id === 'standard-panel') { stdAppend(e.key); e.preventDefault(); }
        else if (id === 'scientific-panel') { sciAppendNum(e.key); e.preventDefault(); }
        else if (id === 'programmer-panel') { 
          const allowed = digitsForBase(prog.base);
          if (allowed.includes(e.key.toUpperCase())) { progAppend(e.key); e.preventDefault(); }
        }
      }

      if (['+','-','*','/','%','^'].includes(e.key)) {
        if (id === 'standard-panel') { stdOp(e.key); e.preventDefault(); }
        else if (id === 'scientific-panel') { sciAppendOp(e.key); e.preventDefault(); }
        else if (id === 'programmer-panel') {
          const map = { '+':'+', '-':'-', '*':'*', '/':'/', '%':'%' };
          if (map[e.key]) { progSetOp(map[e.key]); e.preventDefault(); }
        }
      }

      if (e.key === 'Enter' || e.key === '=') {
        if (id === 'standard-panel') { stdCompute(); e.preventDefault(); }
        else if (id === 'scientific-panel') { sciCalc(); e.preventDefault(); }
        else if (id === 'programmer-panel') { progEquals(); e.preventDefault(); }
      }

      if (e.key === 'Backspace') {
        if (id === 'standard-panel') { stdDel(); e.preventDefault(); }
        else if (id === 'scientific-panel') { sciDel(); e.preventDefault(); }
        else if (id === 'programmer-panel') { progDel(); e.preventDefault(); }
      }

      if (e.key === 'Escape') {
        if (id === 'standard-panel') { stdClear(); e.preventDefault(); }
        else if (id === 'scientific-panel') { sciClear(); e.preventDefault(); }
        else if (id === 'programmer-panel') { progClear(); e.preventDefault(); }
      }
    });

    updateStd();
    updateSci();
    updateProg();
  })();