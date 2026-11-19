import './style.css';
import { star, mascot, mapArt, planetArt, gameArt } from './art';
import { profile } from './profile';
import { initHoseControls } from './hose-controls';
import { motionControlMarkup } from './motion-controls';
import { portfolioMarkup, portfolioProjects } from './portfolio';
import brandSvg from './assets/chency-logo.svg?raw';
import { initGreeting } from './greeting';
import { catScene, catControls, initCat } from './cat';
import { notesSectionMarkup, initNotes } from './notes';
import { initMusic } from './music';
import { initBackToTop } from './back-top';
import { skillCardsMarkup, signatureMarkup, contactEnvelopeIcon } from './personal-details';

const arrow = '<span aria-hidden="true">↗</span>';
const brandLogo = brandSvg.replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
const greeting = 'Hello, world!';
const greetingLetters = Array.from(greeting).map((letter, index) => `<span class="speech-letter" style="--letter:${index}">${letter}</span>`).join('');
const labInfo = {
  map: { title: '城市漫游', subtitle: 'WEBGIS / CITY EXPLORER' },
  planet: { title: '造一颗小星球', subtitle: 'THREE.JS / PLANET STUDIO' },
  game: { title: '像素出逃计划', subtitle: 'GAME / PIXEL ADVENTURE' },
};
type LabId = keyof typeof labInfo;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="home-view">
<header class="site-header wrap">
  <span class="wordmark brand-logo music-logo-slot" aria-hidden="true"></span>
  <nav aria-label="主导航"><a href="#about">关于我</a><a href="#works">作品 <span class="nav-count">${portfolioProjects.length}</span></a><a href="#notes">开发手记</a></nav>
  <a class="header-hello" href="#contact">打个招呼 ${arrow}</a>
</header>
<main>
  <section class="hero wrap">
    <div class="hero-copy">
      <div class="eyebrow"><span class="tiny-star">✳</span> WELCOME TO MY LITTLE INTERNET CORNER</div>
      <h1 id="hello" tabindex="-1"><span>Hey, I'm</span><br><span class="hero-name">chency<span class="name-dot">.</span></span></h1>
      <div class="hero-role"><span class="role-line"></span> 全栈工程师 <span class="role-cross">×</span> 数字世界造物者</div>
      <p class="hero-description">写前端，搭后端，打磨视觉体验，也做有趣的游戏。<br>在界面、服务与玩法之间，把想法一点点做出来。</p>
      <div class="hero-actions"><a class="button button-red" href="#works">漫游 AI 实验室 <span aria-hidden="true">↗</span></a><a class="text-link" href="#about">认识一下 <span aria-hidden="true">↓</span></a></div>
      <div class="hero-footnote"><span class="status-dot"></span> 好奇心在线，持续创造中 <span class="hero-footnote-code">&lt; / &gt;</span></div>
      <div class="hero-equations" aria-hidden="true">
        <math><mrow><mo>∇</mo><mo>·</mo><mi mathvariant="bold">E</mi><mo>=</mo><mfrac><mi>ρ</mi><msub><mi>ε</mi><mn>0</mn></msub></mfrac></mrow></math>
        <math><mrow><mo>∇</mo><mo>·</mo><mi mathvariant="bold">B</mi><mo>=</mo><mn>0</mn></mrow></math>
        <math><mrow><mo>∇</mo><mo>×</mo><mi mathvariant="bold">E</mi><mo>=</mo><mo>−</mo><mfrac><mrow><mo>∂</mo><mi mathvariant="bold">B</mi></mrow><mrow><mo>∂</mo><mi>t</mi></mrow></mfrac></mrow></math>
        <math><mrow><mo>∇</mo><mo>×</mo><mi mathvariant="bold">B</mi><mo>=</mo><msub><mi>μ</mi><mn>0</mn></msub><mi mathvariant="bold">J</mi><mo>+</mo><msub><mi>μ</mi><mn>0</mn></msub><msub><mi>ε</mi><mn>0</mn></msub><mfrac><mrow><mo>∂</mo><mi mathvariant="bold">E</mi></mrow><mrow><mo>∂</mo><mi>t</mi></mrow></mfrac></mrow></math>
      </div>
    </div>
    <div class="hero-art">
      <div class="portrait-stage">
      <div class="art-sticker">100% HUMAN<br><span>90% COFFEE</span></div>
      <div class="speech-bubble"><span class="speech-label">${greeting}</span><span class="speech-typewriter" aria-hidden="true">${greetingLetters}</span> <span class="speech-spark" aria-hidden="true">✦</span></div>
      ${mascot}
      ${catScene}
      <span class="art-caption">a developer with a playful soul.</span>
      </div>
      ${catControls}
    </div>
    <div class="hero-bottom"><span>代码之外，还有整个世界。</span><a href="#works" aria-label="向下探索作品">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a>${motionControlMarkup('motion-switch')}</div>
  </section>
  <div class="ribbon-shell"><div class="skill-ribbon" aria-label="技术方向"><div class="ribbon-inner"><span>FULL STACK</span>${star}<span>FRONTEND</span>${star}<span>BACKEND</span>${star}<span>GOLANG</span>${star}<span>JAVA</span>${star}<span>THREE.JS</span>${star}<span>GODOT</span>${star}</div></div></div>
  ${portfolioMarkup}
  <section class="lab-section wrap" id="lab">
    <div class="section-top"><div><p class="eyebrow">SMALL EXPERIMENTS, BIG CURIOSITY</p><h2>想法不止于<span class="hand-underline">想想。</span></h2></div><p class="section-aside">欢迎来到我的数字游乐场。<br>每个小作品，都可以点开玩一玩。</p></div>
    <div class="lab-folder">
      <hose-tabs id="lab-tabs" label="选择实验室"><option value="map" selected>地图</option><option value="planet">星球</option><option value="game">游戏</option></hose-tabs>
      <div class="lab-showcase" id="lab-results">
      <article class="project-card" data-project="map" role="tabpanel" aria-label="城市漫游"><button class="project-open" data-lab="map" aria-label="打开城市漫游地图实验"><div class="project-art map-preview">${mapArt}<span class="project-badge">INTERACTIVE MAP</span><span class="preview-open" aria-hidden="true">↗</span></div><div class="project-body"><div class="project-tags"><span>WebGIS</span><span>OpenLayers</span></div><h3>城市漫游 <span aria-hidden="true">↗</span></h3><p>换个视角，发现地图上的小美好。</p><p class="preview-summary">把西湖装进浏览器，拖动地图去散步。找一个喜欢的地点，看看它在世界上的坐标。</p><div class="preview-features"><span>↗ 自由缩放</span><span>◎ 坐标拾取</span><span>≋ 地点筛选</span></div><div class="project-meta"><span>地图探索 · 图层筛选 · 坐标拾取</span><span>进入实验 ↗</span></div></div></button></article>
      <article class="project-card" data-project="planet" role="tabpanel" aria-label="造一颗小星球" hidden><button class="project-open" data-lab="planet" aria-label="打开造一颗小星球实验"><div class="project-art planet-preview">${planetArt}<span class="project-badge">A TINY UNIVERSE</span><span class="preview-open" aria-hidden="true">↗</span></div><div class="project-body"><div class="project-tags"><span>Three.js</span><span>WebGL</span></div><h3>造一颗小星球 <span aria-hidden="true">↗</span></h3><p>宇宙很大，这一颗由你定义。</p><p class="preview-summary">转动、靠近，再换一组颜色。从光影到三角网格，亲手摆弄属于你的迷你宇宙。</p><div class="preview-features"><span>↻ 轨道环绕</span><span>◈ 材质切换</span><span>✳ 星球配色</span></div><div class="project-meta"><span>轨道控制 · 材质切换 · 自由配色</span><span>进入实验 ↗</span></div></div></button></article>
      <article class="project-card" data-project="game" role="tabpanel" aria-label="像素出逃计划" hidden><button class="project-open" data-lab="game" aria-label="打开像素出逃计划小游戏"><div class="project-art game-preview">${gameArt}<span class="project-badge">JUST ONE MORE TRY</span><span class="preview-open" aria-hidden="true">↗</span></div><div class="project-body"><div class="project-tags"><span>游戏开发</span><span>Web 原型</span></div><h3>像素出逃计划 <span aria-hidden="true">↗</span></h3><p>收集灵感碎片，跳出日常的框框。</p><p class="preview-summary">左右移动，找准时机跳起来。收齐五枚灵感芯片，给日常来一场小小的像素出逃。</p><div class="preview-features"><span>← → 移动</span><span>↑ 空格跳跃</span><span>✦ 收集芯片</span></div><div class="project-meta"><span>Godot 灵感 · 像素冒险 · 键盘 / 触屏</span><span>进入实验 ↗</span></div></div></button></article>
    </div>
    </div>
    <p class="lab-footer"><span aria-hidden="true">✳</span> 不一定改变世界，但一定有点意思。 <span class="lab-visited">本次探索 <b id="explore-count">0</b> / 3 <span id="explore-status" role="status"></span></span></p>
  </section>
  <section class="about-section" id="about"><div class="wrap about-grid">
    <div class="about-label"><p class="eyebrow">THE HUMAN BEHIND THE CODE</p><h2>代码是理性的。<br>我<span class="red">不完全是。</span></h2><span class="about-doodle" aria-hidden="true">{ <span>☺</span> }</span></div>
    <div class="about-content"><p class="about-intro">嗨，我是 chency，<br>一个喜欢<span class="highlight">把想法做成产品</span>的全栈工程师。</p><p>我习惯从用户看到的界面开始，一路做到服务端、数据层和部署流程。用 TypeScript、Three.js 做交互，用 Go 和 Java 把稳定、清晰的服务搭起来。</p><p>空间应用、可视化、Godot 像素世界，都是我的实验场。比起「这个能不能做」，我更喜欢把它做出来，再问「这个能有多好玩」。</p>${skillCardsMarkup}${signatureMarkup}</div>
  </div></section>
  ${notesSectionMarkup}
  <section class="contact-section" id="contact"><div class="wrap contact-grid"><div><p class="eyebrow">GOOD THINGS START WITH A HELLO</p><h2>Let's make<br>something <span>fun.</span>${star}</h2><p>关于产品、代码、游戏，或者一个天马行空的想法。<br>好玩的事，总值得聊一聊。</p><div id="contact-links"></div></div><div class="hello-machine"><span class="hello-caption">按下红按钮，烤一片今日好运 ↓</span><div class="hello-duo"><hose-button id="hello-button">向 chency 打招呼</hose-button><hose-toast id="hello-toast" duration="0" stay></hose-toast></div><p id="hello-response" role="status">一声 Hello，也是故事的开始。</p><div class="hello-tools"><span class="tiny-label">PRESS. POP. SMILE.</span><button class="toast-dismiss" type="button" hidden>收起吐司 ×</button></div></div></div></section>
</main>
<footer class="site-footer wrap"><a class="wordmark brand-logo" href="#" aria-label="chency 首页">${brandLogo}</a><span>© ${new Date().getFullYear()} chency · 用代码和好奇心搭建</span><a href="https://github.com/finktheartist/rubber-hose-ui" target="_blank" rel="noopener noreferrer">Inspired by Rubber Hose UI ${arrow}</a></footer>
<dialog class="lab-dialog" id="lab-dialog" aria-labelledby="lab-title"><div class="dialog-header"><div><p class="eyebrow" id="lab-subtitle"></p><h2 id="lab-title"></h2></div><button class="close-dialog" aria-label="关闭实验室" autofocus>×</button></div><div id="lab-content"></div></dialog>
</div><div id="article-view" hidden inert></div>`;

const contactLinks = document.querySelector<HTMLDivElement>('#contact-links')!;
if (profile.email || profile.github) {
  for (const [label, href] of [[`${profile.email} ↗`, profile.email ? `mailto:${profile.email}` : ''], ['GitHub ↗', profile.github]]) {
    if (!href) continue;
    const link = document.createElement('a');
    link.className = 'button button-dark'; link.href = href;
    if (href.startsWith('mailto:')) {
      link.classList.add('contact-email');
      link.innerHTML = contactEnvelopeIcon;
      const address = document.createElement('span');
      address.className = 'contact-address';
      address.textContent = profile.email;
      const arrowIcon = document.createElement('span');
      arrowIcon.className = 'email-arrow';
      arrowIcon.setAttribute('aria-hidden', 'true');
      arrowIcon.textContent = '↗';
      link.append(address, arrowIcon);
    } else link.textContent = label;
    contactLinks.append(link);
  }
} else {
  contactLinks.innerHTML = '<span class="contact-note">联系方式还在整理中，先在这里认识一下。</span>';
}

const { markLabExplored } = initHoseControls();
initGreeting();
initCat();
initMusic();
initBackToTop();

const labDialog = document.querySelector<HTMLDialogElement>('#lab-dialog')!;
const labContent = document.querySelector<HTMLDivElement>('#lab-content')!;
let disposeLab: (() => void) | undefined;
let loadVersion = 0;
const loadLab = {
  map: () => import('./labs/map'),
  planet: () => import('./labs/planet'),
  game: () => import('./labs/game'),
};
document.querySelectorAll<HTMLButtonElement>('[data-lab]').forEach(button => button.addEventListener('click', async () => {
  const id = button.dataset.lab as LabId;
  const version = ++loadVersion;
  document.querySelector('#lab-title')!.textContent = labInfo[id].title;
  document.querySelector('#lab-subtitle')!.textContent = labInfo[id].subtitle;
  labContent.innerHTML = '<p class="lab-loading" role="status">正在打开实验…</p>';
  labDialog.showModal();
  try {
    const module = await loadLab[id]();
    if (version !== loadVersion || !labDialog.open) return;
    disposeLab = module.mount(labContent);
    markLabExplored(id);
  } catch (error) {
    if (version !== loadVersion || !labDialog.open) return;
    labContent.innerHTML = '<div class="lab-loading"><p>实验暂时没能打开。请关闭后重试，或刷新页面。</p></div>';
    console.error('Unable to open lab', error);
  }
}));
labDialog.addEventListener('close', () => { loadVersion++; disposeLab?.(); disposeLab = undefined; labContent.replaceChildren(); });
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

initNotes();
