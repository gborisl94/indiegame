const c = document.getElementById('c');
const ctx = c.getContext('2d');
c.width = innerWidth;
c.height = innerHeight;

let pImg = new Image(); pImg.src = 'player.png';
let eImg = new Image(); eImg.src = 'enemies.png';

let px = c.width/2, py = c.height/2, ang = 0;
let enemies = [];
for(let i=0;i<6;i++) enemies.push({x:Math.random()*c.width, y:Math.random()*c.height, t:Math.floor(Math.random()*4)});
let bullets = [];
let score = 0;

function loop(){
  // Fond Miami grid
  ctx.fillStyle = '#130a26';
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = '#2a1a4a';
  ctx.lineWidth = 1;
  for(let x=0;x<c.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();}
  for(let y=0;y<c.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();}

  // Player MUGEN
  ctx.save();
  ctx.translate(px,py);
  ctx.rotate(ang + Math.PI/2);
  if(pImg.complete && pImg.naturalWidth>0){
    // prend la 1ere pose du sprite sheet
    ctx.drawImage(pImg, 0,0, pImg.width/4, pImg.height, -35,-35,70,70);
  }else{
    ctx.fillStyle='#ff2a9a'; ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  // Enemies MUGEN
  enemies.forEach(en=>{
    let dx = px-en.x, dy = py-en.y, d = Math.hypot(dx,dy);
    en.x += dx/d*1.2;
    en.y += dy/d*1.2;
    ctx.save();
    ctx.translate(en.x,en.y);
    if(eImg.complete && eImg.naturalWidth>0){
      let w = eImg.width/4;
      ctx.drawImage(eImg, en.t*w, 0, w, eImg.height, -30,-30,60,60);
    }else{
      ctx.fillStyle='#00ffea'; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    if(d<38){
      alert('GAME OVER! Score: '+score);
      score=0; enemies=[];
      for(let i=0;i<6;i++) enemies.push({x:Math.random()*c.width,y:Math.random()*c.height,t:Math.floor(Math.random()*4)});
    }
  });

  // Bullets
  bullets.forEach((b,i)=>{
    b.x+=Math.cos(b.a)*9; b.y+=Math.sin(b.a)*9;
    ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
    if(b.x<0||b.x>c.width||b.y<0||b.y>c.height){bullets.splice(i,1); return;}
    enemies.forEach((en,j)=>{
      if(Math.hypot(b.x-en.x,b.y-en.y)<30){
        enemies.splice(j,1); bullets.splice(i,1); score+=100;
        enemies.push({x:Math.random()<0.5?0:c.width,y:Math.random()*c.height,t:Math.floor(Math.random()*4)});
      }
    });
  });

  ctx.fillStyle='white'; ctx.font='bold 26px monospace';
  ctx.fillText('SCORE '+score, 20, 40);
  requestAnimationFrame(loop);
}
loop();

// Controls tactile Miami
c.addEventListener('touchmove', e=>{
  let t=e.touches[0]; ang=Math.atan2(t.clientY-py,t.clientX-px);
},{passive:false});
c.addEventListener('touchstart', e=>{
  let t=e.touches[0]; ang=Math.atan2(t.clientY-py,t.clientX-px);
  bullets.push({x:px,y:py,a:ang});
});