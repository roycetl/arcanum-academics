// PDF.js worker (kept for any future fallback, not used for extraction)
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const state = {
  gameData: [], currentIdx: 0, score: 0, results: [],
  activeRocks: 0, svgW: 0, svgH: 0, wizX: 0, wizY: 0,
  wandTipX: 0, wandTipY: 0, wizShoulderX: 0, wizShoulderY: 0,
  gameActive: false, clickLocked: false, questionCardBottom: 220
};

const screens = {
  setup: document.getElementById('setup-screen'),
  game: document.getElementById('game-screen'),
  end: document.getElementById('end-screen')
};
const $ = id => document.getElementById(id);

function showScreen(name) {
  Object.values(screens).forEach(el => el.classList.remove('active', 'visible'));
  const el = screens[name]; el.classList.add('active');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
}
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function setMsg(el, text, type) { el.className = 'msg' + (type ? ' ' + type : ''); el.textContent = text; if (!type) el.style.display = 'none'; }
function showLoading(show) { $('loading-overlay').classList.toggle('show', show); }

// ── File Upload & AI Extraction ──
async function handleFileUpload(file) {
  const msgEl = $('q-msg');
  setMsg(msgEl, '');
  showLoading(true);

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload-gamify', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.status === 429) {
      setMsg(msgEl, data.error || 'Rate limited. Please wait before trying again.', 'warn');
      if (data.retryDelay) {
        $('start-btn').disabled = true;
        let countdown = data.retryDelay;
        const timer = setInterval(() => {
          countdown--;
          setMsg(msgEl, `Arcane energies recharging... ${countdown}s remaining`, 'warn');
          if (countdown <= 0) {
            clearInterval(timer);
            setMsg(msgEl, 'Mana recharged. You may upload again.', 'info');
          }
        }, 1000);
      }
      showLoading(false);
      return;
    }

    if (!res.ok || !data.success) {
      setMsg(msgEl, 'Error: ' + (data.error || 'Failed to extract questions.'), 'error');
      showLoading(false);
      return;
    }

    const questions = data.questions;
    if (!questions || questions.length === 0) {
      setMsg(msgEl, 'No questions found in this PDF. Try a different exam file.', 'error');
      showLoading(false);
      return;
    }

    // Map into game format
    state.gameData = questions.map(q => ({
      question: q.question,
      options: [
        'A. ' + q.A,
        'B. ' + q.B,
        'C. ' + q.C,
        'D. ' + q.D
      ],
      // answer is the letter (A/B/C/D), resolve to full option text
      answer: (() => {
        const letter = (q.answer || '').toUpperCase().trim();
        const map = { A: q.A, B: q.B, C: q.C, D: q.D };
        const text = map[letter];
        return text ? letter + '. ' + text : 'A. ' + q.A;
      })()
    }));

    // Update UI
    $('q-count').textContent = state.gameData.length;
    $('q-filename').textContent = file.name;
    $('file-status').style.display = 'block';
    setMsg(msgEl, `✓ Extracted ${state.gameData.length} question(s) from "${file.name}".`, 'info');
    $('start-btn').disabled = false;

  } catch (err) {
    setMsg(msgEl, 'Error: ' + (err.message || err), 'error');
  }

  showLoading(false);
}

// Dropzone wiring
const dz = $('q-dropzone'), fi = $('q-file');
fi.addEventListener('change', e => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; });
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); });

$('start-btn').addEventListener('click', () => {
  if (state.gameData.length < 1) {
    $('start-btn').classList.add('shake');
    setTimeout(() => $('start-btn').classList.remove('shake'), 500);
    setMsg($('start-msg'), 'Upload an exam PDF first.', 'error');
    return;
  }
  setMsg($('start-msg'), '');
  initGame();
});

function initGame() {
  // Shuffle
  const pairs = [...state.gameData];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  state.gameData = pairs;
  state.currentIdx = 0; state.score = 0; state.results = [];
  state.gameActive = true; state.clickLocked = false; state.activeRocks = 0;
  showScreen('game');
  setTimeout(() => { layoutSVG(); drawWizard(); measureQuestionCard(); loadQuestion(); }, 120);
}

function measureQuestionCard() {
  const card = document.querySelector('.question-card');
  if (card) { const rect = card.getBoundingClientRect(); state.questionCardBottom = rect.bottom + 30; }
}

function layoutSVG() {
  const svg = $('game-svg'); const rect = svg.getBoundingClientRect();
  state.svgW = rect.width; state.svgH = rect.height;
  state.wizX = 140; state.wizY = state.svgH - 100;
  const gl = $('ground-line');
  gl.setAttribute('x1', '0'); gl.setAttribute('y1', state.svgH - 80);
  gl.setAttribute('x2', state.svgW); gl.setAttribute('y2', state.svgH - 80);
}

function setWitchImage(imageName) {
  $('wiz-image').setAttribute('href', imageName);
  let imgW = 400, imgH = 400;
  if (imageName === '/witch.png') { imgW = 600; imgH = 600; }
  else if (imageName === '/witch_hurt.png') { imgW = 320; imgH = 320; }
  const x = state.wizX, bh = state.svgH - 80;
  $('wiz-image').setAttribute('x', x - imgW / 2);
  $('wiz-image').setAttribute('y', bh - imgH + 20);
  $('wiz-image').setAttribute('width', imgW);
  $('wiz-image').setAttribute('height', imgH);
}

function drawWizard() {
  const x = state.wizX, bh = state.svgH - 80;
  $('wiz-shadow').setAttribute('cx', x); $('wiz-shadow').setAttribute('cy', bh - 2);
  let currentImg = $('wiz-image').getAttribute('href') || '/witch_standing.png';
  let imgW = 400, imgH = 400;
  if (currentImg === '/witch.png') { imgW = 800; imgH = 800; }
  else if (currentImg === '/witch_hurt.png') { imgW = 320; imgH = 320; }
  $('wiz-image').setAttribute('x', x - imgW / 2);
  $('wiz-image').setAttribute('y', bh - imgH + 20);
  $('wiz-image').setAttribute('width', imgW);
  $('wiz-image').setAttribute('height', imgH);
  const shoulderX = x + 30, shoulderY = bh - 100;
  state.wizShoulderX = shoulderX; state.wizShoulderY = shoulderY;
  updateWandArm(shoulderX, shoulderY, 0);
}

function updateWandArm(sx, sy, angle) {
  const armEndX = sx + Math.cos(angle) * 35, armEndY = sy + Math.sin(angle) * 35;
  const wandEndX = armEndX + Math.cos(angle) * 40, wandEndY = armEndY + Math.sin(angle) * 40;
  $('wiz-arm').setAttribute('x1', sx); $('wiz-arm').setAttribute('y1', sy);
  $('wiz-arm').setAttribute('x2', armEndX); $('wiz-arm').setAttribute('y2', armEndY);
  $('wand-shaft').setAttribute('x1', armEndX); $('wand-shaft').setAttribute('y1', armEndY);
  $('wand-shaft').setAttribute('x2', wandEndX); $('wand-shaft').setAttribute('y2', wandEndY);
  $('wand-tip').setAttribute('cx', wandEndX); $('wand-tip').setAttribute('cy', wandEndY);
  $('wand-tip-inner').setAttribute('cx', wandEndX); $('wand-tip-inner').setAttribute('cy', wandEndY);
  state.wandTipX = wandEndX; state.wandTipY = wandEndY;
}

function aimWandAt(tx, ty) {
  const angle = Math.atan2(ty - state.wizShoulderY, tx - state.wizShoulderX);
  updateWandArm(state.wizShoulderX, state.wizShoulderY, angle);
}

function loadQuestion() {
  if (state.currentIdx >= state.gameData.length) { endGame(); return; }
  clearLayer('rocks-layer'); clearLayer('effects-layer');
  stopAllRockAnimations(); state.activeRocks = 0; state.clickLocked = false;
  const data = state.gameData[state.currentIdx];
  $('question-text').textContent = data.question;
  $('hud-q-num').textContent = state.currentIdx + 1;
  $('hud-q-total').textContent = state.gameData.length;
  updateScoreDisplay();
  requestAnimationFrame(() => { measureQuestionCard(); spawnRocks(data.options, data.answer); });
}

function makeRockPath(cx, cy, rw, rh, sides, seed) {
  const pts = [];
  pts.push([cx - rw, cy - rh]);
  pts.push([cx + rw, cy - rh]);
  pts.push([cx + rw + 10, cy]);
  pts.push([cx + rw, cy + rh]);
  pts.push([cx - rw, cy + rh]);
  pts.push([cx - rw - 10, cy]);
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
}

function wrapText(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const words = text.split(' '), lines = []; let cur = '';
  words.forEach(w => {
    if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  });
  if (cur) lines.push(cur.trim()); return lines;
}

function spawnRocks(options, correctAnswer) {
  const layer = $('rocks-layer'); const n = options.length;
  const svgH = state.svgH, svgW = state.svgW;
  const startX = Math.max(350, svgW * 0.25);
  const endX = svgW - 100;
  const stepX = n > 1 ? (endX - startX) / (n - 1) : 0;
  const rockRW = Math.min(90, Math.max(70, 85 - n * 2));
  const rockRH = Math.min(40, Math.max(30, 45 - n * 1));
  const maxCharsPerLine = Math.floor(rockRW / 6);
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  state.activeRocks = shuffled.length;

  shuffled.forEach((optionText, idx) => {
    const rockY = Math.max(state.questionCardBottom + 120, svgH * 0.75);
    const rockX = n === 1 ? (startX + endX) / 2 : startX + stepX * idx;
    const seed = (idx + 1) * 137;
    const isCorrect = (optionText === correctAnswer);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'rock-group');
    g.setAttribute('data-option', optionText);
    g.setAttribute('data-correct', isCorrect ? '1' : '0');
    g.setAttribute('transform', `translate(${rockX},${rockY})`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'rock-body');
    path.setAttribute('d', makeRockPath(0, 0, rockRW, rockRH, 6, seed));
    path.setAttribute('fill', 'url(#plaque-grad)');
    path.setAttribute('stroke', '#8A733E');
    path.setAttribute('stroke-width', '2');

    const lines = wrapText(optionText, maxCharsPerLine);
    const lineH = 15; const totalH = lines.length * lineH;
    const textG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textG.setAttribute('class', 'text-group');
    lines.forEach((line, li) => {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('class', 'rock-text'); t.setAttribute('x', '0');
      t.setAttribute('y', (-totalH / 2 + li * lineH + lineH / 2).toFixed(1));
      t.textContent = line; textG.appendChild(t);
    });

    const chest = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    chest.setAttribute('href', '/chest.png');
    chest.setAttribute('class', 'chest-cover');
    chest.setAttribute('x', -45); chest.setAttribute('y', -rockRH - 90);
    chest.setAttribute('width', 90); chest.setAttribute('height', 90);

    g.appendChild(path); g.appendChild(textG); g.appendChild(chest);
    g.addEventListener('click', onRockClick);
    layer.appendChild(g);
  });
}

const rockAnimations = new Map();
function stopAllRockAnimations() { rockAnimations.forEach(raf => cancelAnimationFrame(raf)); rockAnimations.clear(); }
function stopRockAnimation(g) { const raf = rockAnimations.get(g); if (raf) { cancelAnimationFrame(raf); rockAnimations.delete(g); } }

function handleAllRocksGone() {
  state.clickLocked = true;
  const data = state.gameData[state.currentIdx];
  state.results.push({ question: data.question, chosen: '(no answer)', correct: data.answer, isCorrect: false });
  setWitchImage('/witch_hurt.png');
  const layer = $('effects-layer');
  const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  popup.setAttribute('class', 'wrong-popup'); popup.setAttribute('x', state.svgW / 2);
  popup.setAttribute('y', state.svgH / 2); popup.textContent = '⏳ Encounter Failed!';
  layer.appendChild(popup);
  setTimeout(() => { setWitchImage('/witch_standing.png'); clearLayer('effects-layer'); state.currentIdx++; loadQuestion(); }, 2000);
}

function onRockClick(e) {
  if (state.clickLocked || !state.gameActive) return;
  state.clickLocked = true;
  setWitchImage('/witch.png');
  const g = e.currentTarget;
  const isCorrect = g.getAttribute('data-correct') === '1';
  const chosenOption = g.getAttribute('data-option');
  const match = g.getAttribute('transform').match(/translate\(([^,]+),([^)]+)\)/);
  const rockX = parseFloat(match[1]), rockY = parseFloat(match[2]);
  aimWandAt(rockX, rockY);
  setTimeout(() => fireLightning(rockX, rockY, isCorrect, g, chosenOption), 150);
}

function fireLightning(tx, ty, isCorrect, rockG, chosenOption) {
  const layer = $('effects-layer'); const sx = state.wandTipX, sy = state.wandTipY;
  const segs = 8, pts = [[sx, sy]];
  for (let i = 1; i < segs; i++) {
    const t = i / segs; const bx = sx + (tx - sx) * t, by = sy + (ty - sy) * t;
    const j = 20 * (1 - t);
    pts.push([bx + (Math.random() - .5) * j * 2, by + (Math.random() - .5) * j * 2]);
  }
  pts.push([tx, ty]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const b1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  b1.setAttribute('class', 'lightning-path'); b1.setAttribute('d', d); layer.appendChild(b1);
  const b2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  b2.setAttribute('class', 'lightning-path-2'); b2.setAttribute('d', d); layer.appendChild(b2);
  setTimeout(() => {
    if (b1.parentNode) layer.removeChild(b1);
    if (b2.parentNode) layer.removeChild(b2);
    isCorrect ? onCorrectHit(rockG, tx, ty, chosenOption) : onWrongHit(rockG, tx, ty, chosenOption);
  }, 350);
}

function updateScoreDisplay() {
  const answered = state.results.length;
  const correct = state.score;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  $('hud-score').textContent = `${correct}/${answered} (${pct}%)`;
}

function onCorrectHit(rockG, cx, cy, chosen) {
  setWitchImage('/witch_standing.png');
  stopRockAnimation(rockG); state.score++;
  const layer = $('effects-layer');
  const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  flash.setAttribute('cx', cx); flash.setAttribute('cy', cy);
  flash.setAttribute('r', '40'); flash.setAttribute('fill', 'rgba(46, 204, 113, 0.6)');
  flash.setAttribute('class', 'hit-flash'); layer.appendChild(flash);
  const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  popup.setAttribute('class', 'score-popup'); popup.setAttribute('x', cx);
  popup.setAttribute('y', cy - 25); popup.textContent = 'CRITICAL HIT!'; layer.appendChild(popup);
  spawnParticles(layer, cx, cy, '#F4D068', 12);
  document.querySelectorAll('.rock-group').forEach(rg => {
    if (rg === rockG) {
      rg.classList.add('show-diamond');
      const path = rg.querySelector('.rock-body'); if (path) path.style.display = 'none';
      const txt = rg.querySelector('.text-group'); if (txt) txt.style.display = 'none';
      const chest = rg.querySelector('.chest-cover');
      if (chest) {
        chest.setAttribute('href', '/diamond.png');
        chest.style.opacity = '1';
        chest.setAttribute('x', '-90'); chest.setAttribute('y', '-90');
        chest.setAttribute('width', '180'); chest.setAttribute('height', '180');
      }
    } else { rg.style.display = 'none'; }
  });
  recordResult(chosen, true); updateScoreDisplay();
  setTimeout(() => { clearLayer('effects-layer'); state.currentIdx++; loadQuestion(); }, 1000);
}

function spawnParticles(layer, cx, cy, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 60;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy);
    c.setAttribute('r', '5'); c.setAttribute('fill', color);
    c.setAttribute('class', 'particle');
    c.style.setProperty('--px', (Math.cos(a) * d).toFixed(1) + 'px');
    c.style.setProperty('--py', (Math.sin(a) * d).toFixed(1) + 'px');
    layer.appendChild(c);
  }
}

function onWrongHit(rockG, cx, cy, chosen) {
  try { new Audio('/fahhh.mp3').play(); } catch(e) {}

  setWitchImage('/witch_hurt.png');
  const layer = $('effects-layer');
  const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  flash.setAttribute('cx', cx); flash.setAttribute('cy', cy);
  flash.setAttribute('r', '40'); flash.setAttribute('fill', 'rgba(231, 76, 60, 0.6)');
  flash.setAttribute('class', 'hit-flash'); layer.appendChild(flash);
  const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  popup.setAttribute('class', 'wrong-popup'); popup.setAttribute('x', cx);
  popup.setAttribute('y', cy - 25); popup.textContent = '-50 HP'; layer.appendChild(popup);
  const rockPath = rockG.querySelector('path');
  if (rockPath) {
    rockPath.classList.add('rock-shake');
    setTimeout(() => rockPath.classList.remove('rock-shake'), 500);
    rockPath.setAttribute('stroke', '#e74c3c');
  }
  rockG.style.opacity = '0.5'; rockG.style.filter = 'grayscale(1)';
  rockG.removeEventListener('click', onRockClick);
  recordResult(chosen, false); updateScoreDisplay();
  setTimeout(() => { setWitchImage('/witch_standing.png'); clearLayer('effects-layer'); stopRockAnimation(rockG); rockG.remove(); state.currentIdx++; loadQuestion(); }, 2000);
}

function clearLayer(id) { const l = $(id); while (l.firstChild) l.removeChild(l.firstChild); }
function recordResult(chosen, isCorrect) {
  const data = state.gameData[state.currentIdx];
  state.results.push({ question: data.question, chosen, correct: data.answer, isCorrect });
}

function endGame() {
  state.gameActive = false; stopAllRockAnimations();
  const total = state.results.length;
  const correct = state.results.filter(r => r.isCorrect).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const pctEl = $('end-pct');
  pctEl.textContent = pct + '%';
  pctEl.className = 'score-pct ' + (pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'red');
  $('end-raw').textContent = `${correct} / ${total} Legendary Loot Acquired`;
  const tbody = $('results-tbody'); tbody.innerHTML = '';
  state.results.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${escHtml(r.question)}</td><td>${escHtml(r.chosen)}</td><td>${escHtml(r.correct)}</td><td class="${r.isCorrect ? 'result-correct' : 'result-wrong'}">${r.isCorrect ? 'Critical!' : 'Failed'}</td>`;
    tbody.appendChild(tr);
  });
  showScreen('end');
}

$('play-again-btn').addEventListener('click', () => {
  clearLayer('rocks-layer'); clearLayer('effects-layer');
  stopAllRockAnimations(); state.gameActive = false;
  showScreen('setup');
});

window.addEventListener('resize', () => {
  if (state.gameActive) { layoutSVG(); drawWizard(); measureQuestionCard(); }
});

showScreen('setup');
