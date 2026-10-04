(function () {
  var cv = document.getElementById('c');
  var ctx = cv.getContext('2d');
  var W = 0, H = 0;

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  var player = { x: W / 2, y: H / 2, r: 16, speed: 220, angle: 0 };
  var bullets = [];
  var enemies = [];
  var score = 0;
  var joy = { id: null, sx: 0, sy: 0, dx: 0, dy: 0 };
  var last = performance.now();

  function spawnEnemy() {
    var x, y, tries = 0;
    do {
      x = Math.random() * W;
      y = Math.random() * H;
      tries++;
    } while (Math.hypot(x - player.x, y - player.y) < 250 && tries < 50);
    return { x: x, y: y, r: 14, speed: 70 + Math.random() * 40 };
  }

  function resetGame() {
    player.x = W / 2;
    player.y = H / 2;
    bullets = [];
    enemies = [];
    for (var i = 0; i < 5; i++) enemies.push(spawnEnemy());
    score = 0;
  }

  function shoot(tx, ty) {
    var a = Math.atan2(ty - player.y, tx - player.x);
    player.angle = a;
    bullets.push({
      x: player.x + Math.cos(a) * player.r,
      y: player.y + Math.sin(a) * player.r,
      vx: Math.cos(a) * 600,
      vy: Math.sin(a) * 600,
      r: 4,
      life: 1.5
    });
  }

  cv.addEventListener('touchstart', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.clientX < W * 0.4 && joy.id === null) {
        joy.id = t.identifier;
        joy.sx = t.clientX;
        joy.sy = t.clientY;
        joy.dx = 0;
        joy.dy = 0;
      } else {
        shoot(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  cv.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      if (t.identifier === joy.id) {
        var dx = t.clientX - joy.sx;
        var dy = t.clientY - joy.sy;
        var d = Math.hypot(dx, dy);
        var max = 60;
        if (d > max) { dx = dx / d * max; dy = dy / d * max; }
        joy.dx = dx / max;
        joy.dy = dy / max;
      }
    }
  }, { passive: false });

  function endTouch(e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joy.id) {
        joy.id = null;
        joy.dx = 0;
        joy.dy = 0;
      }
    }
  }
  cv.addEventListener('touchend', endTouch, { passive: false });
  cv.addEventListener('touchcancel', endTouch, { passive: false });

  cv.addEventListener('mousedown', function (e) {
    shoot(e.clientX, e.clientY);
  });

  function update(dt) {
    player.x += joy.dx * player.speed * dt;
    player.y += joy.dy * player.speed * dt;
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    var i, j;
    for (i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
        bullets.splice(i, 1);
      }
    }

    for (j = 0; j < enemies.length; j++) {
      var en = enemies[j];
      var a = Math.atan2(player.y - en.y, player.x - en.x);
      en.x += Math.cos(a) * en.speed * dt;
      en.y += Math.sin(a) * en.speed * dt;
      if (Math.hypot(player.x - en.x, player.y - en.y) < player.r + en.r) {
        resetGame();
        return;
      }
    }

    for (i = bullets.length - 1; i >= 0; i--) {
      for (j = 0; j < enemies.length; j++) {
        if (Math.hypot(bullets[i].x - enemies[j].x, bullets[i].y - enemies[j].y) < bullets[i].r + enemies[j].r) {
          bullets.splice(i, 1);
          enemies[j] = spawnEnemy();
          score++;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#12002b';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,45,149,0.12)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    ctx.fillStyle = '#00ffff';
    for (var j = 0; j < enemies.length; j++) {
      ctx.beginPath();
      ctx.arc(enemies[j].x, enemies[j].y, enemies[j].r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < bullets.length; i++) {
      ctx.beginPath();
      ctx.arc(bullets[i].x, bullets[i].y, bullets[i].r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ff2d95';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.angle) * (player.r + 8), player.y + Math.sin(player.angle) * (player.r + 8));
    ctx.stroke();

    if (joy.id !== null) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joy.sx, joy.sy, 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,45,149,0.6)';
      ctx.beginPath();
      ctx.arc(joy.sx + joy.dx * 60, joy.sy + joy.dy * 60, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SCORE ' + score, 16, 30);
  }

  function loop(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resetGame();
  requestAnimationFrame(loop);
})();