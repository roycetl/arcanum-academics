// PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const state = { questions: [], answers: [], gameData: [], currentIdx: 0, score: 0, results: [], activeRocks: 0, svgW: 0, svgH: 0, wizX: 0, wizY: 0, wandTipX: 0, wandTipY: 0, wizShoulderX: 0, wizShoulderY: 0, gameActive: false, clickLocked: false, questionCardBottom: 220 };
    const screens = { setup: document.getElementById('setup-screen'), game: document.getElementById('game-screen'), end: document.getElementById('end-screen') };
    const $ = id => document.getElementById(id);

    function showScreen(name) {
      Object.values(screens).forEach(el => el.classList.remove('active', 'visible'));
      const el = screens[name]; el.classList.add('active');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));
    }
    function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function setMsg(el, text, type) { el.className = 'msg' + (type ? ' ' + type : ''); el.textContent = text; if (!type) el.style.display = 'none'; }
    function showLoading(show) { $('loading-overlay').classList.toggle('show', show); }

    async function extractTextFromDocx(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async e => { try { const r = await mammoth.extractRawText({ arrayBuffer: e.target.result }); resolve(r.value); } catch (err) { reject(err); } };
        reader.onerror = reject; reader.readAsArrayBuffer(file);
      });
    }
    async function extractTextFromPdf(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i); const content = await page.getTextContent();
              const lineMap = new Map();
              for (const item of content.items) {
                if (!item.str) continue;
                const y = Math.round(item.transform[5] / 4) * 4;
                if (!lineMap.has(y)) lineMap.set(y, []);
                lineMap.get(y).push({ x: item.transform[4], str: item.str });
              }
              const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
              const lines = sortedYs.map(y => lineMap.get(y).sort((a, b) => a.x - b.x).map(it => it.str).join(' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
              fullText += lines.join('\n') + '\n';
            }
            resolve(fullText);
          } catch (err) { reject(err); }
        };
        reader.onerror = reject; reader.readAsArrayBuffer(file);
      });
    }

    function parseInlineOptions(line) {
      // Must start with an option marker (a-e followed by . or )) to be safe
      if (!/^[a-e][\.\)]\s/i.test(line.trim())) return null;
      // Split on 2+ whitespace chars followed by another option marker
      const parts = line.split(/\s{2,}(?=[a-e][\.\)]\s)/i);
      if (parts.length < 2) return null;
      const opts = [];
      for (const part of parts) {
        const m = part.trim().match(/^([a-e])[\.\)]\s*(.+)/i);
        if (m) opts.push(m[1].toLowerCase() + '. ' + m[2].trim());
      }
      return opts.length >= 2 ? opts : null;
    }

    function extractQuestionsWithOptions(rawText) {
      const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); const lines = text.split('\n');
      const qStartRe = /^(\d{1,3})\.\s+(.+)/; const subOptRe = /^([a-e])[\.\)]\s*(.+)/i; const skipRe = /^(Physics\s*2A|Study\s*Jam|FRQ\s*Questions?|Conceptual|MCQ|-\s*\d+\s*-)/i; const pageNumRe = /^-\s*\d+\s*-$/;
      const candidates = []; lines.forEach((line, idx) => { const t = line.trim(); const m = t.match(qStartRe); if (m) candidates.push({ lineIdx: idx, num: parseInt(m[1]), startText: m[2] }); });
      let best = [];
      for (let s = 0; s < candidates.length; s++) {
        const chain = [candidates[s]]; let exp = candidates[s].num + 1;
        for (let j = s + 1; j < candidates.length; j++) { if (candidates[j].num === exp) { chain.push(candidates[j]); exp++; } }
        if (chain.length > best.length) best = chain;
      }
      if (best.length === 0) return [];
      const results = [];
      for (let i = 0; i < best.length; i++) {
        const startLine = best[i].lineIdx; const endLine = i + 1 < best.length ? best[i + 1].lineIdx : lines.length; const qNum = best[i].num;
        let qText = best[i].startText.trim(); const options = []; let inOptions = false;
        // Check if the question start line itself contains inline options
        const startInline = parseInlineOptions(qText);
        if (startInline) {
          const firstMarkerIdx = qText.search(/\s+[a-e][\.\)]\s/i);
          if (firstMarkerIdx > 0) qText = qText.slice(0, firstMarkerIdx);
          options.push(...startInline); inOptions = true;
        }
        for (let li = startLine + 1; li < endLine; li++) {
          const t = lines[li].trim(); if (!t || skipRe.test(t) || pageNumRe.test(t)) continue;
          const inlineOpts = parseInlineOptions(t);
          if (inlineOpts) { inOptions = true; options.push(...inlineOpts); continue; }
          const optM = t.match(subOptRe);
          if (optM) { inOptions = true; options.push(optM[1].toLowerCase() + '. ' + optM[2].trim()); continue; }
          if (!inOptions) qText += ' ' + t;
        }
        qText = qText.replace(/-\s*\d+\s*-/g, '').replace(/\s+/g, ' ').trim();
        if (qText.length > 3) results.push({ text: qNum + '. ' + qText, displayText: qText, options });
      }
      return results;
    }

    function parseManualQuestions(rawText) {
      const fromParsed = extractQuestionsWithOptions(rawText); if (fromParsed.length >= 1) return fromParsed;
      return rawText.split('\n').map(l => l.trim()).filter(l => l.length > 4).map((t, i) => ({ text: (i + 1) + '. ' + t, displayText: t, options: [] }));
    }
    function parseManualOptions(rawText) {
      const groups = rawText.split(/\n[ \t]*\n+/).map(g => g.trim()).filter(Boolean);
      return groups.map(group => { const lines = group.split('\n').map(l => l.trim()).filter(Boolean); return lines.filter(l => /^[a-e][\.\)]\s/i.test(l)).map(l => l.replace(/^([a-e])[\.\)]\s*/i, (_, ch) => ch.toLowerCase() + '. ')); }).filter(g => g.length >= 2);
    }
    function parseAnswerLetters(rawText) { return rawText.split('\n').map(l => l.trim().replace(/^\d+[\.\)]\s*/, '').toLowerCase()).filter(l => /^[a-e]$/.test(l)); }
    function resolveAnswerLetter(letter, questionIdx) { const q = state.questions[questionIdx]; if (!q || !q.options.length) return letter; const match = q.options.find(o => o.toLowerCase().startsWith(letter.toLowerCase() + '.')); return match || letter; }

    function renderQuestionList() {
      const list = $('q-list'); const count = state.questions.length; $('q-count').textContent = count;
      if (count === 0) { list.innerHTML = '<div class="list-empty">The archive is empty</div>'; return; }
      list.innerHTML = '';
      state.questions.forEach((q, i) => {
        const hasOpts = q.options.length > 0; const div = document.createElement('div'); div.className = 'list-item';
        div.innerHTML = `<span class="list-item-num">${i + 1}.</span><div class="list-item-body"><div>${escHtml(q.displayText.length > 80 ? q.displayText.slice(0, 80) + '…' : q.displayText)}</div><div class="list-item-opts">${hasOpts ? q.options.length + ' illusion(s)' : '⚠ no illusions'}</div></div><span class="list-item-del" data-idx="${i}" title="Remove">✕</span>`;
        list.appendChild(div);
      });
    }
    function renderOptionsList() {
      const list = $('o-list'); const withOpts = state.questions.filter(q => q.options.length >= 2).length; $('o-count').textContent = withOpts;
      if (state.questions.length === 0) { list.innerHTML = '<div class="list-empty">No illusions conjured yet</div>'; return; }
      list.innerHTML = '';
      state.questions.forEach((q, i) => {
        if (!q.options.length) return; const div = document.createElement('div'); div.className = 'list-item';
        div.innerHTML = `<span class="list-item-num">Q${i + 1}</span><div class="list-item-body">${q.options.map(o => escHtml(o)).join('<br>')}</div>`; list.appendChild(div);
      });
      if (list.childElementCount === 0) list.innerHTML = '<div class="list-empty">No options extracted yet</div>';
    }
    function renderAnswerList() {
      const list = $('a-list'); const total = state.answers.length; $('a-count').textContent = total; $('a-total').textContent = state.questions.length;
      if (total === 0) { list.innerHTML = '<div class="list-empty">No truths sealed yet</div>'; return; }
      list.innerHTML = '';
      state.answers.forEach((a, i) => {
        const div = document.createElement('div'); div.className = 'list-item';
        div.innerHTML = `<span class="list-item-num">${i + 1}.</span><div class="list-item-body"><div style="color:var(--electric-blue)">${escHtml(a.letter.toUpperCase())}</div><div class="list-item-opts">${escHtml(a.resolvedText)}</div></div><span class="list-item-del" data-idx="${i}" title="Remove">✕</span>`; list.appendChild(div);
      });
    }

    function updatePanelStates() {
      const hasQwithOpts = state.questions.filter(q => q.options.length >= 2).length; const qTotal = state.questions.length;
      const canAddAnswers = hasQwithOpts >= 2; const answersPanel = $('panel-answers');
      answersPanel.classList.toggle('disabled', !canAddAnswers); $('a-textarea').disabled = !canAddAnswers; $('a-add-btn').disabled = !canAddAnswers; $('a-clear-btn').disabled = !canAddAnswers; $('a-required').textContent = qTotal; $('a-total').textContent = qTotal;
      const matchedPairs = Math.min(state.answers.length, hasQwithOpts); const canStart = matchedPairs >= 2 && state.answers.length === qTotal;
      $('start-btn').disabled = !canStart;
      if (state.answers.length > 0 && state.answers.length !== qTotal) setMsg($('a-msg'), `${state.answers.length} answer(s) for ${qTotal} question(s) — counts must match.`, 'warn');
    }

    $('q-list').addEventListener('click', e => { const del = e.target.closest('[data-idx]'); if (!del) return; state.questions.splice(+del.dataset.idx, 1); state.answers = []; renderQuestionList(); renderOptionsList(); renderAnswerList(); updatePanelStates(); });
    $('q-add-btn').addEventListener('click', () => { const raw = $('q-textarea').value.trim(); if (!raw) return; const parsed = parseManualQuestions(raw); if (!parsed.length) { setMsg($('q-msg'), 'No questions found — try numbering them (1. Question)', 'error'); return; } setMsg($('q-msg'), ''); parsed.forEach(q => state.questions.push(q)); $('q-textarea').value = ''; state.answers = []; renderQuestionList(); renderOptionsList(); renderAnswerList(); updatePanelStates(); });
    $('q-clear-btn').addEventListener('click', () => { state.questions = []; state.answers = []; renderQuestionList(); renderOptionsList(); renderAnswerList(); setMsg($('q-msg'), ''); updatePanelStates(); });
    $('q-textarea').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !$('q-textarea').value.includes('\n')) { e.preventDefault(); $('q-add-btn').click(); } });

    $('o-add-btn').addEventListener('click', () => { const raw = $('o-textarea').value.trim(); if (!raw) return; const groups = parseManualOptions(raw); if (!groups.length) { setMsg($('o-msg'), 'No options found — use format: a. Option A', 'error'); return; } if (groups.length !== state.questions.length) setMsg($('o-msg'), `${groups.length} group(s) of options for ${state.questions.length} question(s) — counts must match.`, 'warn'); setMsg($('o-msg'), ''); state.questions.forEach((q, i) => { if (groups[i]) q.options = groups[i]; }); state.answers = []; $('o-textarea').value = ''; renderQuestionList(); renderOptionsList(); renderAnswerList(); updatePanelStates(); setMsg($('o-msg'), `✓ ${groups.length} option group(s) assigned.`, 'info'); });
    $('o-clear-btn').addEventListener('click', () => { state.questions.forEach(q => q.options = []); state.answers = []; renderQuestionList(); renderOptionsList(); renderAnswerList(); setMsg($('o-msg'), ''); updatePanelStates(); });

    $('a-list').addEventListener('click', e => { const del = e.target.closest('[data-idx]'); if (!del) return; state.answers.splice(+del.dataset.idx, 1); renderAnswerList(); updatePanelStates(); });
    $('a-add-btn').addEventListener('click', () => { const raw = $('a-textarea').value.trim(); if (!raw) return; const letters = parseAnswerLetters(raw); if (!letters.length) { setMsg($('a-msg'), 'No valid answer letters found.', 'error'); return; } const expectedCount = state.questions.length; if (letters.length !== expectedCount) { setMsg($('a-msg'), `Need exactly ${expectedCount} match.`, 'error'); return; } state.answers = letters.map((letter, i) => ({ letter, resolvedText: resolveAnswerLetter(letter, i) })); $('a-textarea').value = ''; setMsg($('a-msg'), ''); renderAnswerList(); updatePanelStates(); });
    $('a-clear-btn').addEventListener('click', () => { state.answers = []; renderAnswerList(); setMsg($('a-msg'), ''); updatePanelStates(); });

    async function handleFileUpload(file, type) {
      const msgEl = type === 'q' ? $('q-msg') : $('o-msg'); setMsg(msgEl, ''); showLoading(true);
      try {
        let text = ''; const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'docx') text = await extractTextFromDocx(file); else if (ext === 'pdf') text = await extractTextFromPdf(file); else { setMsg(msgEl, 'Unsupported file.', 'error'); showLoading(false); return; }
        if (type === 'q') {
          const parsed = extractQuestionsWithOptions(text); if (!parsed.length) { setMsg($('q-msg'), 'No questions found.', 'error'); showLoading(false); return; }
          const withOptsArr = parsed.filter(q => q.options.length >= 2);
          const removed = parsed.length - withOptsArr.length;
          withOptsArr.forEach(q => state.questions.push(q)); state.answers = []; renderQuestionList(); renderOptionsList(); renderAnswerList();
          const msg = `✓ Extracted ${withOptsArr.length} tomes with options.` + (removed > 0 ? ` (${removed} question(s) with no options removed)` : '');
          setMsg($('q-msg'), msg, 'info'); updatePanelStates();
        }
      } catch (err) { setMsg($('q-msg'), 'Error: ' + (err.message || err), 'error'); }
      showLoading(false);
    }
    function setupDropzone(dzId, fileId, type) {
      const dz = $(dzId), fi = $(fileId);
      fi.addEventListener('change', e => { if (e.target.files[0]) handleFileUpload(e.target.files[0], type); e.target.value = ''; });
      dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
      dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
      dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0], type); });
    }
    setupDropzone('q-dropzone', 'q-file', 'q');

    $('start-btn').addEventListener('click', () => {
      const validPairs = state.questions.filter((q, i) => q.options.length >= 2 && state.answers[i]).length;
      if (validPairs < 2) { $('start-btn').classList.add('shake'); setTimeout(() => $('start-btn').classList.remove('shake'), 500); setMsg($('start-msg'), 'Need at least 2 questions.', 'error'); return; }
      setMsg($('start-msg'), ''); initGame();
    });

    function initGame() {
      let pairs = []; state.questions.forEach((q, i) => { const ans = state.answers[i]; if (q.options.length >= 2 && ans) { pairs.push({ question: q.displayText, options: [...q.options], answer: ans.resolvedText }); } });
      for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
      state.gameData = pairs; state.currentIdx = 0; state.score = 0; state.results = []; state.gameActive = true; state.clickLocked = false; state.activeRocks = 0;
      showScreen('game'); setTimeout(() => { layoutSVG(); drawWizard(); measureQuestionCard(); loadQuestion(); }, 120);
    }

    function measureQuestionCard() { const card = document.querySelector('.question-card'); if (card) { const rect = card.getBoundingClientRect(); state.questionCardBottom = rect.bottom + 30; } }

    function layoutSVG() {
      const svg = $('game-svg'); const rect = svg.getBoundingClientRect(); state.svgW = rect.width; state.svgH = rect.height;
      state.wizX = 140; state.wizY = state.svgH - 100;
      const gl = $('ground-line'); gl.setAttribute('x1', '0'); gl.setAttribute('y1', state.svgH - 80); gl.setAttribute('x2', state.svgW); gl.setAttribute('y2', state.svgH - 80);
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

      const shoulderX = x + 30, shoulderY = bh - 100; state.wizShoulderX = shoulderX; state.wizShoulderY = shoulderY;
      updateWandArm(shoulderX, shoulderY, 0);
    }

    function updateWandArm(sx, sy, angle) {
      const armEndX = sx + Math.cos(angle) * 35, armEndY = sy + Math.sin(angle) * 35;
      const wandEndX = armEndX + Math.cos(angle) * 40, wandEndY = armEndY + Math.sin(angle) * 40;
      $('wiz-arm').setAttribute('x1', sx); $('wiz-arm').setAttribute('y1', sy); $('wiz-arm').setAttribute('x2', armEndX); $('wiz-arm').setAttribute('y2', armEndY);
      $('wand-shaft').setAttribute('x1', armEndX); $('wand-shaft').setAttribute('y1', armEndY); $('wand-shaft').setAttribute('x2', wandEndX); $('wand-shaft').setAttribute('y2', wandEndY);
      $('wand-tip').setAttribute('cx', wandEndX); $('wand-tip').setAttribute('cy', wandEndY);
      $('wand-tip-inner').setAttribute('cx', wandEndX); $('wand-tip-inner').setAttribute('cy', wandEndY);
      state.wandTipX = wandEndX; state.wandTipY = wandEndY;
    }

    function aimWandAt(tx, ty) { const angle = Math.atan2(ty - state.wizShoulderY, tx - state.wizShoulderX); updateWandArm(state.wizShoulderX, state.wizShoulderY, angle); }

    function loadQuestion() {
      if (state.currentIdx >= state.gameData.length) { endGame(); return; }
      clearLayer('rocks-layer'); clearLayer('effects-layer'); stopAllRockAnimations(); state.activeRocks = 0; state.clickLocked = false;
      const data = state.gameData[state.currentIdx];
      $('question-text').textContent = data.question; $('hud-q-num').textContent = state.currentIdx + 1; $('hud-q-total').textContent = state.gameData.length; updateScoreDisplay();
      requestAnimationFrame(() => { measureQuestionCard(); spawnRocks(data.options, data.answer); });
    }

    /* Plaque path generating instead of very round rocks */
    function makeRockPath(cx, cy, rw, rh, sides, seed) {
      const pts = [];
      // Make it more rectangular/plaque-like
      pts.push([cx - rw, cy - rh]);
      pts.push([cx + rw, cy - rh]);
      pts.push([cx + rw + 10, cy]); // small jut
      pts.push([cx + rw, cy + rh]);
      pts.push([cx - rw, cy + rh]);
      pts.push([cx - rw - 10, cy]);
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
    }

    function wrapText(text, maxChars) {
      if (text.length <= maxChars) return [text];
      const words = text.split(' '), lines = []; let cur = '';
      words.forEach(w => { if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur.trim()); cur = w; } else cur = (cur + ' ' + w).trim(); });
      if (cur) lines.push(cur.trim()); return lines;
    }

    function spawnRocks(options, correctAnswer) {
      const layer = $('rocks-layer'); const n = options.length; const svgH = state.svgH, svgW = state.svgW;
      const startX = Math.max(350, svgW * 0.25);
      const endX = svgW - 100;
      const stepX = n > 1 ? (endX - startX) / (n - 1) : 0;
      
      const rockRW = Math.min(90, Math.max(70, 85 - n * 2)); const rockRH = Math.min(40, Math.max(30, 45 - n * 1)); const maxCharsPerLine = Math.floor(rockRW / 6);
      const shuffled = [...options].sort(() => Math.random() - 0.5); state.activeRocks = shuffled.length;

      shuffled.forEach((optionText, idx) => {
        const rockY = Math.max(state.questionCardBottom + 120, svgH * 0.75);
        const rockX = n === 1 ? (startX + endX) / 2 : startX + stepX * idx;

        const seed = (idx + 1) * 137; const isCorrect = (optionText === correctAnswer);
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'rock-group'); g.setAttribute('data-option', optionText); g.setAttribute('data-correct', isCorrect ? '1' : '0'); g.setAttribute('transform', `translate(${rockX},${rockY})`);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'rock-body'); path.setAttribute('d', makeRockPath(0, 0, rockRW, rockRH, 6, seed));
        path.setAttribute('fill', 'url(#plaque-grad)'); path.setAttribute('stroke', '#8A733E'); path.setAttribute('stroke-width', '2');

        const lines = wrapText(optionText, maxCharsPerLine); const lineH = 15; const totalH = lines.length * lineH;
        const textG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        textG.setAttribute('class', 'text-group');
        lines.forEach((line, li) => {
          const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          t.setAttribute('class', 'rock-text'); t.setAttribute('x', '0'); t.setAttribute('y', (-totalH / 2 + li * lineH + lineH / 2).toFixed(1)); t.textContent = line; textG.appendChild(t);
        });
        const chest = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        chest.setAttribute('href', '/chest.png');
        chest.setAttribute('class', 'chest-cover');
        chest.setAttribute('x', -45);
        chest.setAttribute('y', -rockRH - 90);
        chest.setAttribute('width', 90);
        chest.setAttribute('height', 90);
        g.appendChild(path); g.appendChild(textG); g.appendChild(chest); g.addEventListener('click', onRockClick); layer.appendChild(g);
        // No animation — rocks stay fixed on screen
      });
    }

    const rockAnimations = new Map();
    function animateRock(g, startX, y, rockRW) {
      // UPDATED: Speed increased drastically from 0.6 to 2.5+ so they don't drag
      const speed = 2.5 + (Math.random() * 1.5);
      let x = startX;

      function tick() {
        x -= speed; g.setAttribute('transform', `translate(${x.toFixed(1)},${y})`);
        if (x < -rockRW - 40) {
          g.removeEventListener('click', onRockClick); g.remove(); rockAnimations.delete(g); state.activeRocks = Math.max(0, state.activeRocks - 1);
          if (state.activeRocks === 0 && !state.clickLocked && state.gameActive) handleAllRocksGone();
          return;
        }
        rockAnimations.set(g, requestAnimationFrame(tick));
      }
      rockAnimations.set(g, requestAnimationFrame(tick));
    }
    function stopAllRockAnimations() { rockAnimations.forEach(raf => cancelAnimationFrame(raf)); rockAnimations.clear(); }
    function stopRockAnimation(g) { const raf = rockAnimations.get(g); if (raf) { cancelAnimationFrame(raf); rockAnimations.delete(g); } }

    function handleAllRocksGone() {
      state.clickLocked = true; const data = state.gameData[state.currentIdx]; state.results.push({ question: data.question, chosen: '(no answer)', correct: data.answer, isCorrect: false });
      setWitchImage('/witch_hurt.png');
      const layer = $('effects-layer'); const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      popup.setAttribute('class', 'wrong-popup'); popup.setAttribute('x', state.svgW / 2); popup.setAttribute('y', state.svgH / 2); popup.textContent = '⏳ Encounter Failed!'; layer.appendChild(popup);
      setTimeout(() => { setWitchImage('/witch_standing.png'); clearLayer('effects-layer'); state.currentIdx++; loadQuestion(); }, 2000);
    }

    function onRockClick(e) {
      if (state.clickLocked || !state.gameActive) return; state.clickLocked = true;
      setWitchImage('/witch.png');
      const g = e.currentTarget; const isCorrect = g.getAttribute('data-correct') === '1'; const chosenOption = g.getAttribute('data-option');
      const match = g.getAttribute('transform').match(/translate\(([^,]+),([^)]+)\)/); const rockX = parseFloat(match[1]), rockY = parseFloat(match[2]);
      aimWandAt(rockX, rockY); setTimeout(() => fireLightning(rockX, rockY, isCorrect, g, chosenOption), 150);
    }

    function fireLightning(tx, ty, isCorrect, rockG, chosenOption) {
      const layer = $('effects-layer'); const sx = state.wandTipX, sy = state.wandTipY;
      const segs = 8, pts = [[sx, sy]];
      for (let i = 1; i < segs; i++) { const t = i / segs; const bx = sx + (tx - sx) * t, by = sy + (ty - sy) * t; const j = 20 * (1 - t); pts.push([bx + (Math.random() - .5) * j * 2, by + (Math.random() - .5) * j * 2]); }
      pts.push([tx, ty]); const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      const b1 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); b1.setAttribute('class', 'lightning-path'); b1.setAttribute('d', d); layer.appendChild(b1);
      const b2 = document.createElementNS('http://www.w3.org/2000/svg', 'path'); b2.setAttribute('class', 'lightning-path-2'); b2.setAttribute('d', d); layer.appendChild(b2);
      setTimeout(() => { if (b1.parentNode) layer.removeChild(b1); if (b2.parentNode) layer.removeChild(b2); isCorrect ? onCorrectHit(rockG, tx, ty, chosenOption) : onWrongHit(rockG, tx, ty, chosenOption); }, 350);
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
      const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); flash.setAttribute('cx', cx); flash.setAttribute('cy', cy); flash.setAttribute('r', '40'); flash.setAttribute('fill', 'rgba(46, 204, 113, 0.6)'); flash.setAttribute('class', 'hit-flash'); layer.appendChild(flash);
      const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text'); popup.setAttribute('class', 'score-popup'); popup.setAttribute('x', cx); popup.setAttribute('y', cy - 25); popup.textContent = 'CRITICAL HIT!'; layer.appendChild(popup);
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
            chest.setAttribute('x', '-90');
            chest.setAttribute('y', '-90');
            chest.setAttribute('width', '180');
            chest.setAttribute('height', '180');
          }
        } else {
          rg.style.display = 'none';
        }
      });

      recordResult(chosen, true); updateScoreDisplay(); setTimeout(() => { clearLayer('effects-layer'); state.currentIdx++; loadQuestion(); }, 1000);
    }

    function shatterRock(rockG, cx, cy, effectsLayer) {
      rockG.removeEventListener('click', onRockClick); rockG.remove();
      const colors = ['#2a303c', '#141820', '#8A733E', '#4facfe'];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2, a2 = a + Math.PI / 4, r = 20 + Math.random() * 15;
        const pts = [[cx + Math.cos(a) * r * .4, cy + Math.sin(a) * r * .4], [cx + Math.cos(a) * r, cy + Math.sin(a) * r], [cx + Math.cos(a2) * r * .8, cy + Math.sin(a2) * r * .8]];
        const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', pts.map(p => p.join(',')).join(' ')); poly.setAttribute('fill', colors[i % 4]); poly.setAttribute('class', 'fragment');
        poly.style.setProperty('--dx', (Math.cos(a) * 70 + (Math.random() - .5) * 50).toFixed(1) + 'px'); poly.style.setProperty('--dy', (Math.sin(a) * 70 + Math.random() * 40 - 20).toFixed(1) + 'px');
        effectsLayer.appendChild(poly);
      }
    }

    function spawnParticles(layer, cx, cy, color, count) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 60;
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', '5'); c.setAttribute('fill', color); c.setAttribute('class', 'particle'); c.style.setProperty('--px', (Math.cos(a) * d).toFixed(1) + 'px'); c.style.setProperty('--py', (Math.sin(a) * d).toFixed(1) + 'px'); layer.appendChild(c);
      }
    }

    function onWrongHit(rockG, cx, cy, chosen) {
      setWitchImage('/witch_hurt.png');
      const layer = $('effects-layer');
      const flash = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); flash.setAttribute('cx', cx); flash.setAttribute('cy', cy); flash.setAttribute('r', '40'); flash.setAttribute('fill', 'rgba(231, 76, 60, 0.6)'); flash.setAttribute('class', 'hit-flash'); layer.appendChild(flash);
      const popup = document.createElementNS('http://www.w3.org/2000/svg', 'text'); popup.setAttribute('class', 'wrong-popup'); popup.setAttribute('x', cx); popup.setAttribute('y', cy - 25); popup.textContent = '-50 HP'; layer.appendChild(popup);
      const rockPath = rockG.querySelector('path'); if (rockPath) { rockPath.classList.add('rock-shake'); setTimeout(() => rockPath.classList.remove('rock-shake'), 500); rockPath.setAttribute('stroke', '#e74c3c'); }
      rockG.style.opacity = '0.5'; rockG.style.filter = 'grayscale(1)'; rockG.removeEventListener('click', onRockClick);
      recordResult(chosen, false); updateScoreDisplay(); setTimeout(() => { setWitchImage('/witch_standing.png'); clearLayer('effects-layer'); stopRockAnimation(rockG); rockG.remove(); state.currentIdx++; loadQuestion(); }, 2000);
    }

    function clearLayer(id) { const l = $(id); while (l.firstChild) l.removeChild(l.firstChild); }
    function recordResult(chosen, isCorrect) { const data = state.gameData[state.currentIdx]; state.results.push({ question: data.question, chosen, correct: data.answer, isCorrect }); }

    function endGame() {
      state.gameActive = false; stopAllRockAnimations(); const total = state.results.length; const correct = state.results.filter(r => r.isCorrect).length; const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const pctEl = $('end-pct'); pctEl.textContent = pct + '%'; pctEl.className = 'score-pct ' + (pct >= 70 ? 'green' : pct >= 50 ? 'amber' : 'red'); $('end-raw').textContent = `${correct} / ${total} Legendary Loot Acquired`;
      const tbody = $('results-tbody'); tbody.innerHTML = '';
      state.results.forEach((r, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${escHtml(r.question)}</td><td>${escHtml(r.chosen)}</td><td>${escHtml(r.correct)}</td><td class="${r.isCorrect ? 'result-correct' : 'result-wrong'}">${r.isCorrect ? 'Critical!' : 'Failed'}</td>`;
        tbody.appendChild(tr);
      });
      showScreen('end');
    }

    $('play-again-btn').addEventListener('click', () => { clearLayer('rocks-layer'); clearLayer('effects-layer'); stopAllRockAnimations(); state.gameActive = false; showScreen('setup'); });
    window.addEventListener('resize', () => { if (state.gameActive) { layoutSVG(); drawWizard(); measureQuestionCard(); } });

    // ── Manual Options Modal ──
    function parseOptionsFromPasted(text) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const allOpts = [];
      for (const line of lines) {
        const inlineOpts = parseInlineOptions(line);
        if (inlineOpts && inlineOpts.length >= 2) { allOpts.push(...inlineOpts); }
        else { const m = line.match(/^([a-e])[\.\)]\s*(.+)/i); if (m) allOpts.push(m[1].toLowerCase() + '. ' + m[2].trim()); }
      }
      return allOpts.length >= 2 ? allOpts : null;
    }

    $('manual-opts-btn').addEventListener('click', () => {
      if (state.questions.length === 0) { setMsg($('o-msg'), 'Add questions first.', 'error'); return; }
      const select = $('manual-q-select');
      select.innerHTML = '';
      state.questions.forEach((q, i) => {
        const opt = document.createElement('option'); opt.value = i;
        opt.textContent = `Q${i + 1}: ${q.displayText.length > 60 ? q.displayText.slice(0, 60) + '…' : q.displayText}`;
        select.appendChild(opt);
      });
      $('manual-opts-textarea').value = '';
      setMsg($('manual-opts-msg'), '');
      $('manual-opts-modal').style.display = 'flex';
    });

    $('manual-opts-cancel').addEventListener('click', () => { $('manual-opts-modal').style.display = 'none'; });

    $('manual-opts-confirm').addEventListener('click', () => {
      const qIdx = parseInt($('manual-q-select').value);
      const raw = $('manual-opts-textarea').value.trim();
      if (!raw) { setMsg($('manual-opts-msg'), 'Please paste some option content.', 'error'); return; }
      const opts = parseOptionsFromPasted(raw);
      if (!opts) { setMsg($('manual-opts-msg'), 'Could not find 2+ options. Use format: A. Option A  B. Option B', 'error'); return; }
      state.questions[qIdx].options = opts;
      state.answers = [];
      renderQuestionList(); renderOptionsList(); renderAnswerList(); updatePanelStates();
      $('manual-opts-modal').style.display = 'none';
      setMsg($('o-msg'), `✓ Options updated for Q${qIdx + 1}.`, 'info');
    });

    showScreen('setup');

