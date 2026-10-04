// INDIE MIAMI x ARCHER — HTML5 Canvas, sans librairie
const canvas = document.getElementById('c'), ctx = canvas.getContext('2d');
const W = canvas.width = 640, H = canvas.height = 360;
const ld = s => { const i = new Image(); i.onerror = () => { if (window.SKIN) i.src = SKIN[s]; }; i.src = s; return i; };
const player = ld('player.png'), enemies = ld('enemies.png');
const ok = i => i.complete && i.naturalWidth > 0;
const R = Math.random, dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const AOE = 80, MAXA = 40;
let P, E, A, D, F, T, arrows, fish, expl, score, spawnT, regenT, over, overT, firing, tid, flash;
let keys = {}, aim = { x: W / 2, y: H / 2 }, touch = null, last = 0, msg = '';

function reset() {
  P = { x: W / 2, y: H / 2, hp: 100, max: 100, cd: 0, shoot: 0, anim: 0, face: 1, hit: 0 };
  E = []; A = []; D = []; F = []; T = [];
  arrows = 20; fish = 0; expl = 0; score = 0; spawnT = 1; regenT = 0;
  over = false; overT = 0; firing = false; tid = null; touch = null; flash = 0;
}

// ---------- actions ----------
function shoot(explosive) {
  if (P.cd > 0 || over) return;
  if (explosive) { if (expl < 1) return; expl--; }
  else { if (arrows < 1) return; arrows--; }
  const angle = Math.atan2(aim.y - (P.y - 42), aim.x - P.x);
  A.push({ x: P.x, y: P.y - 42, angle, speed: explosive ? 380 : 520, explosive, life: 1.3 });
  P.cd = explosive ? 0.45 : 0.22; P.shoot = 0.15;
}
function craftExplosive() {
  if (fish >= 1 && arrows >= 3) { fish--; arrows -= 3; expl++; text(P.x, P.y - 50, 'CRAFT +1 BOOM', '#ff3cac'); }
  else text(P.x, P.y - 50, 'Need 1 fish + 3 arrows', '#ccc');
}
function text(x, y, s, c) { T.push({ x, y, s, c, t: 1 }); }
function explode(x, y) {
  F.push({ x, y, t: 0 }); flash = 0.12;
  for (const e of E) if (!e.dead && dist(e, { x, y }) < AOE) hurt(e, 30);
}
function hurt(e, d) {
  e.hp -= d; e.flash = 0.1;
  if (e.hp > 0 || e.dead) return;
  e.dead = true; score += 10;
  const r = R();
  if (r < 0.4) D.push({ x: e.x, y: e.y, k: 'fish', t: 12 });
  else if (r < 0.65) D.push({ x: e.x, y: e.y, k: 'arrow', t: 12 });
}
function spawn() {
  if (E.length > 40) return;
  const s = (R() * 4) | 0, type = (R() * 4) | 0;
  const x = s < 2 ? R() * W : (s == 2 ? -20 : W + 20), y = s < 2 ? (s ? H + 20 : -20) : R() * H;
  const sp = (type == 3 ? 38 : 52 + type * 6) + R() * 14 + Math.min(score / 40, 40);
  E.push({ x, y, type, hp: 30, sp, anim: R() * 6, flash: 0, hit: 0, size: 82 });
}

// ---------- update ----------
function update(dt) {
  if (over) { overT += dt; return; }
  let mx = 0, my = 0;
  if (keys.ArrowLeft || keys.q || keys.a) mx--; if (keys.ArrowRight || keys.d) mx++;
  if (keys.ArrowUp || keys.z || keys.w) my--; if (keys.ArrowDown || keys.s) my++;
  if (touch && Math.hypot(touch.x - P.x, touch.y - P.y) > 14) { mx = touch.x - P.x; my = touch.y - P.y; }
  const l = Math.hypot(mx, my) || 1, sp = 150;
  P.x = Math.max(16, Math.min(W - 16, P.x + mx / l * sp * dt * (mx || my ? 1 : 0)));
  P.y = Math.max(40, Math.min(H - 8, P.y + my / l * sp * dt * (mx || my ? 1 : 0)));
  if (mx || my) P.anim += dt * 10;
  P.face = aim.x < P.x ? -1 : 1;
  P.cd -= dt; P.shoot -= dt; P.hit -= dt; flash -= dt;
  if (firing) shoot(false);
  regenT += dt; if (regenT > 1.5 && arrows < 10) { arrows++; regenT = 0; }
  // spawn
  spawnT -= dt;
  if (spawnT <= 0) { spawn(); spawnT = Math.max(0.35, 1.5 - score / 350); }
  // enemies
  for (const e of E) {
    const a = Math.atan2(P.y - e.y, P.x - e.x);
    e.x += Math.cos(a) * e.sp * dt; e.y += Math.sin(a) * e.sp * dt;
    e.anim += dt * 8; e.flash -= dt; e.hit -= dt;
    for (const o of E) if (o !== e) { // séparation légère
      const d = dist(e, o);
      if (d < 22 && d > 0) { e.x += (e.x - o.x) / d * 40 * dt; e.y += (e.y - o.y) / d * 40 * dt; }
    }
    if (dist(e, P) < 30 && e.hit <= 0 && P.hit <= 0) {
      P.hp -= 8; P.hit = 0.6; e.hit = 0.8;
      if (P.hp <= 0) { P.hp = 0; over = true; overT = 0; firing = false; }
    }
  }
  // arrows
  for (const a of A) {
    a.x += Math.cos(a.angle) * a.speed * dt; a.y += Math.sin(a.angle) * a.speed * dt; a.life -= dt;
    let hit = false;
    for (const e of E) if (!e.dead && Math.hypot(a.x - e.x, a.y - (e.y - e.size * 0.35)) < e.size * 0.3) {
      if (a.explosive) explode(a.x, a.y); else hurt(e, 10);
      hit = true; break;
    }
    if (!hit && a.explosive && a.life <= 0) { explode(a.x, a.y); hit = true; }
    if (hit || a.life <= 0 || a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20) a.dead = true;
  }
  // drops
  for (const d of D) {
    d.t -= dt;
    if (dist(d, P) < 24) {
      d.t = 0;
      if (d.k == 'fish') { fish++; text(d.x, d.y - 10, '+1 ><>', '#3cf'); }
      else { arrows = Math.min(MAXA, arrows + 3); text(d.x, d.y - 10, '+3 arrows', '#ffe14d'); }
    }
  }
  for (const f of F) f.t += dt;
  for (const t of T) { t.t -= dt; t.y -= 24 * dt; }
  E = E.filter(e => !e.dead); A = A.filter(a => !a.dead); D = D.filter(d => d.t > 0);
  F = F.filter(f => f.t < 0.35); T = T.filter(t => t.t > 0);
}

// ---------- draw ----------
const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
(function () { // fond néon pré-rendu (1 seul drawImage par frame)
  const b = bg.getContext('2d'), g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a0a4a'); g.addColorStop(1, '#0b1a3a'); b.fillStyle = g; b.fillRect(0, 0, W, H);
  b.strokeStyle = 'rgba(255,60,172,.18)'; b.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, H); b.stroke(); }
  b.strokeStyle = 'rgba(29,233,182,.15)';
  for (let y = 0; y <= H; y += 40) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
})();
const btns = [
  { x: W - 112, y: H - 46, w: 104, h: 36, t: 'CRAFT [C]', f: () => craftExplosive() },
  { x: W - 228, y: H - 46, w: 104, h: 36, t: 'BOOM [E]', f: () => shoot(true) }
];
function sprite(img, frame, x, y, size, flip, fb) {
  ctx.save(); ctx.translate(x, y); if (flip < 0) ctx.scale(-1, 1);
  if (ok(img)) { const fw = img.width / 4; ctx.drawImage(img, frame * fw, 0, fw, img.height, -size / 2, -size + 6, size, size); }
  else { ctx.fillStyle = fb; ctx.beginPath(); ctx.arc(0, -size / 2 + 6, size / 3, 0, 7); ctx.fill(); }
  ctx.restore();
}
function shadow(x, y, s) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, y + 2, s * 0.3, s * 0.07, 0, 0, 7); ctx.fill(); }
function bow() { // arc dessiné par-dessus le sprite, orienté vers la visée
  ctx.save(); ctx.translate(P.x, P.y - 42); ctx.rotate(Math.atan2(aim.y - (P.y - 42), aim.x - P.x));
  ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#ffb347'; ctx.beginPath(); ctx.arc(-2, 0, 26, -1.1, 1.1); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(10, -23); ctx.lineTo(P.shoot > 0 ? -8 : 10, 0); ctx.lineTo(10, 23); ctx.stroke(); ctx.restore();
}
function bar(x, y, w, h, pct) {
  ctx.fillStyle = '#4a0a0a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pct > 0.5 ? '#2ecc40' : pct > 0.25 ? '#f1c40f' : '#e74c3c'; ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = '#a07c3c'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
}
function draw(now) {
  ctx.drawImage(bg, 0, 0);
  ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
  for (const d of D) { // drops
    const by = d.y + Math.sin(now / 200 + d.x) * 3; if (d.t < 3 && ((now / 120) | 0) % 2) continue;
    if (d.k == 'fish') { ctx.fillStyle = '#3cf'; ctx.fillText('><>', d.x, by); }
    else { ctx.fillStyle = '#ffe14d'; ctx.fillRect(d.x - 8, by - 6, 16, 2); ctx.fillRect(d.x - 8, by - 1, 16, 2); ctx.fillRect(d.x - 8, by + 4, 16, 2); }
  }
  const all = E.map(e => ({ y: e.y, e })).concat([{ y: P.y, p: 1 }]).sort((a, b) => a.y - b.y);
  for (const o of all) {
    if (o.p) {
      if (P.hit > 0 && ((now / 60) | 0) % 2) continue;
      const fr = P.shoot > 0 ? 3 : (P.anim | 0) % 2 ? 1 + ((P.anim / 2 | 0) % 2) : 0;
      shadow(P.x, P.y, 86); sprite(player, fr, P.x, P.y, 86, P.face, '#1de9b6'); bow();
    } else {
      const e = o.e; ctx.globalAlpha = e.flash > 0 ? 0.5 : 1;
      shadow(e.x, e.y, e.size); sprite(enemies, e.type, e.x, e.y - Math.abs(Math.sin(e.anim)) * 3, e.size, P.x < e.x ? -1 : 1, '#e63946'); ctx.globalAlpha = 1;
      bar(e.x - 14, e.y - e.size + 4, 28, 3, e.hp / 30);
    }
  }
  for (const a of A) { // flèches
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
    ctx.fillStyle = a.explosive ? '#ff7b00' : '#1de9b6'; ctx.fillRect(-14, -1, 18, 2);
    ctx.fillStyle = a.explosive ? '#ff3cac' : '#fff'; ctx.fillRect(4, -3, 5, 6); ctx.restore();
  }
  for (const f of F) { // explosions
    const k = f.t / 0.35; ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ff7b00';
    ctx.beginPath(); ctx.arc(f.x, f.y, AOE * k, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(aim.x - 6, aim.y - 1, 12, 2); ctx.fillRect(aim.x - 1, aim.y - 6, 2, 12);
  ctx.font = 'bold 14px monospace';
  for (const t of T) { ctx.globalAlpha = Math.min(1, t.t * 2); ctx.fillStyle = t.c; ctx.fillText(t.s, t.x, t.y); }
  ctx.globalAlpha = 1;
  // UI
  bar(12, 12, 200, 14, P.hp / P.max);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.fillText('HP ' + P.hp + '/' + P.max, 18, 23);
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#3cf'; ctx.fillText('><> ' + fish, 12, 46);
  ctx.fillStyle = '#ffe14d'; ctx.fillText('ARROWS ' + arrows, 62, 46);
  ctx.fillStyle = '#ff7b00'; ctx.fillText('BOOM ' + expl, 162, 46);
  ctx.textAlign = 'right'; ctx.fillStyle = '#ff3cac'; ctx.font = 'bold 20px monospace'; ctx.fillText('SCORE ' + score, W - 12, 28);
  const can = fish >= 1 && arrows >= 3;
  for (const b of btns) {
    ctx.fillStyle = 'rgba(20,10,40,.8)'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = (b.t[0] == 'C' && can) || (b.t[0] == 'B' && expl > 0) ? (((now / 200) | 0) % 2 ? '#ff3cac' : '#ffe14d') : '#a07c3c';
    ctx.lineWidth = 2; ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace'; ctx.fillText(b.t, b.x + b.w / 2, b.y + 23);
  }
  if (over) {
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3cac'; ctx.font = 'bold 40px monospace'; ctx.fillText('GAME OVER', W / 2, H / 2 - 10);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.fillText('Score ' + score, W / 2, H / 2 + 20);
    if (overT > 0.6) ctx.fillText('Space / tap pour rejouer', W / 2, H / 2 + 50);
  }
}

// ---------- inputs ----------
const xy = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
const press = p => { for (const b of btns) if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) { if (!over) b.f(); return true; } return false; };
const restart = () => { if (over && overT > 0.6) { reset(); return true; } return false; };
addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  const k = e.key.length > 1 ? e.key : e.key.toLowerCase(); keys[k] = true;
  if (k == ' ') { if (!restart()) firing = true; }
  if (k == 'e') shoot(true); if (k == 'c') craftExplosive();
});
addEventListener('keyup', e => { const k = e.key.length > 1 ? e.key : e.key.toLowerCase(); keys[k] = false; if (k == ' ') firing = false; });
canvas.addEventListener('mousemove', e => { aim = xy(e); });
canvas.addEventListener('mousedown', e => { aim = xy(e); if (!press(aim) && !restart()) firing = true; });
addEventListener('mouseup', () => { firing = false; });
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const p = xy(t); if (press(p) || restart()) continue;
    tid = t.identifier; touch = aim = p; firing = true;
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.touches) if (t.identifier === tid) { touch = aim = xy(t); }
}, { passive: false });
const tend = e => { for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; touch = null; firing = false; } };
canvas.addEventListener('touchend', tend); canvas.addEventListener('touchcancel', tend);

// ---------- boucle 60 FPS ----------
reset();
(function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  update(dt); draw(now); requestAnimationFrame(loop);
})(0);
