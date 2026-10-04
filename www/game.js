const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

let player = {x:400,y:300,angle:0,hp:1,speed:3.5};
let bullets=[], enemies=[], blood=[], shake=0, keys={};
let mouse={x:0,y:0};

// Controles
window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
window.addEventListener('mousemove',e=>{mouse.x=e.touches?e.touches[0].clientX:e.clientX; mouse.y=e.touches?e.touches[0].clientY:e.clientY;});
window.addEventListener('touchmove',e=>{mouse.x=e.touches[0].clientX; mouse.y=e.touches[0].clientY;});
canvas.addEventListener('mousedown',shoot);
canvas.addEventListener('touchstart',shoot);

// Creer 8 ennemis
for(let i=0;i<8;i++) enemies.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, angle:0, speed:1.2+Math.random()});

function shoot(){
  bullets.push({x:player.x, y:player.y, angle:player.angle, speed:12, owner:'player'});
  shake=8;
  // son visuel
}

function loop(){
  // shake
  ctx.save();
  if(shake>0){ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake); shake*=0.9;}

  // fond quadrillé néon
  ctx.fillStyle='#0e0e1a'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#1a1a3a'; ctx.lineWidth=1;
  for(let i=0;i<canvas.width;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,canvas.height);ctx.stroke();}
  for(let i=0;i<canvas.height;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(canvas.width,i);ctx.stroke();}

  // sang
  blood.forEach(b=>{ctx.fillStyle=`rgba(255,0,80,${b.a})`; ctx.fillRect(b.x,b.y,4,4);});

  // player
  player.angle = Math.atan2(mouse.y-player.y, mouse.x-player.x);
  if(keys['z']||keys['w']||keys['ArrowUp']) player.y-=player.speed;
  if(keys['s']||keys['ArrowDown']) player.y+=player.speed;
  if(keys['q']||keys['a']||keys['ArrowLeft']) player.x-=player.speed;
  if(keys['d']||keys['ArrowRight']) player.x+=player.speed;

  ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(player.angle);
  ctx.fillStyle='#00ffff'; ctx.fillRect(-10,-7,20,14);
  ctx.fillStyle='#ffffff'; ctx.fillRect(8,-2,14,4); // arme
  ctx.restore();

  // enemies
  enemies.forEach(e=>{
    e.angle = Math.atan2(player.y-e.y, player.x-e.x);
    e.x += Math.cos(e.angle)*e.speed;
    e.y += Math.sin(e.angle)*e.speed;
    ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.angle);
    ctx.fillStyle='#ff0055'; ctx.fillRect(-9,-7,18,14);
    ctx.fillStyle='#ffff00'; ctx.fillRect(5,-2,10,4);
    ctx.restore();

    // si touche player
    if(Math.hypot(player.x-e.x, player.y-e.y)<18){
      alert('WASTED - RESTART'); location.reload();
    }
  });

  // bullets
  bullets.forEach((b,i)=>{
    b.x+=Math.cos(b.angle)*b.speed; b.y+=Math.sin(b.angle)*b.speed;
    ctx.fillStyle=b.owner=='player'?'#00ffff':'#ffff00';
    ctx.beginPath(); ctx.arc(b.x,b.y,3,0,Math.PI*2); ctx.fill();

    // collision
    if(b.owner=='player'){
      enemies.forEach((e,j)=>{
        if(Math.hypot(b.x-e.x,b.y-e.y)<15){
          for(let k=0;k<20;k++) blood.push({x:e.x,y:e.y,a:1});
          enemies.splice(j,1); bullets.splice(i,1);
          if(enemies.length==0){alert('FLOOR CLEAR!'); location.reload();}
        }
      });
    }
  });
  bullets = bullets.filter(b=>b.x>0&&b.x<canvas.width&&b.y>0&&b.y<canvas.height);

  document.getElementById('count').innerText = enemies.length;
  ctx.restore();
  requestAnimationFrame(loop);
}
loop();