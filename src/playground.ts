type LabId = 'map' | 'planet' | 'game';
type ValueControl = HTMLElement & { value: string | number };
type CheckControl = HTMLElement & { checked: boolean };
type ProgressControl = HTMLElement & { set: (value: number, jump?: boolean) => void };

export const playgroundMarkup = `
<section class="playground-section wrap" id="playground">
  <div class="section-top"><div><p class="eyebrow">A LITTLE ROOM FOR PLAY</p><h2>给灵感，<span class="hand-underline">调个味。</span></h2></div><p class="section-aside">这里的小家伙都能动手玩。<br>调一份属于你的创作配方。</p></div>
  <form id="idea-form" class="idea-form" aria-label="灵感配方">
    <div class="toy-grid">
      <div class="toy"><div class="toy-label"><span>01</span><h3>给灵感起个名字</h3></div><hose-input id="idea-name" name="idea" label="灵感名字" placeholder="写下你的奇思妙想" value="周末小宇宙" maxlength="16"></hose-input><p class="toy-hint">写几个字，让钢笔陪你热身。</p></div>
      <div class="toy"><div class="toy-label"><span>02</span><h3>选一个造物方向</h3></div><hose-radio id="idea-world" name="world" label="造物方向"><option value="map" selected>地图</option><option value="planet">星球</option><option value="game">游戏</option></hose-radio><p class="toy-hint">叫醒一个，看看它会带你去哪里。</p></div>
      <div class="toy"><div class="toy-label"><span>03</span><h3><label for="inspiration-range">灵感温度</label></h3></div><div class="thermometer-control"><hose-progress id="explore-progress" label="灵感温度示意" aria-hidden="true"></hose-progress><input id="inspiration-range" name="inspiration" type="range" min="0" max="100" step="1" value="60" aria-describedby="temperature-hint"></div><p class="toy-hint" id="temperature-hint">拖动水银，调到 <output id="temperature-value" for="inspiration-range">60</output>% 热爱。</p></div>
      <div class="toy"><div class="toy-label"><span>04</span><h3>给咖啡加点音量</h3></div><hose-slider id="coffee-slider" name="coffee" label="咖啡浓度" min="0" max="5" step="1" value="2"></hose-slider><p class="toy-hint">拖动长号：<output id="coffee-value">2</output> 格精神，刚刚好。</p></div>
      <div class="toy"><div class="toy-label"><span>05</span><h3>加一点不按常理</h3></div><hose-checkbox id="idea-surprise" name="surprise" label="加入奇思妙想"></hose-checkbox><p class="toy-hint" id="surprise-status">勾一下，给配方加一个意外。</p></div>
      <div class="toy"><div class="toy-label"><span>06</span><h3>给今天的好奇心打分</h3></div><hose-rating id="curiosity-rating" name="stars" label="好奇心评分" value="0"></hose-rating><p class="toy-hint" id="rating-status" role="status">点亮星星，记录此刻的心情。</p></div>
    </div>
    <div class="idea-recipe"><div><span class="eyebrow">YOUR LITTLE RECIPE</span><h3 id="recipe-title">周末小宇宙</h3><p id="recipe-description">做一张标记私藏地点的地图。</p><p class="recipe-meta" id="recipe-meta">60% 灵感 · 咖啡浓度 2 · 开始动手</p></div><button type="button" class="button button-red" id="recipe-jump">去地图实验找灵感 ↗</button></div>
  </form>
</section>`;

export function initPlayground(settle: () => void, selectLab: (id: LabId) => void) {
  const form = document.querySelector<HTMLFormElement>('#idea-form')!;
  const name = document.querySelector<ValueControl>('#idea-name')!;
  const world = document.querySelector<ValueControl>('#idea-world')!;
  const coffee = document.querySelector<ValueControl>('#coffee-slider')!;
  const surprise = document.querySelector<CheckControl>('#idea-surprise')!;
  const rating = document.querySelector<ValueControl>('#curiosity-rating')!;
  const temperature = document.querySelector<HTMLInputElement>('#inspiration-range')!;
  const progress = document.querySelector<ProgressControl>('#explore-progress')!;
  const descriptions = {
    map: ['做一张标记私藏地点的地图。', '做一张藏着秘密宝箱的城市地图。'],
    planet: ['为一颗迷你星球配色，寻找你的宇宙。', '造一颗用咖啡当海洋、甜甜圈当星环的星球。'],
    game: ['做一个收集灵感芯片的跳跃小游戏。', '做一个重力会倒转、云朵可以踩的平台游戏。'],
  };
  const labels = { map: '地图', planet: '星球', game: '游戏' };
  function update() {
    const id = world.value as LabId;
    const degree = temperature.valueAsNumber;
    progress.set(degree / 100, true);
    temperature.setAttribute('aria-valuetext', `${degree}% 灵感`);
    document.querySelector('#temperature-value')!.textContent = String(degree);
    document.querySelector('#coffee-value')!.textContent = String(coffee.value);
    document.querySelector('#surprise-status')!.textContent = surprise.checked ? '已加入奇思妙想，配方有点不一样了。' : '勾一下，给配方加一个意外。';
    document.querySelector('#rating-status')!.textContent = Number(rating.value) > 0 ? `${rating.value} 颗星！这份好奇心，留在本次漫游里。` : '点亮星星，记录此刻的心情。';
    document.querySelector('#recipe-title')!.textContent = String(name.value).trim() || '还没取名的小灵感';
    document.querySelector('#recipe-description')!.textContent = descriptions[id][surprise.checked ? 1 : 0];
    document.querySelector('#recipe-meta')!.textContent = `${degree}% 灵感 · 咖啡浓度 ${coffee.value} · ${degree < 34 ? '慢慢酝酿' : degree < 67 ? '开始动手' : '大胆开造'}`;
    document.querySelector('#recipe-jump')!.textContent = `去${labels[id]}实验找灵感 ↗`;
    settle();
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  document.querySelector('#recipe-jump')!.addEventListener('click', () => {
    selectLab(world.value as LabId);
    document.querySelector('.lab-folder')!.scrollIntoView({ block: 'start' });
    document.querySelector<HTMLElement>('#lab-tabs')!.focus({ preventScroll: true });
  });
  update();
}
