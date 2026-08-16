// ==========================================================================
// 2048 DELUXE — ゲームロジック
// ==========================================================================
(function () {
  "use strict";

  const SIZE = 4;
  const MOVE_MS = 110;
  const POP_DELAY = MOVE_MS;
  const LOCK_MS = MOVE_MS + 170;
  const SAVE_KEY = "d2048_save_v1";
  const STATS_KEY = "d2048_stats_v1";

  // ------------------------------------------------------------------
  // 実績・テーマ定義
  // ------------------------------------------------------------------
  const ACHIEVEMENTS = [
    { id: "tile_8", icon: "🔹", title: "はじめの一歩", desc: "8のタイルを作る", check: s => s.bestTileEver >= 8 },
    { id: "tile_16", icon: "🔸", title: "順調な滑り出し", desc: "16のタイルを作る", check: s => s.bestTileEver >= 16 },
    { id: "tile_32", icon: "🟠", title: "加速中", desc: "32のタイルを作る", check: s => s.bestTileEver >= 32 },
    { id: "tile_64", icon: "🟧", title: "本気モード", desc: "64のタイルを作る", check: s => s.bestTileEver >= 64 },
    { id: "tile_128", icon: "🟡", title: "黄金の兆し", desc: "128のタイルを作る", check: s => s.bestTileEver >= 128 },
    { id: "tile_256", icon: "✨", title: "輝きだす", desc: "256のタイルを作る", check: s => s.bestTileEver >= 256 },
    { id: "tile_512", icon: "💠", title: "マスターへの道", desc: "512のタイルを作る", check: s => s.bestTileEver >= 512 },
    { id: "tile_1024", icon: "🔷", title: "あと一歩", desc: "1024のタイルを作る", check: s => s.bestTileEver >= 1024 },
    { id: "tile_2048", icon: "🏆", title: "2048達成", desc: "伝説の2048タイルを作る", check: s => s.bestTileEver >= 2048 },
    { id: "tile_4096", icon: "👑", title: "限界突破", desc: "4096のタイルを作る", check: s => s.bestTileEver >= 4096 },
    { id: "tile_8192", icon: "🌟", title: "伝説を超えて", desc: "8192のタイルを作る", check: s => s.bestTileEver >= 8192 },
    { id: "games_1", icon: "🎮", title: "はじめまして", desc: "1回プレイする", check: s => s.gamesPlayed >= 1 },
    { id: "games_10", icon: "🕹️", title: "常連さん", desc: "10回プレイする", check: s => s.gamesPlayed >= 10 },
    { id: "games_50", icon: "🎯", title: "ベテラン", desc: "50回プレイする", check: s => s.gamesPlayed >= 50 },
    { id: "games_100", icon: "💯", title: "100回の軌跡", desc: "100回プレイする", check: s => s.gamesPlayed >= 100 },
    { id: "score_5000", icon: "📈", title: "スコアハンター", desc: "1ゲームで5,000点獲得", check: s => s.bestScoreEver >= 5000 },
    { id: "score_20000", icon: "🚀", title: "スコアマニア", desc: "1ゲームで20,000点獲得", check: s => s.bestScoreEver >= 20000 },
    { id: "score_50000", icon: "💥", title: "スコアの化身", desc: "1ゲームで50,000点獲得", check: s => s.bestScoreEver >= 50000 },
    { id: "combo_5", icon: "🔥", title: "コンボスターター", desc: "5連続コンボを決める", check: s => s.maxCombo >= 5 },
    { id: "combo_8", icon: "⚡", title: "コンボマスター", desc: "8連続コンボを決める", check: s => s.maxCombo >= 8 },
    { id: "undo_free", icon: "🧠", title: "ノーミス撤退", desc: "Undoを使わずに2048に到達", check: (s, g) => !!(g && g.wonThisGame && !g.usedUndoThisGame) },
    { id: "streak_3", icon: "📆", title: "三日坊主卒業", desc: "3日連続でプレイ", check: s => s.streakDays >= 3 },
    { id: "streak_7", icon: "🗓️", title: "週間チャレンジャー", desc: "7日連続でプレイ", check: s => s.streakDays >= 7 },
    { id: "daily_1", icon: "☀️", title: "デイリー初挑戦", desc: "デイリーチャレンジに挑む", check: s => (s.dailyPlayed || 0) >= 1 },
    { id: "level_5", icon: "⭐", title: "レベル5到達", desc: "プレイヤーレベル5に到達", check: s => s.level >= 5 },
    { id: "level_10", icon: "🌠", title: "レベル10到達", desc: "プレイヤーレベル10に到達", check: s => s.level >= 10 },
    { id: "all_themes", icon: "🎨", title: "コレクター", desc: "すべてのテーマを解放", check: s => s.unlockedThemes.length >= THEMES.length },
  ];

  const THEMES = [
    { id: "classic", name: "クラシック", desc: "最初から使える定番カラー", colors: ["#f2a33c", "#f472b6"], unlock: () => true },
    { id: "neon", name: "ネオン", desc: "512のタイルに到達で解放", colors: ["#00ffd5", "#ff2fd0"], unlock: s => s.bestTileEver >= 512 },
    { id: "pastel", name: "パステルドリーム", desc: "10回プレイで解放", colors: ["#ff8fab", "#8fd3ff"], unlock: s => s.gamesPlayed >= 10 },
    { id: "midnight", name: "ミッドナイト", desc: "1024のタイルに到達で解放", colors: ["#6e6eff", "#9d6eff"], unlock: s => s.bestTileEver >= 1024 },
    { id: "sakura", name: "サクラ", desc: "3日連続プレイで解放", colors: ["#ff9ec4", "#ffe08a"], unlock: s => s.streakDays >= 3 },
    { id: "retro", name: "レトロアーケード", desc: "1ゲームで20,000点獲得で解放", colors: ["#ffb43c", "#ff5c3c"], unlock: s => s.bestScoreEver >= 20000 },
  ];

  // 更新履歴 — 変更のたびに先頭へ追記し、CURRENT_VERSION も更新する
  const CHANGELOG = [
    {
      version: "1.0.0",
      date: "2026-08-17",
      notes: [
        "2048 DELUXE 初回リリース",
        "実績27種・レベル/XP・コンボボーナス・デイリーチャレンジ・Undo(3回)・6種のテーマを実装",
        "スマホのスワイプ操作とレスポンシブレイアウトに対応",
      ],
    },
  ];
  const CURRENT_VERSION = CHANGELOG[0].version;
  const CURRENT_VERSION_DATE = CHANGELOG[0].date;

  const LEVEL_TITLES = [
    [1, "パズル見習い"], [3, "スライドの探求者"], [5, "コンボの達人"],
    [7, "戦略家"], [10, "2048マスター"], [15, "伝説の指先"], [20, "次元を超えた者"],
  ];
  function levelTitleFor(level) {
    let t = LEVEL_TITLES[0][1];
    for (const [lv, name] of LEVEL_TITLES) if (level >= lv) t = name;
    return t;
  }
  function xpToNext(level) { return 100 + (level - 1) * 60; }
  function levelInfo(xp) {
    let level = 1, remaining = xp;
    while (remaining >= xpToNext(level)) { remaining -= xpToNext(level); level++; }
    return { level, curXp: remaining, maxXp: xpToNext(level) };
  }

  // ------------------------------------------------------------------
  // 状態
  // ------------------------------------------------------------------
  let grid = null;
  let nextTileId = 1;
  let score = 0, combo = 0;
  let undoLeft = 3, undoStack = [];
  let usedUndoThisGame = false, wonThisGame = false, wonShown = false;
  let isDailyMode = false, dailyDateStr = null;
  let gameStartTime = Date.now(), moves = 0;
  let locked = false;
  let stats = null;
  let rng = Math.random;
  const tileEls = new Map();
  let metrics = { cell: 0, gap: 0 };
  let audioCtx = null;

  // ------------------------------------------------------------------
  // ユーティリティ
  // ------------------------------------------------------------------
  function pad2(n) { return String(n).padStart(2, "0"); }
  function todayStr() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function hashStr(str) { let h = 0; for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; } return h; }
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function makeEmptyGrid() { return Array.from({ length: SIZE }, () => Array(SIZE).fill(null)); }

  // ------------------------------------------------------------------
  // 永続化
  // ------------------------------------------------------------------
  function defaultStats() {
    return {
      gamesPlayed: 0, totalScore: 0, bestScoreEver: 0, bestTileEver: 0,
      totalMoves: 0, totalMerges: 0, totalPlayTimeMs: 0, maxCombo: 0,
      xp: 0, level: 1, lastPlayedDate: null, streakDays: 0,
      dailyBestScore: {}, dailyPlayed: 0, lastDailyDate: null,
      unlockedThemes: ["classic"], currentTheme: "classic", soundOn: true,
      achievements: {}, recentAchievements: [],
    };
  }
  function loadStats() {
    try { const raw = localStorage.getItem(STATS_KEY); if (raw) return Object.assign(defaultStats(), JSON.parse(raw)); } catch (e) {}
    return defaultStats();
  }
  function saveStats() { try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {} }
  function serializeGrid() { return grid.map(row => row.map(t => (t ? t.value : null))); }
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        grid: serializeGrid(), score, combo, undoLeft, usedUndoThisGame,
        wonThisGame, wonShown, isDailyMode, dailyDateStr, gameStartTime, moves,
      }));
    } catch (e) {}
  }
  function loadSave() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch (e) {} return null; }

  // ------------------------------------------------------------------
  // ゲームロジック(コア)
  // ------------------------------------------------------------------
  const VECTORS = { up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 }, left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 } };

  function withinBounds(cell) { return cell.r >= 0 && cell.r < SIZE && cell.c >= 0 && cell.c < SIZE; }
  function cellEmpty(cell) { return grid[cell.r][cell.c] === null; }
  function buildTraversals(vector) {
    const rows = [0, 1, 2, 3], cols = [0, 1, 2, 3];
    if (vector.dr === 1) rows.reverse();
    if (vector.dc === 1) cols.reverse();
    return { rows, cols };
  }
  function findFarthest(cell, vector) {
    let prev = cell, next = { r: cell.r + vector.dr, c: cell.c + vector.dc };
    while (withinBounds(next) && cellEmpty(next)) { prev = next; next = { r: prev.r + vector.dr, c: prev.c + vector.dc }; }
    return { farthest: prev, next };
  }
  function maxTileInGrid() { let m = 0; for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) m = Math.max(m, grid[r][c].value); return m; }
  function hasMovesLeft() {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) return true;
      const v = grid[r][c].value;
      if (c + 1 < SIZE && grid[r][c + 1] && grid[r][c + 1].value === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c] && grid[r + 1][c].value === v) return true;
    }
    return false;
  }
  function addRandomTile() {
    const empties = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) empties.push({ r, c });
    if (!empties.length) return null;
    const cell = empties[Math.floor(rng() * empties.length)];
    const value = rng() < 0.9 ? 2 : 4;
    const tile = { id: nextTileId++, value, r: cell.r, c: cell.c };
    grid[cell.r][cell.c] = tile;
    return tile;
  }

  function attemptMove(dir) {
    const vector = VECTORS[dir];
    const { rows, cols } = buildTraversals(vector);
    let moved = false, scoreGained = 0, mergeCount = 0, maxMergeValue = 0;
    const movements = [];
    for (const r of rows) {
      for (const c of cols) {
        const tile = grid[r][c];
        if (!tile) continue;
        const { farthest, next } = findFarthest({ r, c }, vector);
        const nextTile = withinBounds(next) ? grid[next.r][next.c] : null;
        if (nextTile && !nextTile.justMerged && nextTile.value === tile.value) {
          grid[r][c] = null;
          const mergedValue = tile.value * 2;
          movements.push({ id: tile.id, toR: next.r, toC: next.c, kind: "mergeMove" });
          movements.push({ id: nextTile.id, toR: next.r, toC: next.c, kind: "mergeStay" });
          const mergedId = nextTileId++;
          grid[next.r][next.c] = { id: mergedId, value: mergedValue, r: next.r, c: next.c, justMerged: true };
          movements.push({ id: mergedId, value: mergedValue, toR: next.r, toC: next.c, kind: "mergeResult" });
          scoreGained += mergedValue;
          mergeCount++;
          maxMergeValue = Math.max(maxMergeValue, mergedValue);
          moved = true;
        } else {
          grid[r][c] = null;
          tile.r = farthest.r; tile.c = farthest.c;
          grid[farthest.r][farthest.c] = tile;
          if (farthest.r !== r || farthest.c !== c) {
            moved = true;
            movements.push({ id: tile.id, toR: farthest.r, toC: farthest.c, kind: "move" });
          }
        }
      }
    }
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) grid[r][c].justMerged = false;
    return { moved, scoreGained, mergeCount, maxMergeValue, movements };
  }

  // ------------------------------------------------------------------
  // 描画
  // ------------------------------------------------------------------
  function computeMetrics() {
    const boardEl = document.getElementById("board");
    const w = boardEl.clientWidth;
    const gap = Math.max(6, Math.round(w * 0.028));
    const cell = (w - gap * (SIZE + 1)) / SIZE;
    metrics = { cell, gap };
  }
  function cellX(c) { return metrics.gap + c * (metrics.cell + metrics.gap); }
  function cellY(r) { return metrics.gap + r * (metrics.cell + metrics.gap); }

  function renderGridBg() {
    const gridBg = document.getElementById("gridBg");
    gridBg.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const d = document.createElement("div");
      d.className = "grid-cell";
      d.style.width = metrics.cell + "px";
      d.style.height = metrics.cell + "px";
      d.style.transform = `translate(${cellX(c)}px, ${cellY(r)}px)`;
      frag.appendChild(d);
    }
    gridBg.appendChild(frag);
  }

  function fontSizeFor(cellPx, value) {
    const len = String(value).length;
    let ratio = 0.46;
    if (len === 2) ratio = 0.4; else if (len === 3) ratio = 0.33; else if (len >= 4) ratio = 0.26;
    return Math.round(cellPx * ratio);
  }
  function tileClass(value) {
    const known = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
    const v = known.includes(value) ? value : value > 8192 ? 8192 : 2;
    return "tile-" + v;
  }
  function styleTile(el, r, c, value) {
    el.style.width = metrics.cell + "px";
    el.style.height = metrics.cell + "px";
    el.style.transform = `translate(${cellX(c)}px, ${cellY(r)}px)`;
    el.style.fontSize = fontSizeFor(metrics.cell, value) + "px";
    el.dataset.r = r; el.dataset.c = c; el.dataset.value = value;
  }
  function createTileEl(id, value, r, c) {
    const el = document.createElement("div");
    el.className = "tile " + tileClass(value);
    el.textContent = value;
    el.dataset.id = id;
    styleTile(el, r, c, value);
    return el;
  }
  function fullRerender() {
    const tilesContainer = document.getElementById("tiles");
    tilesContainer.innerHTML = "";
    tileEls.clear();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const t = grid[r][c];
      if (t) { const el = createTileEl(t.id, t.value, r, c); tilesContainer.appendChild(el); tileEls.set(t.id, el); }
    }
  }
  function renderMovements(movements) {
    const tilesContainer = document.getElementById("tiles");
    const toRemove = [];
    for (const m of movements) {
      if (m.kind === "move" || m.kind === "mergeMove") {
        const el = tileEls.get(m.id);
        if (el) { el.style.transform = `translate(${cellX(m.toC)}px, ${cellY(m.toR)}px)`; el.dataset.r = m.toR; el.dataset.c = m.toC; }
        if (m.kind === "mergeMove") toRemove.push(m.id);
      } else if (m.kind === "mergeStay") {
        toRemove.push(m.id);
      } else if (m.kind === "mergeResult") {
        const el = createTileEl(m.id, m.value, m.toR, m.toC);
        el.style.opacity = "0";
        tilesContainer.appendChild(el);
        tileEls.set(m.id, el);
        setTimeout(() => { el.style.opacity = "1"; el.classList.add("merged"); }, POP_DELAY);
      } else if (m.kind === "new") {
        setTimeout(() => {
          const el = createTileEl(m.id, m.value, m.toR, m.toC);
          el.classList.add("new");
          tilesContainer.appendChild(el);
          tileEls.set(m.id, el);
        }, POP_DELAY);
      }
    }
    if (toRemove.length) {
      setTimeout(() => { for (const id of toRemove) { const el = tileEls.get(id); if (el) { el.remove(); tileEls.delete(id); } } }, MOVE_MS);
    }
  }

  // ------------------------------------------------------------------
  // サウンド
  // ------------------------------------------------------------------
  function getAudioCtx() {
    if (!audioCtx) { const Ctx = window.AudioContext || window.webkitAudioContext; if (Ctx) audioCtx = new Ctx(); }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function beep(freq, duration, delay = 0, type = "sine", vol = 0.12) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + duration + 0.02);
  }
  function playSound(type, value) {
    if (!stats || !stats.soundOn) return;
    switch (type) {
      case "move": beep(180, 0.05, 0, "sine", 0.05); break;
      case "merge": beep(300 + Math.log2(value || 2) * 35, 0.12, 0, "triangle", 0.12); break;
      case "achievement": beep(660, 0.09, 0, "square", 0.09); beep(880, 0.09, 0.09, "square", 0.09); beep(1320, 0.15, 0.18, "square", 0.11); break;
      case "levelup": beep(440, 0.1, 0, "sawtooth", 0.07); beep(660, 0.1, 0.1, "sawtooth", 0.07); beep(880, 0.18, 0.2, "sawtooth", 0.09); break;
      case "gameover": beep(300, 0.25, 0, "sine", 0.11); beep(200, 0.3, 0.15, "sine", 0.09); break;
      case "win": beep(523, 0.12, 0, "triangle", 0.12); beep(659, 0.12, 0.1, "triangle", 0.12); beep(784, 0.12, 0.2, "triangle", 0.12); beep(1047, 0.3, 0.3, "triangle", 0.14); break;
    }
  }

  // ------------------------------------------------------------------
  // 紙吹雪
  // ------------------------------------------------------------------
  let confettiCanvas, cctx, particles = [], confettiRAF = null;
  function initConfettiCanvas() {
    confettiCanvas = document.getElementById("confetti");
    resizeConfettiCanvas();
    window.addEventListener("resize", resizeConfettiCanvas);
  }
  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
    cctx = confettiCanvas.getContext("2d");
  }
  function confettiBurst(count) {
    const colors = ["#f2a33c", "#f472b6", "#7c5cf2", "#4ade80", "#6ee7f2", "#f0ba1f"];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
        y: window.innerHeight * 0.25,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -6 - 2,
        g: 0.25 + Math.random() * 0.12,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        life: 90 + Math.random() * 40,
      });
    }
    if (!confettiRAF) confettiLoop();
  }
  function confettiLoop() {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vr; p.life--; });
    particles = particles.filter(p => p.life > 0 && p.y < confettiCanvas.height + 40);
    for (const p of particles) {
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.color; cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      cctx.restore();
    }
    confettiRAF = particles.length > 0 ? requestAnimationFrame(confettiLoop) : null;
  }

  // ------------------------------------------------------------------
  // トースト
  // ------------------------------------------------------------------
  function showToast({ icon, title, desc }) {
    const stack = document.getElementById("toastStack");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<div class="ic">${icon}</div><div class="body"><b>${escapeHtml(title)}</b><span>${escapeHtml(desc)}</span></div>`;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3600);
  }

  // ------------------------------------------------------------------
  // 実績・テーマ判定
  // ------------------------------------------------------------------
  function checkThemeUnlocks() {
    let changed = false;
    for (const t of THEMES) {
      if (!stats.unlockedThemes.includes(t.id) && t.unlock(stats)) {
        stats.unlockedThemes.push(t.id);
        showToast({ icon: "🎨", title: "テーマ解放！", desc: t.name });
        playSound("achievement");
        changed = true;
      }
    }
    if (changed) saveStats();
  }
  function checkAchievements() {
    const ctx = { wonThisGame, usedUndoThisGame };
    let changed = true, unlockedAny = false, guard = 0;
    while (changed && guard < 5) {
      changed = false; guard++;
      for (const a of ACHIEVEMENTS) {
        if (stats.achievements[a.id]) continue;
        let ok = false;
        try { ok = a.check(stats, ctx); } catch (e) { ok = false; }
        if (ok) {
          stats.achievements[a.id] = Date.now();
          stats.recentAchievements = stats.recentAchievements || [];
          stats.recentAchievements.unshift(a.id);
          stats.recentAchievements = stats.recentAchievements.slice(0, 5);
          stats.xp += 50;
          showToast({ icon: a.icon, title: "実績解除！", desc: a.title });
          playSound("achievement");
          if (["tile_2048", "tile_4096", "tile_8192", "games_100", "level_10", "all_themes"].includes(a.id)) confettiBurst(120);
          changed = true; unlockedAny = true;
        }
      }
    }
    const info = levelInfo(stats.xp);
    if (info.level > (stats.level || 1)) {
      showToast({ icon: "⭐", title: `レベルアップ！ Lv.${info.level}`, desc: levelTitleFor(info.level) });
      confettiBurst(60); playSound("levelup");
    }
    stats.level = info.level;
    if (unlockedAny) saveStats();
    updateHUD();
  }
  function checkProgress() { checkThemeUnlocks(); checkAchievements(); }

  // ------------------------------------------------------------------
  // HUD更新
  // ------------------------------------------------------------------
  function updateHUD() {
    document.getElementById("score").textContent = score.toLocaleString();
    document.getElementById("best").textContent = stats.bestScoreEver.toLocaleString();
    document.getElementById("comboValue").textContent = "×" + Math.max(1, combo);
    document.getElementById("comboFill").style.width = Math.min(100, combo * 15) + "%";
    document.getElementById("undoCount").textContent = undoLeft;
    document.getElementById("undoBtn").disabled = undoLeft <= 0;
    const today = todayStr();
    document.getElementById("dailyBest").textContent = stats.dailyBestScore[today] ? stats.dailyBestScore[today].toLocaleString() : "-";
    const info = levelInfo(stats.xp);
    document.getElementById("levelBadge").textContent = "Lv." + info.level;
    document.getElementById("levelTitle").textContent = levelTitleFor(info.level);
    document.getElementById("xpFill").style.width = Math.round((info.curXp / info.maxXp) * 100) + "%";
    document.getElementById("xpCur").textContent = info.curXp;
    document.getElementById("xpMax").textContent = info.maxXp;
    document.getElementById("statGames").textContent = stats.gamesPlayed;
    document.getElementById("statMaxTile").textContent = stats.bestTileEver || "-";
    document.getElementById("statAch").textContent = Object.keys(stats.achievements).length + " / " + ACHIEVEMENTS.length;
    document.getElementById("statStreak").textContent = stats.streakDays;
    const recentEl = document.getElementById("recentAch");
    const recent = (stats.recentAchievements || []).map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
    recentEl.innerHTML = recent.length
      ? recent.map(a => `<div class="recentAch-item"><span class="ic">${a.icon}</span><span>${escapeHtml(a.title)}</span></div>`).join("")
      : '<div class="empty-note">まだありません。プレイして解除しよう！</div>';
  }
  function showScoreDelta(n) {
    const el = document.getElementById("scoreDelta");
    el.textContent = "+" + n.toLocaleString();
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  }

  // ------------------------------------------------------------------
  // パネル
  // ------------------------------------------------------------------
  function isPanelOpen() { return !document.getElementById("panelBackdrop").classList.contains("hidden"); }
  function openPanel(name) {
    closeAllPanels();
    document.getElementById("panelBackdrop").classList.remove("hidden");
    const p = document.getElementById("panel-" + name);
    if (p) p.classList.remove("hidden");
    if (name === "stats") renderStatsPanel();
    if (name === "achievements") renderAchievementsPanel();
    if (name === "themes") renderThemesPanel();
    if (name === "changelog") renderChangelogPanel();
  }
  function renderChangelogPanel() {
    document.getElementById("changelogBody").innerHTML = CHANGELOG.map(v => `
      <div class="changelog-item">
        <div class="changelog-head"><span class="changelog-ver">v${v.version}</span><span class="changelog-date">${v.date}</span></div>
        <ul class="changelog-notes">${v.notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
      </div>`).join("");
  }
  function closeAllPanels() {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
    document.getElementById("panelBackdrop").classList.add("hidden");
  }
  function renderStatsPanel() {
    const info = levelInfo(stats.xp);
    const avg = stats.gamesPlayed ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
    const hours = Math.floor(stats.totalPlayTimeMs / 3600000);
    const mins = Math.floor((stats.totalPlayTimeMs % 3600000) / 60000);
    const today = todayStr();
    const dToday = stats.dailyBestScore[today] || 0;
    const rows = [
      ["プレイ回数", stats.gamesPlayed],
      ["自己ベストスコア", stats.bestScoreEver.toLocaleString()],
      ["最大タイル", stats.bestTileEver || "-"],
      ["平均スコア", avg.toLocaleString()],
      ["総手数", stats.totalMoves.toLocaleString()],
      ["総マージ回数", stats.totalMerges.toLocaleString()],
      ["最大コンボ", "×" + stats.maxCombo],
      ["総プレイ時間", `${hours}時間${mins}分`],
      ["連続プレイ日数", stats.streakDays + "日"],
      ["本日のデイリーベスト", dToday ? dToday.toLocaleString() : "未挑戦"],
      ["プレイヤーレベル", "Lv." + info.level],
      ["実績解除数", Object.keys(stats.achievements).length + " / " + ACHIEVEMENTS.length],
      ["解放テーマ数", stats.unlockedThemes.length + " / " + THEMES.length],
    ];
    document.getElementById("statsBody").innerHTML = rows.map(([k, v]) => `<div class="stat-card-row"><span>${k}</span><b>${v}</b></div>`).join("");
  }
  function renderAchievementsPanel() {
    document.getElementById("achBody").innerHTML = ACHIEVEMENTS.map(a => {
      const unlocked = !!stats.achievements[a.id];
      return `<div class="ach-item ${unlocked ? "unlocked" : ""}"><div class="ic">${a.icon}</div><div class="info"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.desc)}</span>${unlocked ? "<em>解除済み</em>" : ""}</div></div>`;
    }).join("");
  }
  function renderThemesPanel() {
    document.getElementById("themeBody").innerHTML = THEMES.map(t => {
      const unlocked = stats.unlockedThemes.includes(t.id);
      const active = stats.currentTheme === t.id;
      const gradient = `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`;
      return `<div class="theme-item ${unlocked ? "" : "locked"} ${active ? "active" : ""}" data-theme-id="${t.id}">
        <div class="theme-swatch" style="background:${gradient}"></div>
        <div class="info"><b>${escapeHtml(t.name)}</b><span>${unlocked ? (active ? "使用中" : "タップして適用") : escapeHtml(t.desc)}</span></div>
      </div>`;
    }).join("");
    document.querySelectorAll("#themeBody .theme-item").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.themeId;
        if (!stats.unlockedThemes.includes(id)) return;
        stats.currentTheme = id; applyTheme(id); saveStats(); renderThemesPanel();
      });
    });
  }
  function applyTheme(id) { document.documentElement.setAttribute("data-theme", id); }

  // ------------------------------------------------------------------
  // オーバーレイ
  // ------------------------------------------------------------------
  function showOverlayBase(emoji, title, desc, showContinue) {
    document.getElementById("overlayEmoji").textContent = emoji;
    document.getElementById("overlayTitle").textContent = title;
    document.getElementById("overlayDesc").textContent = desc;
    document.getElementById("overlayContinue").style.display = showContinue ? "inline-block" : "none";
    document.getElementById("overlay").classList.remove("hidden");
  }
  function showWinOverlay() {
    playSound("win"); confettiBurst(150);
    showOverlayBase("🎉", "2048達成！おめでとう！", `スコア: ${score.toLocaleString()} — このまま続けてハイスコアを狙おう`, true);
  }
  function showGameOverOverlay() {
    playSound("gameover");
    showOverlayBase("💀", "ゲームオーバー", `最終スコア: ${score.toLocaleString()}（ベスト: ${stats.bestScoreEver.toLocaleString()}）`, false);
  }
  function hideOverlay() { document.getElementById("overlay").classList.add("hidden"); }
  function overlayVisible() { return !document.getElementById("overlay").classList.contains("hidden"); }

  // ------------------------------------------------------------------
  // ゲームフロー
  // ------------------------------------------------------------------
  function setModeLabels() {
    document.getElementById("modeTitle").textContent = isDailyMode ? "デイリーチャレンジ" : "クラシック 4×4";
    document.getElementById("modeSub").textContent = isDailyMode
      ? `${dailyDateStr} 限定シード・ベストスコアを狙おう`
      : "矢印キー / スワイプ でタイルを動かそう";
  }
  function updateStreakAndDaily(daily) {
    const today = todayStr();
    if (stats.lastPlayedDate !== today) {
      stats.streakDays = stats.lastPlayedDate === yesterdayStr() ? stats.streakDays + 1 : 1;
      stats.lastPlayedDate = today;
    }
    if (daily && stats.lastDailyDate !== today) {
      stats.dailyPlayed = (stats.dailyPlayed || 0) + 1;
      stats.lastDailyDate = today;
    }
  }
  function startNewGame(daily) {
    isDailyMode = !!daily;
    if (isDailyMode) { dailyDateStr = todayStr(); rng = mulberry32(hashStr(dailyDateStr)); }
    else { dailyDateStr = null; rng = Math.random; }
    grid = makeEmptyGrid(); nextTileId = 1;
    addRandomTile(); addRandomTile();
    score = 0; combo = 0; undoLeft = 3; undoStack = [];
    usedUndoThisGame = false; wonThisGame = false; wonShown = false;
    gameStartTime = Date.now(); moves = 0;
    hideOverlay();
    updateStreakAndDaily(isDailyMode);
    setModeLabels();
    fullRerender();
    saveGame(); saveStats();
    checkProgress();
    updateHUD();
  }
  function initGameFromSave(save) {
    isDailyMode = !!save.isDailyMode;
    dailyDateStr = save.dailyDateStr || null;
    if (isDailyMode && dailyDateStr !== todayStr()) { startNewGame(false); return; }
    rng = isDailyMode ? mulberry32(hashStr(dailyDateStr)) : Math.random;
    grid = makeEmptyGrid(); nextTileId = 1;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = save.grid && save.grid[r] ? save.grid[r][c] : null;
      if (v) grid[r][c] = { id: nextTileId++, value: v, r, c };
    }
    score = save.score || 0; combo = save.combo || 0;
    undoLeft = save.undoLeft != null ? save.undoLeft : 3;
    usedUndoThisGame = !!save.usedUndoThisGame;
    wonThisGame = !!save.wonThisGame; wonShown = !!save.wonShown;
    gameStartTime = save.gameStartTime || Date.now(); moves = save.moves || 0;
    undoStack = [];
    setModeLabels();
    fullRerender();
    if (!hasMovesLeft()) showGameOverOverlay();
  }
  function handleGameOver() {
    stats.gamesPlayed++;
    stats.totalScore += score;
    stats.totalPlayTimeMs += Date.now() - gameStartTime;
    if (isDailyMode) {
      const d = todayStr();
      const prev = stats.dailyBestScore[d] || 0;
      if (score > prev) stats.dailyBestScore[d] = score;
    }
    saveStats();
    localStorage.removeItem(SAVE_KEY);
    checkProgress();
    showGameOverOverlay();
  }

  function move(dir) {
    if (locked || isPanelOpen() || overlayVisible()) return;
    const snapshot = { grid: serializeGrid(), score, combo };
    const result = attemptMove(dir);
    if (!result.moved) return;
    if (undoStack.length >= 3) undoStack.shift();
    undoStack.push(snapshot);
    moves++;
    stats.totalMoves++;
    stats.totalMerges += result.mergeCount;
    combo = result.mergeCount > 0 ? combo + 1 : 0;
    if (combo > stats.maxCombo) stats.maxCombo = combo;
    const bonus = result.mergeCount > 0 ? Math.round(result.scoreGained * (combo - 1) * 0.1) : 0;
    const gained = result.scoreGained + bonus;
    score += gained;
    stats.bestScoreEver = Math.max(stats.bestScoreEver, score);
    const maxTile = maxTileInGrid();
    stats.bestTileEver = Math.max(stats.bestTileEver, maxTile);
    stats.xp += Math.max(1, Math.round(gained / 5));

    const newTile = addRandomTile();
    const movements = result.movements.slice();
    if (newTile) movements.push({ id: newTile.id, value: newTile.value, toR: newTile.r, toC: newTile.c, kind: "new" });

    playSound(result.mergeCount > 0 ? "merge" : "move", result.maxMergeValue);
    if (gained > 0) showScoreDelta(gained);
    document.getElementById("comboValue").classList.remove("pop"); void document.getElementById("comboValue").offsetWidth;
    if (result.mergeCount > 0) document.getElementById("comboValue").classList.add("pop");

    locked = true;
    updateHUD();
    renderMovements(movements);

    setTimeout(() => {
      locked = false;
      if (!wonThisGame && maxTile >= 2048) wonThisGame = true;
      if (wonThisGame && !wonShown) { wonShown = true; showWinOverlay(); }
      if (!hasMovesLeft()) {
        handleGameOver();
      } else {
        checkProgress();
        saveGame();
      }
    }, LOCK_MS);
  }

  function performUndo() {
    if (locked || undoLeft <= 0 || undoStack.length === 0 || overlayVisible()) return;
    const snap = undoStack.pop();
    grid = makeEmptyGrid(); nextTileId = 1;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const v = snap.grid[r][c];
      if (v) grid[r][c] = { id: nextTileId++, value: v, r, c };
    }
    score = snap.score; combo = snap.combo;
    undoLeft--; usedUndoThisGame = true;
    fullRerender();
    updateHUD();
    saveGame();
  }

  // ------------------------------------------------------------------
  // 入力
  // ------------------------------------------------------------------
  function setupEventListeners() {
    window.addEventListener("keydown", e => {
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
      const dir = map[e.key];
      if (!dir) return;
      if (isPanelOpen()) return;
      e.preventDefault();
      if (overlayVisible()) return;
      move(dir);
    });

    const boardEl = document.getElementById("board");
    let touchStartX = 0, touchStartY = 0, touchActive = false;
    boardEl.addEventListener("touchstart", e => {
      if (e.touches.length !== 1) return;
      touchActive = true; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
    }, { passive: true });
    boardEl.addEventListener("touchend", e => {
      if (!touchActive) return;
      touchActive = false;
      if (overlayVisible() || isPanelOpen()) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absX = Math.abs(dx), absY = Math.abs(dy);
      if (Math.max(absX, absY) < 24) return;
      if (absX > absY) move(dx > 0 ? "right" : "left"); else move(dy > 0 ? "down" : "up");
    }, { passive: true });

    document.querySelectorAll(".nav-btn[data-panel]").forEach(btn => btn.addEventListener("click", () => openPanel(btn.dataset.panel)));
    document.getElementById("panelBackdrop").addEventListener("click", closeAllPanels);
    document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeAllPanels));

    document.getElementById("soundToggle").addEventListener("click", () => {
      stats.soundOn = !stats.soundOn; saveStats();
      document.getElementById("soundToggle").textContent = stats.soundOn ? "🔊" : "🔇";
      if (stats.soundOn) playSound("move");
    });

    document.getElementById("undoBtn").addEventListener("click", performUndo);
    document.getElementById("newGameBtn").addEventListener("click", () => startNewGame(false));
    document.getElementById("dailyBtn").addEventListener("click", () => startNewGame(true));
    document.getElementById("overlayRetry").addEventListener("click", () => startNewGame(isDailyMode));
    document.getElementById("overlayContinue").addEventListener("click", hideOverlay);
    document.getElementById("versionTag").addEventListener("click", () => openPanel("changelog"));

    window.addEventListener("resize", () => {
      computeMetrics(); renderGridBg();
      for (const [, el] of tileEls) {
        const r = +el.dataset.r, c = +el.dataset.c, v = +el.dataset.value || 2;
        el.style.transition = "none";
        el.style.width = metrics.cell + "px"; el.style.height = metrics.cell + "px";
        el.style.transform = `translate(${cellX(c)}px, ${cellY(r)}px)`;
        el.style.fontSize = fontSizeFor(metrics.cell, v) + "px";
        void el.offsetWidth;
        el.style.transition = "";
      }
    });
  }

  // ------------------------------------------------------------------
  // 初期化
  // ------------------------------------------------------------------
  function init() {
    stats = loadStats();
    computeMetrics();
    initConfettiCanvas();
    renderGridBg();
    applyTheme(stats.currentTheme || "classic");
    document.getElementById("soundToggle").textContent = stats.soundOn !== false ? "🔊" : "🔇";
    document.getElementById("versionTag").textContent = `v${CURRENT_VERSION} ・ ${CURRENT_VERSION_DATE}`;

    const save = loadSave();
    if (save && save.grid) initGameFromSave(save); else startNewGame(false);

    setupEventListeners();
    updateHUD();
    checkProgress();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
