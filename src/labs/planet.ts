import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './hose-lab-controls.css';
import { settleHoseControls } from '../motion-controls';

type HoseRadio = HTMLElement & { value: string };
type HoseCheckbox = HTMLElement & { checked: boolean; disabled: boolean };

export function mount(root:HTMLElement):()=>void {
  root.innerHTML=`<div class="planet-settings"><fieldset><legend>星球配色</legend><hose-radio id="planet-color" name="planet-palette" label="星球配色"><option value="coral" selected>日落橘</option><option value="mint">薄荷绿</option><option value="violet">星云紫</option></hose-radio></fieldset><div><span class="planet-wire-label">看看星球的几何骨架</span><div class="planet-wire-control"><hose-checkbox id="planet-wire" name="planet-wireframe" label="显示星球线框"></hose-checkbox><div class="planet-wire-state"><strong id="planet-wire-state">实体着色</strong><span>勾选后，查看真实三角网格。</span></div></div><p class="planet-material-state" id="planet-material-state" role="status">当前：日落橘 · 实体着色</p></div></div><div class="lab-controls"><button id="planet-spin">暂停自转</button><button id="planet-left" aria-label="向左旋转星球">←</button><button id="planet-right" aria-label="向右旋转星球">→</button><button id="planet-reset" class="control-spacer">重置视角 ↺</button></div><div class="lab-stage planet-stage"><span class="planet-label">YOUR TINY UNIVERSE / EST. RIGHT NOW</span></div><p class="lab-description">拖动旋转视角，滚轮 / 双指缩放。试试换个颜色，或打开线框看看它的骨架。<br><strong>真实 Three.js 三维渲染 · 程序化顶点配色 · 没有远程贴图。</strong></p>`;
  const stage=root.querySelector<HTMLDivElement>('.planet-stage')!;
  let renderer:THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}
  catch {stage.innerHTML='<p class="planet-fallback">这颗星球需要 WebGL 才能亮起来。<br>请在支持 WebGL 的浏览器中打开，并开启硬件加速。</p>';root.querySelectorAll('button,hose-radio,hose-checkbox').forEach(el=>{el.setAttribute('disabled','');el.shadowRoot?.querySelectorAll('input').forEach(input=>input.disabled=true);});return()=>{};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor('#252d35');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','可交互三维星球，拖动旋转或使用上方方向按钮');canvas.setAttribute('role','img');stage.prepend(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,100);
  camera.position.set(0,1.8,7.5);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=4.2;controls.maxDistance=12;
  const system=new THREE.Group();system.rotation.z=.17;scene.add(system);
  const sphereGeometry=new THREE.SphereGeometry(1.34,64,40);
  const colors=new Float32Array(sphereGeometry.attributes.position.count*3);
  sphereGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83,metalness:.05});
  const sphere=new THREE.Mesh(sphereGeometry,material);system.add(sphere);
  const palettes:Record<string,[string,string]>={coral:['#ed805f','#eecb8e'],mint:['#508f89','#acd0a0'],violet:['#8366b7','#d9b6d1']};
  const paletteLabels:Record<string,string>={coral:'日落橘',mint:'薄荷绿',violet:'星云紫'};
  let currentPalette='coral';
  const paletteControl=root.querySelector<HoseRadio>('#planet-color')!;
  const wireControl=root.querySelector<HoseCheckbox>('#planet-wire')!;
  const wireState=root.querySelector('#planet-wire-state')!;
  const materialState=root.querySelector('#planet-material-state')!;
  function updateMaterialState() {
    const appearance=material.wireframe?'线框模式':'实体着色';
    wireState.textContent=appearance;
    materialState.textContent=`当前：${paletteLabels[currentPalette]} · ${appearance}`;
  }
  function colorPlanet(name:string) {
    if(!Object.hasOwn(palettes,name))return;
    const [a,b]=palettes[name];const c1=new THREE.Color(a),c2=new THREE.Color(b),color=new THREE.Color();
    const positions=sphereGeometry.attributes.position;
    for(let i=0;i<positions.count;i++) {const y=positions.getY(i),x=positions.getX(i),z=positions.getZ(i);const bands=Math.sin(y*13+Math.sin(x*3+z*2)*.8);color.copy(c1).lerp(c2,THREE.MathUtils.smoothstep(bands,-.5,.7));color.toArray(colors,i*3);}
    sphereGeometry.attributes.color.needsUpdate=true;
    currentPalette=name;
    updateMaterialState();
  }
  colorPlanet('coral');
  const ringGeometry=new THREE.RingGeometry(1.7,2.32,100);
  const ringMaterial=new THREE.MeshStandardMaterial({color:'#e7c475',side:THREE.DoubleSide,roughness:1});
  const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.rotation.x=-Math.PI/2+.18;system.add(ring);
  const thinRingGeometry=new THREE.RingGeometry(2.4,2.44,100);
  const thinRing=new THREE.Mesh(thinRingGeometry,ringMaterial);thinRing.rotation.copy(ring.rotation);system.add(thinRing);
  const moonGeometry=new THREE.IcosahedronGeometry(.19,1);
  const moonMaterial=new THREE.MeshStandardMaterial({color:'#a6beb0',flatShading:true});
  const moon=new THREE.Mesh(moonGeometry,moonMaterial);moon.position.set(2.6,.9,.6);scene.add(moon);
  scene.add(new THREE.AmbientLight('#fff2d5',1.7));
  const light=new THREE.DirectionalLight('#fff2d5',3.2);light.position.set(-4,5,6);scene.add(light);
  const starsGeometry=new THREE.BufferGeometry();const stars=[];
  let seed=42;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<170;i++) stars.push((random()-.5)*25,(random()-.5)*17,-4-random()*12);
  starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  const starsMaterial=new THREE.PointsMaterial({color:'#f7eed8',size:.035,sizeAttenuation:true});
  scene.add(new THREE.Points(starsGeometry,starsMaterial));
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let spinning=!motion.matches&&!document.documentElement.classList.contains('motion-paused');
  let frame=0,last=0,disposed=false,contextLost=false;
  const spinButton=root.querySelector<HTMLButtonElement>('#planet-spin')!;
  function updateSpinLabel(){spinButton.textContent=spinning?'暂停自转':'开启自转';}
  updateSpinLabel();
  const handleMotion=()=>{if(motion.matches){spinning=false;updateSpinLabel();}};
  motion.addEventListener('change',handleMotion);
  spinButton.addEventListener('click',()=>{spinning=!spinning;updateSpinLabel();});
  paletteControl.addEventListener('change',()=>{colorPlanet(paletteControl.value);settleHoseControls();});
  wireControl.addEventListener('change',()=>{material.wireframe=wireControl.checked;updateMaterialState();settleHoseControls();});
  root.querySelector('#planet-left')!.addEventListener('click',()=>{system.rotation.y-=.35;});
  root.querySelector('#planet-right')!.addEventListener('click',()=>{system.rotation.y+=.35;});
  root.querySelector('#planet-reset')!.addEventListener('click',()=>{camera.position.set(0,1.8,7.5);controls.target.set(0,0,0);system.rotation.set(0,0,.17);controls.update();});
  const resize=()=>{const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);};
  const observer=new ResizeObserver(resize);observer.observe(stage);resize();
  function render(time:number){if(disposed)return;const dt=Math.min((time-last)/1000,.05);last=time;if(!document.hidden&&!contextLost){if(spinning&&!motion.matches&&!document.documentElement.classList.contains('motion-paused'))system.rotation.y+=dt*.23;controls.update();renderer.render(scene,camera);}frame=requestAnimationFrame(render);}
  const onContextLost=(event:Event)=>{event.preventDefault();contextLost=true;const message=document.createElement('p');message.className='planet-fallback';message.style.cssText='position:absolute;inset:0;background:#252d35';message.textContent='三维渲染连接已中断，请关闭实验后重新打开。';stage.append(message);};
  canvas.addEventListener('webglcontextlost',onContextLost);
  const onMotionChange=()=>settleHoseControls();
  window.addEventListener('motionchange',onMotionChange);
  const documentReady=document.readyState==='loading'?new Promise<void>(resolve=>document.addEventListener('DOMContentLoaded',()=>resolve(),{once:true})):Promise.resolve();
  void Promise.all([documentReady,customElements.whenDefined('hose-radio'),customElements.whenDefined('hose-checkbox')]).then(()=>{
    if(disposed)return;
    requestAnimationFrame(()=>{if(!disposed)settleHoseControls();});
  });
  frame=requestAnimationFrame(render);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();motion.removeEventListener('change',handleMotion);window.removeEventListener('motionchange',onMotionChange);canvas.removeEventListener('webglcontextlost',onContextLost);controls.dispose();sphereGeometry.dispose();material.dispose();ringGeometry.dispose();thinRingGeometry.dispose();ringMaterial.dispose();moonGeometry.dispose();moonMaterial.dispose();starsGeometry.dispose();starsMaterial.dispose();renderer.dispose();};
}
