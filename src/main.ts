import './style.css';
import { star, mascot, mapArt, planetArt, gameArt } from './art';
import { profile } from './profile';
import { initHoseControls } from './hose-controls';
import { playgroundMarkup } from './playground';
import { portfolioMarkup, portfolioProjects } from './portfolio';
import brandSvg from './assets/chency-logo.svg?raw';
import { initGreeting } from './greeting';

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
<header class="site-header wrap">
  <a class="wordmark brand-logo" href="#" aria-label="chency 首页">${brandLogo}</a>
  <nav aria-label="主导航"><a href="#about">关于我</a><a href="#works">作品 <span class="nav-count">${portfolioProjects.length}</span></a><a href="#notes">开发手记</a></nav>
  <a class="header-hello" href="#contact">打个招呼 ${arrow}</a>
</header>
<main>
  <section class="hero wrap">
    <div class="hero-copy">
      <div class="eyebrow"><span class="tiny-star">✳</span> WELCOME TO MY LITTLE INTERNET CORNER</div>
      <h1 id="hello" tabindex="-1"><span>Hey, I'm</span><br><span class="hero-name">chency<span class="name-dot">.</span></span></h1>
      <div class="hero-role"><span class="role-line"></span> 全栈工程师 <span class="role-cross">×</span> 数字世界造物者</div>
      <p class="hero-description">从界面到服务端，把想法做成能运行的产品。<br>写前端、搭后端、做空间应用，也造一点 3D 和游戏。</p>
      <div class="hero-actions"><a class="button button-red" href="#works">看看我的作品 <span aria-hidden="true">↗</span></a><a class="text-link" href="#about">认识一下 <span aria-hidden="true">↓</span></a></div>
      <div class="hero-footnote"><span class="status-dot"></span> 好奇心在线，持续创造中 <span class="hero-footnote-code">&lt; / &gt;</span></div>
    </div>
    <div class="hero-art">
      <div class="art-sticker">100% HUMAN<br><span>90% COFFEE</span></div>
      <div class="speech-bubble"><span class="speech-label">${greeting}</span><span class="speech-typewriter" aria-hidden="true">${greetingLetters}</span> <span class="speech-spark" aria-hidden="true">✦</span></div>
      ${mascot}
      <span class="art-caption">a developer with a playful soul.</span>
    </div>
    <div class="hero-bottom"><span>代码之外，还有整个世界。</span><a href="#works" aria-label="向下探索作品">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a><form class="motion-control" aria-label="页面动画设置"><div><strong>让灵感动起来</strong><span id="motion-state">动画已开启</span></div><hose-toggle id="motion-switch" label="页面动画" name="motion" checked></hose-toggle></form></div>
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
  ${playgroundMarkup}
  <section class="about-section" id="about"><div class="wrap about-grid">
    <div class="about-label"><p class="eyebrow">THE HUMAN BEHIND THE CODE</p><h2>代码是理性的。<br>我<span class="red">不完全是。</span></h2><span class="about-doodle" aria-hidden="true">{ <span>☺</span> }</span></div>
    <div class="about-content"><p class="about-intro">嗨，我是 chency，<br>一个喜欢<span class="highlight">把想法做成产品</span>的全栈工程师。</p><p>我习惯从用户看到的界面开始，一路做到服务端、数据层和部署流程。用 TypeScript、Three.js 做交互，用 Go 和 Java 把稳定、清晰的服务搭起来。</p><p>空间应用、可视化、Godot 像素世界，都是我的实验场。比起「这个能不能做」，我更喜欢把它做出来，再问「这个能有多好玩」。</p><div class="tech-stack"><span><b>↗</b> Full Stack</span><span><b>⌘</b> TypeScript</span><span><b>Go</b> Golang</span><span><b>♨</b> Java</span><span><b>△</b> Three.js</span><span><b>◇</b> Godot</span></div><div class="about-signature"><span>保持好奇，保持动手。</span><strong>chency</strong></div></div>
  </div></section>
  <section class="notes-section wrap" id="notes"><div class="section-top"><div><p class="eyebrow">NOTES FROM THE WORKBENCH</p><h2>写代码时，<span class="hand-underline">也写点想法。</span></h2></div><span class="section-aside">来自这三个实验的开发手记。</span></div>
    <div class="notes-list"><button class="note-row" data-note="map"><span class="note-tag">空间思考</span><h3>从经纬度到屏幕：一张交互地图的诞生</h3><span class="note-time">3 MIN READ</span><span class="note-arrow" aria-hidden="true">↗</span></button><button class="note-row" data-note="planet"><span class="note-tag">三维实验</span><h3>不用纹理贴图，也能造一颗有个性的星球</h3><span class="note-time">2 MIN READ</span><span class="note-arrow" aria-hidden="true">↗</span></button><button class="note-row" data-note="game"><span class="note-tag">游戏开发</span><h3>跳起来的那一刻：小小平台游戏的手感</h3><span class="note-time">3 MIN READ</span><span class="note-arrow" aria-hidden="true">↗</span></button></div>
  </section>
  <section class="contact-section" id="contact"><div class="wrap contact-grid"><div><p class="eyebrow">GOOD THINGS START WITH A HELLO</p><h2>Let's make<br>something <span>fun.</span>${star}</h2><p>关于产品、代码、游戏，或者一个天马行空的想法。<br>好玩的事，总值得聊一聊。</p><div id="contact-links"></div></div><div class="hello-machine"><span class="hello-caption">按下红按钮，烤一片今日好运 ↓</span><div class="hello-duo"><hose-button id="hello-button">向 chency 打招呼</hose-button><hose-toast id="hello-toast" duration="0" stay></hose-toast></div><p id="hello-response" role="status">一声 Hello，也是故事的开始。</p><div class="hello-tools"><span class="tiny-label">PRESS. POP. SMILE.</span><button class="toast-dismiss" type="button" hidden>收起吐司 ×</button></div></div></div></section>
</main>
<footer class="site-footer wrap"><a class="wordmark brand-logo" href="#" aria-label="chency 首页">${brandLogo}</a><span>© ${new Date().getFullYear()} chency · 用代码和好奇心搭建</span><a href="https://github.com/finktheartist/rubber-hose-ui" target="_blank" rel="noopener noreferrer">Inspired by Rubber Hose UI ${arrow}</a><a class="back-top" href="#" aria-label="返回顶部">↑</a></footer>
<dialog class="lab-dialog" id="lab-dialog" aria-labelledby="lab-title"><div class="dialog-header"><div><p class="eyebrow" id="lab-subtitle"></p><h2 id="lab-title"></h2></div><button class="close-dialog" aria-label="关闭实验室" autofocus>×</button></div><div id="lab-content"></div></dialog>
<dialog class="note-dialog" id="note-dialog" aria-labelledby="note-title"><div class="dialog-header"><span class="eyebrow">CHENCY / DEV NOTES</span><button class="close-dialog" aria-label="关闭开发手记" autofocus>×</button></div><div id="note-content"></div></dialog>`;

const contactLinks = document.querySelector<HTMLDivElement>('#contact-links')!;
if (profile.email || profile.github) {
  for (const [label, href] of [['写封邮件 ↗', profile.email ? `mailto:${profile.email}` : ''], ['GitHub ↗', profile.github]]) {
    if (!href) continue;
    const link = document.createElement('a');
    link.className = 'button button-dark'; link.textContent = label; link.href = href;
    contactLinks.append(link);
  }
} else {
  contactLinks.innerHTML = '<span class="contact-note">联系方式还在整理中，先在这里认识一下。</span>';
}

const { markLabExplored } = initHoseControls();
initGreeting();

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

const notes: Record<LabId, { title: string; body: string }> = {
  map: { title: '从经纬度到屏幕：一张交互地图的诞生', body: '<p>地图最有意思的地方，是它把抽象的数据变成了可以探索的空间。这次「城市漫游」从一份小小的本地矢量数据开始。</p><h3>先给坐标一个位置</h3><p>经纬度描述地球上的位置，屏幕却是平的。在 OpenLayers 中，fromLonLat 将经纬度转成 Web Mercator 坐标，toLonLat 则把点击的位置转回经纬度。投影是这两种世界之间的桥梁。</p><h3>图层，让信息有秩序</h3><p>湖面、道路和兴趣点分别承担不同角色：底图负责空间感，兴趣点负责交互。筛选只改变兴趣点的样式，不重建整张地图；点击地点后，用同一个数据对象更新说明卡片。</p><h3>一张可以离线探索的地图</h3><p>实验采用西湖周边的简化示意数据，不请求远程地图瓦片。它不是导航地图，但很适合展示缩放、拾取、分类和坐标转换。坐标和边界均为演示用途。</p><p class="note-end">下一步的想象：把 Go / Java 的空间查询服务接进来，让兴趣点真正来自实时数据。</p>' },
  planet: { title: '不用纹理贴图，也能造一颗有个性的星球', body: '<p>一个球体，一组颜色，再加一点光。没有贴图素材，也能让浏览器里出现一个小小的宇宙。</p><h3>从几何体开始</h3><p>这颗星球使用 Three.js 球体网格。根据顶点的高度和角度计算条纹，再将颜色写入顶点属性；球体的颜色层次由几何数据产生，无需下载图片。</p><h3>光比细节更重要</h3><p>环境光照亮暗部，方向光塑造体积。星环和小卫星提供尺度参照，让简单的球体看起来像一颗星球。拖动使用 OrbitControls，滚轮或双指可以调整观察距离。</p><h3>给探索留几个旋钮</h3><p>暖橘、薄荷和紫色三套配色，实体与线框两种表现，再加一个自转开关。线框会揭开平滑表象，让三角网格本身成为主角。</p><p class="note-end">有时，一个好玩的小实验，只需要让一个简单的想法被看见、被转动。</p>' },
  game: { title: '跳起来的那一刻：小小平台游戏的手感', body: '<p>「像素出逃计划」是一个受 Godot 开发思路启发的浏览器 Canvas 原型。规则很简单：跳上平台，收集五枚灵感芯片。</p><h3>每一帧，都有自己的职责</h3><p>输入层记录左右移动和跳跃，更新层计算速度、重力和碰撞，绘制层把最新状态画到画布上。把这三件事分开，和 Godot 中处理输入、物理更新、渲染的思路很接近。</p><h3>平台碰撞只看下降时刻</h3><p>当角色向下运动，并且脚底从平台上方跨过平台顶面，就让它着陆。只在下降阶段处理平台碰撞，角色才能从下方穿过，向上跳到更高的位置。</p><h3>浏览器里的时间也需要照顾</h3><p>切换标签页时暂停游戏，回来后重新开始计时，避免一帧过长让角色穿过地板。触屏按键与键盘共享同一套输入状态，松开或取消触摸时及时清除。</p><p class="note-end">真正的手感，藏在移动速度、重力和起跳力度这些小数字里。再来一次，往往就是最好的反馈。</p>' },
};
document.querySelectorAll<HTMLButtonElement>('[data-note]').forEach(button => button.addEventListener('click', () => {
  const note = notes[button.dataset.note as LabId];
  document.querySelector('#note-content')!.innerHTML = `<h2 id="note-title">${note.title}</h2><div class="note-prose">${note.body}</div>`;
  document.querySelector<HTMLDialogElement>('#note-dialog')!.showModal();
}));
