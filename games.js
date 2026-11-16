// Built-in games. Each game's `run` gets (ctx, io, W, H) and returns step(dt). Logical size is 640x400 (drawn at 2x for sharpness).
// To add a game: write an arcade('id', {title, hint}, (x, io, W, H, fx) => ({reset, update, draw, score, input?})) and add it to GAMES.
const rand = n => Math.floor(Math.random() * n), rr = (a, b) => a + Math.random() * (b - a), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MONO = 'ui-monospace,"SF Mono",Menlo,Consolas,monospace', SANS = 'system-ui,-apple-system,"Segoe UI",sans-serif';
const hsStore = id => ({ get() { try { return +localStorage['shelf.hs.' + id] || 0; } catch { return 0; } }, set(v) { try { localStorage['shelf.hs.' + id] = v; } catch {} } });
const T = (x, s, px, py, sz = 14, col = '#ece7dd', al = 'left', font = MONO, w = '') => { x.font = `${w} ${sz}px ${font}`; x.fillStyle = col; x.textAlign = al; x.fillText(s, px, py); };
const rrect = (x, a, b, w, h, r) => { x.beginPath(); x.roundRect ? x.roundRect(a, b, w, h, r) : x.rect(a, b, w, h); };
const fillR = (x, a, b, w, h, r, c) => { rrect(x, a, b, w, h, r); x.fillStyle = c; x.fill(); };
const dot = (x, a, b, r, c) => { x.beginPath(); x.arc(a, b, r, 0, 6.2832); x.fillStyle = c; x.fill(); };

function bg(x, W, H) {
  x.fillStyle = '#0f0e0b'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(255,255,255,.028)'; x.lineWidth = 1; x.beginPath();
  for (let i = 40; i < W; i += 40) { x.moveTo(i + .5, 0); x.lineTo(i + .5, H); } for (let j = 40; j < H; j += 40) { x.moveTo(0, j + .5); x.lineTo(W, j + .5); } x.stroke();
  const g = x.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.4)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function panel(x, W, H, io, title, sub, hint) {
  x.fillStyle = 'rgba(15,14,11,.74)'; x.fillRect(0, 0, W, H);
  T(x, title, W / 2, H / 2 - 18, 34, '#f4eee2', 'center', SANS, '700'); if (sub) T(x, sub, W / 2, H / 2 + 10, 13, '#b9b2a1', 'center');
  x.globalAlpha = .55 + .45 * Math.sin(io.time * 3); T(x, hint, W / 2, H / 2 + 46, 13, '#e8a33d', 'center'); x.globalAlpha = 1;
}
/* Shared shell: ready / play / paused / game over, particles, screen shake, high scores, fixed-step physics. */
function arcade(id, def, mk) {
  return (x, io, W, H) => {
    let st = 'ready', t = 0, paused = false, shake = 0, parts = [], texts = [], fresh = false;
    const hs = hsStore(id); let best = hs.get();
    const fx = {
      burst(px, py, c, n = 14, sp = 170) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rr(.3, 1) * sp; parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rr(.35, .7), m: .7, c, s: rr(2, 4) }); } },
      shake(v) { shake = Math.max(shake, v); },
      text(px, py, s, c = '#ece7dd') { texts.push({ x: px, y: py, s, c, l: .9 }); }
    };
    const g = mk(x, io, W, H, fx), eat = () => { io.prev[' '] = 1; io.prev.enter = 1; io.pmdown = true; };
    g.reset();
    return dt => {
      t += dt;
      if (document.hidden && st === 'play') paused = true;
      if (io.hit('p') && st === 'play') paused = !paused;
      if (st === 'ready') { g.ready && g.ready(); if (io.act()) { st = 'play'; t = 0; g.reset(); eat(); } }
      else if (st === 'over') { if (io.act() && t > .5) { st = 'play'; t = 0; g.reset(); eat(); } }
      else if (!paused) {
        g.input && g.input();
        const n = Math.ceil(dt / (1 / 120)); let r;
        for (let i = 0; i < n && !r; i++) r = g.update(dt / n);
        if (r === 'over') { st = 'over'; t = 0; const sc = g.score(); fresh = !g.noBest && sc > best; if (fresh) { best = sc; hs.set(sc); } fx.shake(9); }
      }
      if (!paused) { parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.l -= dt; }); parts = parts.filter(p => p.l > 0); texts.forEach(t => { t.y -= 30 * dt; t.l -= dt; }); texts = texts.filter(t => t.l > 0); shake = Math.max(0, shake - 40 * dt); }
      bg(x, W, H); x.save(); if (shake > 0) x.translate(rr(-shake, shake) * .5, rr(-shake, shake) * .5);
      g.draw(); parts.forEach(p => { x.globalAlpha = clamp(p.l / p.m, 0, 1); x.fillStyle = p.c; x.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }); x.globalAlpha = 1; texts.forEach(t => { x.globalAlpha = clamp(t.l / .5, 0, 1); T(x, t.s, t.x, t.y, 12, t.c, 'center', MONO, 'bold'); }); x.globalAlpha = 1; x.restore();
      T(x, g.hud ? g.hud() : 'SCORE ' + g.score(), 16, 26, 13, '#cfc8b8'); if (!g.noBest) T(x, 'BEST ' + best, W - 16, 26, 13, '#8f8979', 'right');
      if (st === 'ready') panel(x, W, H, io, def.title, g.hint ? g.hint() : def.hint, 'Press Space or click to start');
      else if (st === 'over') panel(x, W, H, io, g.endTitle ? g.endTitle() : 'Game over', g.noBest ? '' : (g.endSub ? g.endSub() + '   ' : '') + (fresh ? 'New best   ' : '') + g.score() + '   ·   Best ' + best, 'Space to play again');
      else if (paused) panel(x, W, H, io, 'Paused', '', 'Press P to resume');
    };
  };
}

/* ---- cover art: hand-built pixel posters (16px cells, dithered sky, chunky title) ---- */
const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const CP = 16, CX = 6, CY = 92;
const pr = (c, i, j, w = 1, h = 1, g = 1) => `<rect x="${CX + i * CP}" y="${CY + j * CP}" width="${w * CP - g}" height="${h * CP - g}" fill="${c}"/>`;
const bands = cols => { const h = 400 / cols.length; let o = ''; cols.forEach((c, i) => { o += `<rect y="${i * h}" width="300" height="${h + 1}" fill="${c}"/>`; if (i) { const y = i * h; for (let k = 0; k < 38; k++) o += `<rect x="${k * 8}" y="${k % 2 ? y : y - 8}" width="8" height="8" fill="${k % 2 ? cols[i - 1] : c}"/>`; } }); return o; };
const frame = (title, acc, tag, fs = 50) => { const tl = Math.min(256, title.length * fs * .72); return `<rect x="9" y="9" width="282" height="382" fill="none" stroke="#0b0a08" stroke-width="6"/><rect x="17" y="17" width="266" height="366" fill="none" stroke="${acc}" stroke-opacity=".55" stroke-width="1.5"/>` +
  `<text x="153" y="74" text-anchor="middle" font-family="Impact,'Arial Black',system-ui,sans-serif" font-weight="900" font-style="italic" font-size="${fs}" textLength="${tl}" lengthAdjust="spacingAndGlyphs" fill="#0b0a08">${title}</text>` +
  `<text x="150" y="71" text-anchor="middle" font-family="Impact,'Arial Black',system-ui,sans-serif" font-weight="900" font-style="italic" font-size="${fs}" textLength="${tl}" lengthAdjust="spacingAndGlyphs" fill="${acc}" stroke="#0b0a08" stroke-width="2.5" paint-order="stroke">${title}</text>` +
  `<rect x="9" y="352" width="282" height="39" fill="#0b0a08"/><text x="22" y="376" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="11" letter-spacing="2" fill="${acc}">${tag}</text><text x="278" y="376" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#8f8979">SHELF</text>`; };
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001' };
const digit = (d, i, j, c) => DIG[d].split('').map((b, k) => b === '1' ? pr(c, i + k % 3, j + Math.floor(k / 3)) : '').join('');
const pathCells = wp => { const o = []; for (let i = 0; i < wp.length - 1; i++) { let [a, b] = wp[i]; const [c, d] = wp[i + 1], dx = Math.sign(c - a), dy = Math.sign(d - b); while (a != c || b != d) { o.push([a, b]); a += dx; b += dy; } } o.push(wp[wp.length - 1]); return o; };

const coverSnake = () => { const R = rng(7); let o = bands(['#1d3a2a', '#22452f', '#285234', '#2e5f3a']);
  for (let k = 0; k < 70; k++) o += pr('rgba(255,255,255,.07)', Math.floor(R() * 18), Math.floor(R() * 14));
  const cells = pathCells([[2, 12], [15, 12], [15, 8], [3, 8], [3, 4], [12, 4]]), n = cells.length;
  cells.forEach((c, i) => { const t = i / (n - 1); o += pr(`hsl(${108 + t * 8} 46% ${28 + t * 28}%)`, c[0], c[1]) + pr('rgba(255,255,255,.2)', c[0], c[1], 1, .3, 1); });
  const h = cells[n - 1]; o += pr('#eaf7cc', h[0], h[1]) + pr('#14210f', h[0] + .15, h[1] + .15, .3, .35, 0) + pr('#14210f', h[0] + .15, h[1] + .6, .3, .3, 0) + pr('#e0472b', h[0] + 1, h[1] + .38, 1, .25, 0);
  o += pr('#e0472b', 14.25, 1, 1.5, 2, 0) + pr('#e0472b', 14, 1.25, 2, 1.5, 0) + pr('#ff9a80', 14.4, 1.35, .4, .4, 0) + pr('#5b8f3a', 14.85, .5, .3, .6, 0);
  return o + frame('SNAKE', '#c8f08f', '1 PLAYER · ARCADE', 56); };
const coverBreakout = () => { const R = rng(11); let o = bands(['#2a1410', '#351a13', '#3f2016']);
  for (let k = 0; k < 24; k++) o += pr('rgba(255,235,200,.35)', Math.floor(R() * 18), Math.floor(R() * 14), .3, .3, 0);
  const C = ['#e8553d', '#e8a33d', '#e6d14f', '#7fc16b', '#5aa7c4'];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) if (R() > .16) o += pr(C[j], i * 3, j + 1, 3, 1) + pr('rgba(255,255,255,.28)', i * 3, j + 1, 3, .3, 1);
  [[10, 9], [9, 8], [8, 7]].forEach(([i, j], k) => o += pr(`rgba(255,255,255,${.12 + k * .08})`, i, j, 1, 1, 4));
  o += pr('#fff6e4', 11, 10, 1, 1, 2) + pr('#f4eee2', 6, 13, 6, 1, 0) + pr('rgba(255,255,255,.5)', 6, 13, 6, .3, 0);
  return o + frame('BREAKOUT', '#ffb86b', 'ENDLESS LEVELS', 46); };
const coverPong = () => { let o = bands(['#0f2a33', '#133541', '#16404f']);
  o += digit(3, 4, 0, '#d8eef5') + digit(7, 11, 0, '#d8eef5');
  for (let j = 0; j < 14; j += 2) o += pr('rgba(255,255,255,.35)', 8.5, j, .5, 1, 0);
  o += pr('#f4eee2', 1, 7, 1, 5) + pr('#f4eee2', 16, 5, 1, 5) + pr('#ffb347', 11, 9, 1, 1, 2) + pr('rgba(255,179,71,.3)', 10, 9, 1, 1, 6) + pr('rgba(255,179,71,.15)', 9, 8.6, 1, 1, 8);
  return o + frame('PONG', '#8fd6e8', '1–2 PLAYERS', 58); };
const coverDodge = () => { const R = rng(5); let o = bands(['#2b2810', '#363214', '#403b18']);
  [[3, 3, 2, 2], [10, 5, 3, 2], [14, 2, 2, 2], [6, 8, 2, 2]].forEach(([i, j, w, h]) => { o += pr('rgba(255,255,255,.16)', i + w / 2 - .1, j - 3, .2, 2.7, 0) + pr('#e0623b', i, j, w, h) + pr('#a8452a', i, j + h - .6, w, .6, 0) + pr('rgba(255,255,255,.25)', i, j, w, .25, 0); });
  o += pr('#f0b13c', 8, 10, 1, 1) + pr('#a8741b', 8.3, 10.3, .4, .4, 0);
  o += pr('rgba(244,238,226,.12)', 3.5, 12, 2, 2) + pr('rgba(244,238,226,.25)', 5.5, 12, 2, 2) + pr('#f4eee2', 8, 12, 2, 2) + pr('#cfc8b8', 8, 13.4, 2, .6, 0) + pr('#14110c', 8.4, 12.5, .3, .4, 0) + pr('#14110c', 9.3, 12.5, .3, .4, 0);
  return o + frame('DODGE', '#f0d36a', '1 PLAYER · DASH', 54); };
const bird = (cx, cy) => { let o = ''; for (let j = -3; j <= 3; j++) for (let i = -4; i <= 4; i++) { const d = i * i / 20 + j * j / 12; if (d <= 1) o += pr(d > .7 ? '#8f5412' : j > 1 ? '#f0a93c' : '#f8cf63', cx + i, cy + j); }
  return o + pr('#fff', cx + 2, cy - 2, 2, 2, 0) + pr('#14110c', cx + 3, cy - 2, 1, 1, 0) + pr('#e0562b', cx + 4, cy, 3, 1.4, 0) + pr('#c27616', cx - 3, cy, 3, 2, 0); };
const coverFlap = () => { let o = bands(['#17304f', '#1d3d63', '#254a77', '#2e5a8a']);
  [[1, 2, 4], [11, 1, 5]].forEach(([i, j, w]) => o += pr('rgba(255,255,255,.14)', i, j, w, 1) + pr('rgba(255,255,255,.14)', i + 1, j - 1, w - 2, 1));
  const pipe = (i, a, b, capRow) => { for (let j = a; j <= b; j++) o += pr('#6fae55', i, j, 4, 1, 0) + pr('#9bd67c', i, j, 1, 1, 0) + pr('#3f7a35', i + 3, j, 1, 1, 0); o += pr('#6fae55', i - .5, capRow, 5, 1, 0) + pr('#9bd67c', i - .5, capRow, 5, .3, 0) + pr('#3f7a35', i - .5, capRow + .7, 5, .3, 0); };
  pipe(1, 0, 3, 4); pipe(1, 10, 13, 9); pipe(13, 0, 1, 2); pipe(13, 8, 13, 7);
  return o + bird(8, 6) + frame('FLAP', '#ffd36b', '1 PLAYER · ONE BUTTON', 60); };

const GAMES = [
{ id: 'snake', title: 'Snake', blurb: 'Smooth, classic, apple by apple.', art: coverSnake(),
  run: arcade('snake', { title: 'Snake', hint: 'Arrow keys or WASD · P pauses' }, (x, io, W, H, fx) => {
    const C = 28, COLS = 22, ROWS = 13, OX = 12, OY = 34;
    let pts, dir, q, L, apple, sc, speed, popT;
    const D = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    const samples = step => { const out = []; let s = 0, carry = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy); let t = carry; while (t < len) { out.push({ x: a.x + dx * t / len, y: a.y + dy * t / len, s: s + t }); t += step; } carry = t - len; s += len; } return out; };
    const spawn = () => { const sm = samples(.3); let a; do a = [rand(COLS), rand(ROWS)]; while (sm.some(p => Math.hypot(p.x - a[0] - .5, p.y - a[1] - .5) < 1)); apple = a; popT = 0; };
    return {
      reset() { pts = [{ x: 4.5, y: 6.5 }, { x: 1.5, y: 6.5 }]; dir = [1, 0]; q = []; L = 3; sc = 0; speed = 6.5; apple = [14, 6]; popT = 0; },
      score: () => sc,
      input() { for (const k in D) if (io.hit(k)) { const last = q.length ? q[q.length - 1] : dir, d = D[k]; if (!(d[0] === -last[0] && d[1] === -last[1]) && !(d[0] === last[0] && d[1] === last[1]) && q.length < 2) q.push(d); } },
      update(dt) {
        popT += dt; let rem = speed * dt;
        while (rem > 1e-6) {
          const h = pts[0], ax = dir[0] ? 'x' : 'y', sg = dir[0] || dir[1];
          let toC = (Math.floor(h[ax]) + .5 - h[ax]) * sg; if (toC <= 1e-6) toC += 1;
          const m = Math.min(rem, toC); h.x += dir[0] * m; h.y += dir[1] * m; rem -= m;
          if (m >= toC - 1e-6) {
            h[ax] = Math.round(h[ax] - .5) + .5;
            if (h.x > 0 && h.y > 0 && Math.floor(h.x) === apple[0] && Math.floor(h.y) === apple[1]) { sc++; L += 1; speed = Math.min(11, speed + .12); fx.burst((apple[0] + .5) * C + OX, (apple[1] + .5) * C + OY, '#e7471d', 14, 150); fx.text((apple[0] + .5) * C + OX, apple[1] * C + OY, '+1', '#fff'); spawn(); }
            if (q.length) { dir = q.shift(); pts.unshift({ x: h.x, y: h.y }); }
          }
        }
        let tot = 0; for (let i = 0; i < pts.length - 1; i++) tot += Math.hypot(pts[i].x - pts[i + 1].x, pts[i].y - pts[i + 1].y);
        let ex = tot - L; while (ex > 1e-6 && pts.length > 1) { const a = pts[pts.length - 2], b = pts[pts.length - 1], len = Math.hypot(a.x - b.x, a.y - b.y); if (len <= ex + 1e-6) { pts.pop(); ex -= len; } else { b.x += (a.x - b.x) * ex / len; b.y += (a.y - b.y) * ex / len; ex = 0; } }
        const h = pts[0]; if (h.x < .3 || h.x > COLS - .3 || h.y < .3 || h.y > ROWS - .3) return 'over';
        for (const p of samples(.2)) if (p.s > 1.7 && Math.hypot(p.x - h.x, p.y - h.y) < .6) return 'over';
      },
      draw() {
        for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) { x.fillStyle = (i + j) % 2 ? '#a2d149' : '#aad751'; x.fillRect(OX + i * C, OY + j * C, C, C); }
        x.save(); x.translate(OX, OY); x.scale(C, C);
        const s = Math.min(1, popT * 4), e = s < 1 ? 1 + Math.sin(s * 3.14) * .25 : 1, ar = .36 * e * s;
        dot(x, apple[0] + .5, apple[1] + .58, ar, '#e7471d'); dot(x, apple[0] + .4, apple[1] + .46, ar * .3, 'rgba(255,255,255,.55)'); x.fillStyle = '#4f7a1f'; x.beginPath(); x.ellipse(apple[0] + .62, apple[1] + .2, .12 * s, .07 * s, -.5, 0, 6.3); x.fill();
        x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y));
        x.strokeStyle = '#3a5fcf'; x.lineWidth = .86; x.stroke(); x.strokeStyle = '#4a7cf2'; x.lineWidth = .72; x.stroke();
        x.save(); x.translate(-.05, -.1); x.strokeStyle = 'rgba(160,190,255,.35)'; x.lineWidth = .2; x.stroke(); x.restore();
        const h = pts[0], fw = dir;
        for (const sg of [-1, 1]) { const ex = h.x + fw[0] * .14 - fw[1] * .21 * sg, ey = h.y + fw[1] * .14 + fw[0] * .21 * sg; dot(x, ex, ey, .17, '#fff'); dot(x, ex + fw[0] * .05, ey + fw[1] * .05, .09, '#14110c'); }
        x.restore();
        x.strokeStyle = '#578a34'; x.lineWidth = 2; x.strokeRect(OX - 1, OY - 1, COLS * C + 2, ROWS * C + 2);
      }
    };
  }) },
{ id: 'breakout', title: 'Breakout', blurb: 'Power-ups, multiball, endless levels.', art: coverBreakout(),
  run: arcade('breakout', { title: 'Breakout', hint: '← → or mouse · Space launches · catch the capsules' }, (x, io, W, H, fx) => {
    const PY = 376, R = 6, COL = ['#d9734e', '#e8a33d', '#d8c35a', '#7fae6b', '#5f9bb0', '#a98bc9'], PU = { W: ['#5f9bb0', 'WIDE'], M: ['#e8a33d', 'MULTI'], S: ['#7fae6b', 'SLOW'], L: ['#d9734e', '+LIFE'] };
    let px, pw, balls, br, caps, lives, sc, lvl, hits, lastmx, wideT, slowT;
    const build = () => { br = []; const rows = Math.min(4 + lvl, 8); for (let r = 0; r < rows; r++) for (let c = 0; c < 10; c++) { if (lvl % 3 === 0 && (r + c) % 2) continue; br.push({ x: 10 + c * 62, y: 44 + r * 22, w: 58, h: 18, hp: lvl > 1 && r < 2 ? 2 : 1, c: COL[r % 6] }); } };
    const stick = () => { balls = [{ x: px + pw / 2, y: PY - R - 1, vx: 0, vy: 0, s: true }]; };
    const spd = () => Math.min(250 + lvl * 25 + hits * 1.2, 470) * (slowT > 0 ? .72 : 1);
    const apply = k => { if (k === 'W') wideT = 12; if (k === 'S') slowT = 8; if (k === 'L') lives = Math.min(lives + 1, 5);
      if (k === 'M') { const m = balls.filter(b => !b.s); m.slice(0, 2).forEach(b => { for (const a of [-.5, .5]) { const v = Math.hypot(b.vx, b.vy) || spd(), t = Math.atan2(b.vx, -b.vy) + a; balls.push({ x: b.x, y: b.y, vx: Math.sin(t) * v, vy: -Math.cos(t) * v }); } }); }
      fx.text(px + pw / 2, PY - 14, PU[k][1], PU[k][0]); };
    return {
      reset() { px = 272; pw = 96; wideT = slowT = 0; lives = 3; sc = 0; lvl = 1; hits = 0; lastmx = -1; caps = []; build(); stick(); },
      score: () => sc, hud: () => `SCORE ${sc}   LEVEL ${lvl}   LIVES ${Math.max(lives, 0)}`,
      input() { if (balls.some(b => b.s) && io.act()) balls.forEach(b => { if (b.s) { const a = rr(-.35, .35); b.s = false; b.vx = Math.sin(a) * spd(); b.vy = -Math.cos(a) * spd(); } }); },
      update(dt) {
        wideT = Math.max(0, wideT - dt); slowT = Math.max(0, slowT - dt); pw += ((wideT > 0 ? 140 : 96) - pw) * Math.min(1, dt * 10);
        const kx = (io.down('arrowright') || io.down('d') ? 1 : 0) - (io.down('arrowleft') || io.down('a') ? 1 : 0);
        if (kx) px += kx * 440 * dt; else if (io.mx !== lastmx && lastmx >= 0) px = io.mx - pw / 2; lastmx = io.mx; px = clamp(px, 0, W - pw);
        for (const b of balls) {
          if (b.s) { b.x = px + pw / 2; b.y = PY - R - 1; continue; }
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); } if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx); } if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + R >= PY && b.y - R <= PY + 10 && b.x > px - R && b.x < px + pw + R) { const a = clamp((b.x - px - pw / 2) / (pw / 2), -1, 1), s = spd(); hits++; b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.y = PY - R; fx.burst(b.x, PY, '#ece7dd', 5, 90); }
          for (const q of br) { if (q.dead) continue; if (b.x + R > q.x && b.x - R < q.x + q.w && b.y + R > q.y && b.y - R < q.y + q.h) {
            const ox = Math.min(b.x + R - q.x, q.x + q.w - (b.x - R)), oy = Math.min(b.y + R - q.y, q.y + q.h - (b.y - R));
            if (ox < oy) b.vx = (b.x < q.x + q.w / 2 ? -1 : 1) * Math.abs(b.vx); else b.vy = (b.y < q.y + q.h / 2 ? -1 : 1) * Math.abs(b.vy);
            q.hp--; hits++; sc += 10 * lvl; fx.burst(b.x, b.y, q.c, q.hp <= 0 ? 10 : 4, 110);
            if (q.hp <= 0) { q.dead = 1; if (Math.random() < .16) caps.push({ x: q.x + q.w / 2, y: q.y, k: ['W', 'W', 'M', 'S', 'L'][rand(5)] }); } break; } }
          if (b.y > H + 20) b.dead = 1;
        }
        br = br.filter(q => !q.dead); balls = balls.filter(b => !b.dead);
        caps.forEach(c => { c.y += 110 * dt; if (c.y > PY - 6 && c.y < PY + 14 && c.x > px - 14 && c.x < px + pw + 14) { c.dead = 1; apply(c.k); } if (c.y > H) c.dead = 1; }); caps = caps.filter(c => !c.dead);
        if (!br.length) { lvl++; hits = 0; build(); stick(); caps = []; fx.text(W / 2, 250, 'LEVEL ' + lvl, '#e8a33d'); return; }
        if (!balls.length) { lives--; fx.shake(6); if (lives < 0) return 'over'; caps = []; stick(); }
      },
      draw() {
        for (const q of br) { fillR(x, q.x, q.y, q.w, q.h, 3, q.c); fillR(x, q.x, q.y, q.w, 4, 2, 'rgba(255,255,255,.25)'); fillR(x, q.x, q.y + q.h - 3, q.w, 3, 2, 'rgba(0,0,0,.22)'); if (q.hp > 1) { rrect(x, q.x + .5, q.y + .5, q.w - 1, q.h - 1, 3); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1.5; x.stroke(); } }
        for (const c of caps) { fillR(x, c.x - 17, c.y - 7, 34, 14, 7, PU[c.k][0]); T(x, c.k, c.x, c.y + 4, 11, '#14110c', 'center', MONO, 'bold'); }
        fillR(x, px, PY, pw, 10, 5, '#ece7dd'); fillR(x, px, PY, pw, 4, 3, 'rgba(255,255,255,.5)'); if (wideT > 0) fillR(x, px, PY + 8, pw * Math.min(1, wideT / 12), 2, 1, '#5f9bb0');
        for (const b of balls) { if (b.s) { x.setLineDash([3, 6]); x.strokeStyle = 'rgba(232,163,61,.5)'; x.beginPath(); x.moveTo(b.x, b.y - 10); x.lineTo(b.x, b.y - 80); x.stroke(); x.setLineDash([]); } dot(x, b.x, b.y, R, slowT > 0 ? '#bfe6a8' : '#f4eee2'); }
      }
    };
  }) },
{ id: 'pong', title: 'Pong', blurb: 'One or two players. First to seven.', art: coverPong(),
  run: arcade('pong', { title: 'Pong', hint: '' }, (x, io, W, H, fx) => {
    const PH = 72, PX = 18; let py, ay, b, ps, as, wait, err, lastmy, trail, two = false;
    const serve = d => { b = { x: W / 2, y: H / 2, vx: 0, vy: 0, d }; wait = .9; trail = []; };
    const bounce = (p, dir) => { const a = clamp((b.y - p - PH / 2) / (PH / 2), -1, 1) * .95, s = Math.min(Math.hypot(b.vx, b.vy) * 1.05 + 4, 640); b.vx = Math.cos(a) * s * dir; b.vy = Math.sin(a) * s; b.x = dir > 0 ? PX + 16 : W - PX - 16; fx.burst(b.x, b.y, '#ece7dd', 5, 100); };
    const K = (u, d) => (io.down(d) ? 1 : 0) - (io.down(u) ? 1 : 0);
    return {
      noBest: true, hint: () => `W S or mouse · press 1 or 2 for players (now ${two ? 2 : 1})`, ready() { if (io.hit('1')) two = false; if (io.hit('2')) two = true; },
      reset() { py = ay = H / 2 - PH / 2; ps = as = 0; err = 0; lastmy = -1; serve(Math.random() < .5 ? 1 : -1); },
      score: () => ps, hud: () => two ? `P1 ${ps}     P2 ${as}` : `YOU ${ps}     CPU ${as}`, endTitle: () => two ? (ps > as ? 'Player 1 wins' : 'Player 2 wins') : (ps > as ? 'You win' : 'CPU wins'),
      update(dt) {
        if (two) { py += K('w', 's') * 400 * dt; ay += K('arrowup', 'arrowdown') * 400 * dt; }
        else { const ky = K('w', 's') + K('arrowup', 'arrowdown'); if (ky) py += clamp(ky, -1, 1) * 400 * dt; else if (io.my !== lastmy && lastmy >= 0) py = io.my - PH / 2; lastmy = io.my;
          const tgt = (b.vx > 0 ? b.y + err : H / 2) - PH / 2, sp = 230 + Math.min(ps, 6) * 16; ay += clamp(tgt - ay, -sp * dt, sp * dt); }
        py = clamp(py, 0, H - PH); ay = clamp(ay, 0, H - PH);
        if (wait > 0) { wait -= dt; if (wait <= 0) { b.vx = 300 * b.d; b.vy = rr(-140, 140); } return; }
        trail.push({ x: b.x, y: b.y }); if (trail.length > 8) trail.shift();
        b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < 6) { b.y = 6; b.vy = Math.abs(b.vy); } if (b.y > H - 6) { b.y = H - 6; b.vy = -Math.abs(b.vy); }
        if (b.vx < 0 && b.x - 6 <= PX + 10 && b.x > PX && b.y > py - 6 && b.y < py + PH + 6) bounce(py, 1);
        if (b.vx > 0 && b.x + 6 >= W - PX - 10 && b.x < W - PX && b.y > ay - 6 && b.y < ay + PH + 6) { bounce(ay, -1); err = rr(-34, 34); }
        if (b.x < -10) { as++; fx.shake(5); if (as >= 7) return 'over'; serve(-1); }
        if (b.x > W + 10) { ps++; fx.shake(5); if (ps >= 7) return 'over'; serve(1); }
      },
      draw() {
        x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 3; x.setLineDash([10, 12]); x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.setLineDash([]);
        fillR(x, PX, py, 10, PH, 5, '#ece7dd'); fillR(x, W - PX - 10, ay, 10, PH, 5, '#ece7dd');
        trail.forEach((p, i) => dot(x, p.x, p.y, 2 + i * .45, `rgba(232,163,61,${i * .035})`)); dot(x, b.x, b.y, 6, '#e8a33d');
        if (wait > 0) T(x, Math.ceil(wait * 3 / 2.7) + '', W / 2, H / 2 - 40, 26, 'rgba(236,231,221,.5)', 'center');
      }
    };
  }) },
{ id: 'dodge', title: 'Dodge', blurb: 'Dash, grab shields, survive.', art: coverDodge(),
  run: arcade('dodge', { title: 'Dodge', hint: '← → to move · Space to dash · gold = points · blue = shield' }, (x, io, W, H, fx) => {
    const PY = 366; let p, hz, co, sh, tm, coins, bonus, spawn, cs, ss, cd, inv, trail, dir, shield;
    const K = () => (io.down('arrowright') || io.down('d') ? 1 : 0) - (io.down('arrowleft') || io.down('a') ? 1 : 0);
    return {
      reset() { p = { x: W / 2 - 14, vx: 0 }; hz = []; co = []; sh = []; tm = 0; coins = 0; bonus = 0; spawn = .4; cs = 3; ss = 12; cd = 0; inv = 0; trail = []; dir = 1; shield = false; },
      score: () => Math.floor(tm * 10) + coins * 25 + bonus,
      input() { if (io.hit(' ') && cd <= 0) { dir = K() || dir; p.vx = dir * 640; cd = 1.1; inv = Math.max(inv, .22); fx.burst(p.x + 14, PY + 14, '#ece7dd', 8, 120); } },
      update(dt) {
        tm += dt; cd = Math.max(0, cd - dt); inv = Math.max(0, inv - dt); const k = K(); if (k) dir = k;
        p.vx += k * 1800 * dt; p.vx *= Math.pow(.02, dt); p.x += p.vx * dt; if (p.x < 0) { p.x = 0; p.vx = 0; } if (p.x > W - 28) { p.x = W - 28; p.vx = 0; }
        if (Math.abs(p.vx) > 300) trail.push({ x: p.x, l: .22 }); trail.forEach(t => t.l -= dt); trail = trail.filter(t => t.l > 0);
        spawn -= dt; if (spawn <= 0) { spawn = Math.max(.16, .55 - tm * .008) * rr(.7, 1.2); const w = rr(18, 48); hz.push({ x: rr(0, W - w), y: -30, w, h: w * .7, vy: Math.min(rr(150, 220) + tm * 5, 520) }); }
        cs -= dt; if (cs <= 0) { cs = rr(2.5, 5); co.push({ x: rr(20, W - 20), y: -20, vy: 120 }); }
        ss -= dt; if (ss <= 0) { ss = rr(14, 22); sh.push({ x: rr(20, W - 20), y: -20, vy: 100 }); }
        [hz, co, sh].forEach(a => a.forEach(o => o.y += o.vy * dt)); hz = hz.filter(h => h.y < H + 40); co = co.filter(c => c.y < H + 30); sh = sh.filter(c => c.y < H + 30);
        for (const h of hz) { const hit = p.x + 25 > h.x + 2 && p.x + 3 < h.x + h.w - 2 && PY + 25 > h.y + 2 && PY + 3 < h.y + h.h - 2;
          if (hit && !inv) { if (shield) { shield = false; inv = .9; h.dead = 1; fx.burst(h.x + h.w / 2, h.y, '#6fc4e8', 18, 200); fx.shake(5); fx.text(p.x + 14, PY - 8, 'SHIELD', '#6fc4e8'); } else { fx.burst(p.x + 14, PY + 14, '#ece7dd', 26, 240); return 'over'; } }
          else if (!hit && !h.n && h.y + h.h > PY && h.y < PY + 28 && (h.x > p.x + 28 ? h.x - (p.x + 28) : p.x - (h.x + h.w)) < 8) { h.n = 1; bonus += 5; fx.text(p.x + 14, PY - 8, 'CLOSE +5', '#e8a33d'); } }
        hz = hz.filter(h => !h.dead);
        for (const c of co) if (Math.abs(c.x - (p.x + 14)) < 22 && Math.abs(c.y - (PY + 14)) < 22) { c.dead = 1; coins++; fx.burst(c.x, c.y, '#e8a33d', 10, 130); } co = co.filter(c => !c.dead);
        for (const c of sh) if (Math.abs(c.x - (p.x + 14)) < 22 && Math.abs(c.y - (PY + 14)) < 22) { c.dead = 1; shield = true; fx.text(c.x, c.y - 8, 'SHIELD', '#6fc4e8'); } sh = sh.filter(c => !c.dead);
      },
      draw() {
        x.fillStyle = '#26231d'; x.fillRect(0, PY + 30, W, H - PY - 30);
        for (const h of hz) { fillR(x, h.x, h.y, h.w, h.h, 5, '#d9734e'); fillR(x, h.x, h.y + h.h * .6, h.w, h.h * .4, 4, '#a8452a'); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(h.x + h.w / 2 - 1, h.y - 28, 2, 26); }
        for (const c of co) { dot(x, c.x, c.y, 8, '#e8a33d'); dot(x, c.x, c.y, 4, '#b67a1d'); }
        for (const c of sh) { dot(x, c.x, c.y, 9, 'rgba(111,196,232,.25)'); x.strokeStyle = '#6fc4e8'; x.lineWidth = 2; x.beginPath(); x.arc(c.x, c.y, 8, 0, 6.3); x.stroke(); }
        trail.forEach(t => { x.globalAlpha = t.l * 2; fillR(x, t.x, PY, 28, 28, 6, '#ece7dd'); }); x.globalAlpha = 1;
        x.globalAlpha = inv > 0 && !shield ? .6 + .4 * Math.sin(io.time * 40) : 1; fillR(x, p.x, PY, 28, 28, 6, '#ece7dd'); fillR(x, p.x, PY, 28, 8, 5, 'rgba(255,255,255,.4)'); dot(x, p.x + 9, PY + 12, 2.2, '#14110c'); dot(x, p.x + 19, PY + 12, 2.2, '#14110c'); x.globalAlpha = 1;
        if (shield) { x.strokeStyle = `rgba(111,196,232,${.6 + .3 * Math.sin(io.time * 6)})`; x.lineWidth = 2.5; x.beginPath(); x.arc(p.x + 14, PY + 14, 24, 0, 6.3); x.stroke(); }
        fillR(x, 16, H - 14, 80, 4, 2, 'rgba(255,255,255,.1)'); fillR(x, 16, H - 14, 80 * (1 - cd / 1.1), 4, 2, cd > 0 ? '#8f8979' : '#e8a33d'); T(x, 'DASH', 102, H - 10, 10, '#8f8979');
      }
    };
  }) },
{ id: 'flap', title: 'Flap', blurb: 'One button. Medals for the brave.', art: coverFlap(),
  run: arcade('flap', { title: 'Flap', hint: 'Space, ↑ or click to flap' }, (x, io, W, H, fx) => {
    const BX = 130, GY = 370, THEMES = [['#6fa35b', '#8fc577'], ['#4f9aa8', '#7fc4d0'], ['#c98a45', '#e6b070']];
    let y, vy, pipes, sc, spawn, gx, bgx, lastC;
    return {
      reset() { y = 190; vy = 0; pipes = []; sc = 0; spawn = .2; gx = 0; bgx = 0; lastC = 190; },
      score: () => sc, endSub: () => sc >= 40 ? 'Gold medal' : sc >= 20 ? 'Silver medal' : sc >= 10 ? 'Bronze medal' : '',
      input() { if (io.hit(' ') || io.hit('arrowup') || io.hit('w') || (io.mdown && !io.pmdown)) { vy = -310; fx.burst(BX - 8, y + 8, '#ece7dd', 4, 60); } },
      update(dt) {
        vy += 980 * dt; y += vy * dt; const spd = 150 + Math.min(sc * 3, 60); gx -= spd * dt; bgx -= spd * .25 * dt;
        spawn -= dt; if (spawn <= 0) { spawn = 1.55 - Math.min(sc * .01, .25); const g = Math.max(96, 124 - sc * 1.2), c = clamp(lastC + rr(-110, 110), g / 2 + 50, GY - g / 2 - 40); lastC = c; pipes.push({ x: W + 10, g, top: c - g / 2 }); }
        pipes.forEach(p => { p.x -= spd * dt; if (!p.p && p.x + 52 < BX) { p.p = 1; sc++; fx.burst(BX, y, '#e8a33d', 6, 90); if (sc % 10 === 0) fx.text(BX + 30, y - 20, sc + '!', '#e8a33d'); } }); pipes = pipes.filter(p => p.x > -70);
        if (y < 0 || y > GY - 10) { fx.burst(BX, y, '#e8a33d', 20, 200); return 'over'; }
        for (const p of pipes) if (BX + 10 > p.x && BX - 10 < p.x + 52 && (y - 9 < p.top || y + 9 > p.top + p.g)) { fx.burst(BX, y, '#e8a33d', 20, 200); return 'over'; }
      },
      draw() {
        const th = THEMES[Math.floor(sc / 10) % 3];
        for (let i = 0; i < 6; i++) { const cx = ((i * 170 + bgx) % 1020 + 1020) % 1020 - 120; fillR(x, cx, 60 + (i * 53) % 150, 90, 20, 10, 'rgba(255,255,255,.04)'); }
        for (const p of pipes) { fillR(x, p.x, 0, 52, p.top, 0, th[0]); fillR(x, p.x, p.top + p.g, 52, GY - p.top - p.g, 0, th[0]); x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(p.x + 6, 0, 8, p.top); x.fillRect(p.x + 6, p.top + p.g, 8, GY); fillR(x, p.x - 4, p.top - 20, 60, 20, 4, th[1]); fillR(x, p.x - 4, p.top + p.g, 60, 20, 4, th[1]); }
        x.fillStyle = '#26231d'; x.fillRect(0, GY, W, H - GY); x.fillStyle = '#34302a'; for (let i = 0; i < 24; i++) x.fillRect(((i * 40 + gx) % 960 + 960) % 960 - 40, GY, 20, 8);
        x.save(); x.translate(BX, y); x.rotate(clamp(vy / 500, -.5, 1.1)); x.beginPath(); x.ellipse(0, 0, 14, 11, 0, 0, 6.28); x.fillStyle = '#e8a33d'; x.fill();
        x.beginPath(); x.ellipse(-4, 3 + Math.sin(io.time * 18) * 3, 7, 4, 0, 0, 6.28); x.fillStyle = '#c27f1a'; x.fill(); dot(x, 6, -3, 4, '#fff'); dot(x, 7, -3, 2, '#1a1a14');
        x.beginPath(); x.moveTo(11, 0); x.lineTo(19, 2); x.lineTo(11, 5); x.fillStyle = '#d9734e'; x.fill(); x.restore();
      }
    };
  }) }
];

function startGame(game, canvas) {
  canvas.width = 1280; canvas.height = 800; canvas.style.touchAction = 'none';
  const x = canvas.getContext('2d'); x.scale(2, 2);
  const io = { k: {}, prev: {}, mx: 320, my: 200, mdown: false, pmdown: false, time: 0,
    down(n) { return !!this.k[n]; }, hit(n) { return !!this.k[n] && !this.prev[n]; },
    act() { return this.hit(' ') || this.hit('enter') || (this.mdown && !this.pmdown); } };
  const nav = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
  const dn = e => { const n = e.key.toLowerCase(); if (nav.includes(n)) e.preventDefault(); if (e.repeat) return; io.k[n] = 1; }, up = e => { delete io.k[e.key.toLowerCase()]; }, bl = () => { io.k = {}; io.mdown = false; };
  const pm = e => { const r = canvas.getBoundingClientRect(); io.mx = (e.clientX - r.left) / r.width * 640; io.my = (e.clientY - r.top) / r.height * 400; }, pd = e => { pm(e); io.mdown = true; }, pu = () => { io.mdown = false; };
  addEventListener('keydown', dn); addEventListener('keyup', up); addEventListener('blur', bl);
  canvas.addEventListener('pointermove', pm); canvas.addEventListener('pointerdown', pd); addEventListener('pointerup', pu);
  const step = game.run(x, io, 640, 400); let on = 1, l = performance.now(), id;
  (function f(t) { if (!on) return; const dt = Math.min(.05, (t - l) / 1000); l = t; io.time += dt; step(dt); io.prev = { ...io.k }; io.pmdown = io.mdown; id = requestAnimationFrame(f); })(l);
  return () => { on = 0; cancelAnimationFrame(id); removeEventListener('keydown', dn); removeEventListener('keyup', up); removeEventListener('blur', bl); removeEventListener('pointerup', pu); };
}
