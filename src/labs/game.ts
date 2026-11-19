interface Platform {x:number;y:number;width:number}
interface Chip {x:number;y:number;collected:boolean}

export function mount(root:HTMLElement):()=>void {
  root.innerHTML=`<div class="lab-controls"><span id="game-score" class="game-status" role="status">灵感碎片 0 / 5 · 准备出发</span><button id="game-toggle">开始游戏 ▷</button><button id="game-reset" class="control-spacer">重新开始 ↺</button></div><div class="game-stage"><canvas width="900" height="430" tabindex="0" role="img" aria-label="像素平台游戏：方向键或 A D 移动，空格或 W 跳跃，收集五枚芯片"></canvas></div><div class="game-touch-controls"><button data-key="left" aria-label="向左移动">←</button><button data-key="right" aria-label="向右移动">→</button><span class="game-help">← → / A D 移动<br>空格 / W 跳跃</span><button data-key="jump" class="jump-button">跳跃 ↑</button></div><p class="lab-description">收集全部 <strong>5 枚灵感碎片</strong>，完成出逃计划。点击「开始游戏」后操作；随时可以暂停。<br>Godot 开发思路启发的 Canvas 小游戏原型 · 所有图形由代码绘制。</p>`;
  const canvas=root.querySelector<HTMLCanvasElement>('canvas')!;
  const ctx=canvas.getContext('2d')!;
  const score=root.querySelector('#game-score')!;
  const toggle=root.querySelector<HTMLButtonElement>('#game-toggle')!;
  const platforms:Platform[]=[{x:0,y:407,width:900},{x:100,y:330,width:170},{x:310,y:255,width:170},{x:520,y:180,width:170},{x:730,y:105,width:145}];
  let player={x:35,y:369,vx:0,vy:0,grounded:true,facing:1};
  let chips:Chip[]=[];
  const keys=new Set<string>();
  let running=false,won=false,disposed=false,raf=0,last=0,jumpHeld=false;
  function makeChips(){return[{x:180,y:304},{x:390,y:229},{x:600,y:154},{x:795,y:79},{x:849,y:381}].map(p=>({...p,collected:false}));}
  chips=makeChips();
  function announce(){const count=chips.filter(c=>c.collected).length;score.textContent=`灵感碎片 ${count} / 5${won?' · 出逃成功！':running?' · 探索中':' · 已暂停'}`;toggle.textContent=won?'再玩一次 ↺':running?'暂停游戏 Ⅱ':'继续游戏 ▷';}
  function clearKeys(){keys.clear();jumpHeld=false;}
  function reset(){player={x:35,y:369,vx:0,vy:0,grounded:true,facing:1};chips=makeChips();won=false;running=true;clearKeys();announce();canvas.focus();}
  toggle.addEventListener('click',()=>{if(won)reset();else{running=!running;clearKeys();announce();if(running)canvas.focus();}});
  root.querySelector('#game-reset')!.addEventListener('click',reset);
  function mapped(code:string){if(['ArrowLeft','KeyA'].includes(code))return'left';if(['ArrowRight','KeyD'].includes(code))return'right';if(['Space','KeyW','ArrowUp'].includes(code))return'jump';return undefined;}
  const keydown=(event:KeyboardEvent)=>{const key=mapped(event.code);if(!key)return;event.preventDefault();if(running)keys.add(key);};
  const keyup=(event:KeyboardEvent)=>{const key=mapped(event.code);if(key){event.preventDefault();keys.delete(key);}};
  canvas.addEventListener('keydown',keydown);canvas.addEventListener('keyup',keyup);canvas.addEventListener('blur',clearKeys);
  root.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();if(running){keys.add(button.dataset.key!);button.setPointerCapture(event.pointerId);}});
    const release=()=>keys.delete(button.dataset.key!);
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  const pause=()=>{if(running){running=false;clearKeys();announce();}};
  const visibility=()=>{if(document.hidden)pause();};
  document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',pause);
  function update(dt:number){
    if(!running||won)return;
    player.vx=(Number(keys.has('right'))-Number(keys.has('left')))*235;
    if(player.vx)player.facing=player.vx>0?1:-1;
    if(keys.has('jump')&&!jumpHeld&&player.grounded){player.vy=-560;player.grounded=false;}
    jumpHeld=keys.has('jump');
    const oldBottom=player.y+38;
    player.vy+=1350*dt;player.x=Math.max(0,Math.min(876,player.x+player.vx*dt));player.y+=player.vy*dt;player.grounded=false;
    if(player.vy>=0) for(const p of platforms){if(player.x+24>p.x&&player.x<p.x+p.width&&oldBottom<=p.y+1&&player.y+38>=p.y){player.y=p.y-38;player.vy=0;player.grounded=true;break;}}
    chips.forEach(chip=>{if(!chip.collected&&Math.abs(player.x+12-chip.x)<27&&Math.abs(player.y+19-chip.y)<31){chip.collected=true;if(chips.every(c=>c.collected)){won=true;running=false;clearKeys();}announce();}});
  }
  function cloud(x:number,y:number){ctx.fillStyle='#e8f0e9';ctx.fillRect(x,y,75,15);ctx.fillRect(x+16,y-13,35,15);}
  function drawChip(chip:Chip){ctx.fillStyle='#866e35';ctx.fillRect(chip.x-10,chip.y-6,20,13);ctx.fillRect(chip.x-6,chip.y-10,12,21);ctx.fillStyle='#f8d472';ctx.fillRect(chip.x-7,chip.y-5,14,10);ctx.fillRect(chip.x-4,chip.y-8,8,16);ctx.fillStyle='#fff0aa';ctx.fillRect(chip.x-3,chip.y-5,4,5);}
  function draw(time:number){
    ctx.fillStyle='#b8cee0';ctx.fillRect(0,0,900,430);cloud(65,58);cloud(360,85);cloud(655,40);
    ctx.fillStyle='#a3b8a0';ctx.fillRect(0,310,900,120);for(let i=0;i<9;i++)ctx.fillRect(i*117,260-(i%3)*24,83,170);
    ctx.fillStyle='#8da58b';for(let i=0;i<12;i++)ctx.fillRect(i*90,333-(i%4)*15,65,100);
    platforms.forEach(p=>{ctx.fillStyle='#56624c';ctx.fillRect(p.x,p.y,p.width,p.y>400?23:17);ctx.fillStyle='#e9c66b';ctx.fillRect(p.x,p.y,p.width,6);ctx.fillStyle='#424e40';for(let x=p.x+8;x<p.x+p.width-8;x+=22)ctx.fillRect(x,p.y+11,9,4);});
    chips.filter(c=>!c.collected).forEach(drawChip);
    ctx.save();ctx.translate(Math.round(player.x)+12,Math.round(player.y));ctx.scale(player.facing,1);
    const walk=running&&player.grounded&&player.vx?Math.floor(time/110)%2:0;
    ctx.fillStyle='#29382f';ctx.fillRect(-12,0,25,11);ctx.fillRect(-15,4,8,10);
    ctx.fillStyle='#f7d0a0';ctx.fillRect(-9,10,22,12);ctx.fillStyle='#29382f';ctx.fillRect(7,11,4,5);
    ctx.fillStyle='#dc5239';ctx.fillRect(-12,22,24,11);ctx.fillStyle='#f7d0a0';ctx.fillRect(-16,23,5,8);
    ctx.fillStyle='#29382f';ctx.fillRect(-12-walk*3,33,10,5);ctx.fillRect(5+walk*3,33,10,5);ctx.restore();
    ctx.fillStyle='#344e50';ctx.font='bold 12px monospace';ctx.fillText('CHENCY / PIXEL ADVENTURE',20,26);
    if(!running){ctx.fillStyle='#273e46b8';ctx.fillRect(0,0,900,430);ctx.fillStyle='#fff2d2';ctx.textAlign='center';ctx.font='bold 31px sans-serif';ctx.fillText(won?'灵感集齐，出逃成功！':'准备好，跳出日常。',450,193);ctx.font='16px sans-serif';ctx.fillText(won?'好奇心永远是下一关的通行证。':'点击上方按钮开始，用方向键和空格探索。',450,229);ctx.textAlign='left';}
  }
  function tick(time:number){if(disposed)return;const dt=Math.min((time-last)/1000,.032);last=time;update(dt);draw(time);raf=requestAnimationFrame(tick);}
  raf=requestAnimationFrame(tick);
  return()=>{disposed=true;cancelAnimationFrame(raf);clearKeys();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',pause);canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('keyup',keyup);canvas.removeEventListener('blur',clearKeys);};
}
