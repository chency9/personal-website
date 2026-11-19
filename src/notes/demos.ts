import { advanceAgent, approveAgent, buildBVH, comparePrecision, createAgentExecution, demoBoxes, resumeAgent, retrieveKnowledge, traceBVH } from './models';
import type { BVHNode } from './models';
import { escapeHtml } from './types';

export function mountNoteDemos(root: HTMLElement, signal: AbortSignal) {
  for (const element of root.querySelectorAll<HTMLElement>('[data-note-demo]')) {
    const kind = element.dataset.noteDemo;
    if (kind === 'precision') precisionDemo(element, signal);
    if (kind === 'bvh') bvhDemo(element, signal);
    if (kind === 'agent') agentDemo(element, signal);
    if (kind === 'rag') ragDemo(element, signal);
  }
}

function precisionDemo(element: HTMLElement, signal: AbortSignal) {
  element.innerHTML = `<div class="note-demo-heading"><span>动手验证 / FLOAT32</span><strong>同一段距离，两种上传方式</strong></div>
    <label class="note-control">世界坐标量级<select aria-label="世界坐标量级"><option value="6378137">地球赤道半径 · 6,378,137 m</option><option value="1000000">区域坐标 · 1,000,000 m</option><option value="1000">局部场景 · 1,000 m</option></select></label>
    <label class="note-control">点间距离 <output class="precision-distance"></output><input aria-label="点间距离（厘米）" type="range" min="0.5" max="100" step="0.5" value="5"></label>
    <div class="precision-chart"></div><div class="note-demo-stats" aria-live="polite"></div>
    <p class="note-demo-caption">使用 JavaScript 的 Math.fround 实际模拟单精度舍入。演示一维坐标分量，不是 GPU 性能测试；相对值在转 float32 前用双精度计算。</p>`;
  const slider = element.querySelector<HTMLInputElement>('input')!;
  const select = element.querySelector<HTMLSelectElement>('select')!;
  function render() {
    const offset = Number(slider.value) / 100;
    const result = comparePrecision(Number(select.value), offset);
    element.querySelector('.precision-distance')!.textContent = `${slider.value} cm`;
    const maximum = Math.max(offset, result.absolute, result.ulp) * 1.2;
    const position = (value: number) => 135 + value / maximum * 330;
    const rows = [{ label: '理想距离', value: offset, color: 'var(--muted)' }, { label: '绝对坐标先舍入', value: result.absolute, color: 'var(--red)' }, { label: '先转相对坐标', value: result.relative, color: 'var(--green)' }];
    element.querySelector('.precision-chart')!.innerHTML = `<svg viewBox="0 0 520 150" role="img" aria-label="理想距离、绝对坐标舍入与相对坐标的比较">${rows.map((row, index) => `<text x="4" y="${29 + index * 47}" fill="var(--ink)" font-size="13">${row.label}</text><path d="M135 ${24 + index * 47}H475" stroke="var(--line)"/><path d="M135 ${24 + index * 47}H${position(row.value)}" stroke="${row.color}" stroke-width="4" stroke-linecap="round"/><circle cx="${position(row.value)}" cy="${24 + index * 47}" r="5" fill="${row.color}"/>`).join('')}</svg>`;
    element.querySelector('.note-demo-stats')!.innerHTML = `<div><span>绝对坐标得到</span><strong>${(result.absolute * 100).toFixed(2)} <small>cm</small></strong></div><div><span>相对坐标得到</span><strong>${(result.relative * 100).toFixed(2)} <small>cm</small></strong></div><div><span>该量级 float32 间隔</span><strong>${Number((result.ulp * 100).toPrecision(5))} <small>cm</small></strong></div>`;
  }
  slider.addEventListener('input', render, { signal });
  select.addEventListener('change', render, { signal });
  render();
}

function bvhDemo(element: HTMLElement, signal: AbortSignal) {
  const tree = buildBVH(demoBoxes);
  element.innerHTML = `<div class="note-demo-heading"><span>动手验证 / BVH</span><strong>一条射线，跳过整片空间</strong></div><label class="note-control">射线起点高度<input aria-label="射线起点高度" type="range" min="0" max="80" value="31"></label><div class="bvh-chart"></div><div class="note-demo-stats" aria-live="polite"></div><p class="note-demo-caption">真实执行三维 AABB 求交与近端优先遍历，图中显示 XY 投影；所有盒体 z∈[0,1]，射线 z=0.5。构建采用最长质心轴中位数划分，未实现 SAH；计数是算法操作数，不是运行耗时。</p>`;
  const slider = element.querySelector<HTMLInputElement>('input')!;
  const x = (value: number) => 45 + value * 43;
  const y = (value: number) => 335 - value * 39;
  function render() {
    const originY = Number(slider.value) / 10;
    const result = traceBVH(tree, { origin: [-1, originY, .5], direction: [1, .08, 0] });
    const nodes: BVHNode[] = [];
    function collect(node: BVHNode) { if (node.children && result.visited.includes(node.id)) { nodes.push(node); node.children.forEach(collect); } }
    collect(tree);
    element.querySelector('.bvh-chart')!.innerHTML = `<svg viewBox="0 0 560 370" role="img" aria-label="BVH 包围盒和射线。深红色是最近命中的物体，浅红色是测试过的候选。"><defs><marker id="bvh-ray-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="var(--red)"/></marker></defs>${nodes.map(node => `<rect x="${x(node.bounds.min[0]) - 3}" y="${y(node.bounds.max[1]) - 3}" width="${(node.bounds.max[0] - node.bounds.min[0]) * 43 + 6}" height="${(node.bounds.max[1] - node.bounds.min[1]) * 39 + 6}" fill="none" stroke="var(--muted)" stroke-dasharray="4 5" opacity=".35"/>`).join('')}${demoBoxes.map(box => `<rect x="${x(box.min[0])}" y="${y(box.max[1])}" width="34.4" height="27.3" rx="3" fill="${box.id === result.hit ? 'var(--red)' : result.tested.includes(box.id) ? '#a92e1e33' : '#728f7b33'}" stroke="${box.id === result.hit ? 'var(--red)' : 'var(--ink)'}" stroke-width="1.2"/>`).join('')}<path d="M${x(-.7)} ${y(originY + .024)}L${x(11)} ${y(originY + .96)}" stroke="var(--red)" stroke-width="2" marker-end="url(#bvh-ray-arrow)"/><text x="15" y="361" font-size="12" fill="var(--muted)">虚线：访问过的内部节点　／　实线：物体包围盒</text></svg>`;
    element.querySelector('.note-demo-stats')!.innerHTML = `<div><span>物体测试</span><strong>${result.primitiveTests} <small>/ 24</small></strong></div><div><span>内部含叶节点测试</span><strong>${result.nodeTests}</strong></div><div><span>最近命中物体</span><strong>${result.hit === null ? '无' : `#${result.hit + 1}`}</strong></div>`;
  }
  slider.addEventListener('input', render, { signal });
  render();
}

function agentDemo(element: HTMLElement, signal: AbortSignal) {
  let run = createAgentExecution();
  element.innerHTML = `<div class="note-demo-heading"><span>动手验证 / DURABLE EXECUTION</span><strong>写入成功，回执丢了，还能重试吗？</strong></div><ol class="agent-stages" aria-label="Agent 执行阶段"><li data-step="plan">计划</li><li data-step="retrieve">检索</li><li data-step="approval">审批</li><li data-step="write">写入</li><li data-step="done">完成</li></ol><div class="note-demo-buttons"><button type="button" data-command="advance">执行下一步</button><button type="button" data-command="approve">批准本次写入</button><button type="button" data-command="crash">模拟写入后丢失回执</button><button type="button" data-command="resume">从检查点恢复</button><button type="button" data-command="reset">重置实验</button></div><p class="agent-effect-count" role="status"></p><ol class="agent-trace" aria-label="执行事件记录"></ol><p class="note-demo-caption">这是本地状态机与幂等账本模型，不调用 LLM 或实际工单服务；账本只存在本页内存，刷新会重置。真实部署需要持久化检查点，并由副作用接收方持久化幂等键与结果。</p>`;
  function render() {
    for (const stage of element.querySelectorAll<HTMLElement>('[data-step]')) {
      stage.toggleAttribute('data-current', stage.dataset.step === run.step);
      if (stage.dataset.step === run.step) stage.setAttribute('aria-current', 'step'); else stage.removeAttribute('aria-current');
    }
    for (const button of element.querySelectorAll<HTMLButtonElement>('[data-command]')) {
      const command = button.dataset.command;
      button.disabled = command === 'advance' ? run.crashed || !['plan', 'retrieve', 'write'].includes(run.step) : command === 'approve' ? run.step !== 'approval' : command === 'crash' ? run.step !== 'write' || run.crashed : command === 'resume' ? !run.crashed : false;
    }
    element.querySelector('.agent-effect-count')!.textContent = `副作用累计 ${run.effects.size} 次 · 检查点 ${run.step}${run.crashed ? ' · 等待恢复' : ''}`;
    element.querySelector('.agent-trace')!.innerHTML = run.events.map(event => `<li>${escapeHtml(event)}</li>`).join('');
  }
  element.addEventListener('click', event => {
    const command = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-command]')?.dataset.command;
    if (!command) return;
    if (command === 'advance') advanceAgent(run);
    if (command === 'approve') approveAgent(run);
    if (command === 'crash') advanceAgent(run, true);
    if (command === 'resume') resumeAgent(run);
    if (command === 'reset') run = createAgentExecution();
    render();
  }, { signal });
  render();
}

function ragDemo(element: HTMLElement, signal: AbortSignal) {
  element.innerHTML = `<div class="note-demo-heading"><span>动手验证 / ACL × RRF</span><strong>问题一样，身份不同，证据就该不同</strong></div><p class="rag-query">固定问题：权限应该怎么申请？</p><div class="note-control-row"><label class="note-control">当前身份<select aria-label="知识库访问身份"><option value="engineering">研发组成员</option><option value="hr">人事组成员</option></select></label><label class="note-check"><input type="checkbox" aria-label="撤销研发接入文档权限">撤销研发接入文档权限</label></div><div class="rag-candidates"></div><div class="rag-evidence" role="status"></div><p class="note-demo-caption">使用五份合成文档、固定的两路排序与真实 RRF 计算。ACL 先过滤两路候选，再融合；没有运行 BM25 索引、Embedding、重排模型或 LLM。公开示例数据都在本地，演示不构成真实权限服务。</p>`;
  const identity = element.querySelector<HTMLSelectElement>('select')!;
  const revoke = element.querySelector<HTMLInputElement>('input')!;
  function render() {
    const results = retrieveKnowledge(identity.value as 'engineering' | 'hr', revoke.checked);
    element.querySelector('.rag-candidates')!.innerHTML = `<p class="rag-policy">权限版本 ${revoke.checked ? 'v2' : 'v1'} · 可见候选 ${results.length} 份 · 不可见内容未送入答案</p><div class="note-table-scroll" tabindex="0" role="region" aria-label="按权限过滤后的 RRF 排序"><table><caption>仅展示当前身份可见的证据</caption><thead><tr><th>文档</th><th>词法名次</th><th>向量名次</th><th>RRF</th></tr></thead><tbody>${results.map(document => `<tr><td>${document.title}</td><td>${document.lexicalRank}</td><td>${document.vectorRank}</td><td>${document.score.toFixed(5)}</td></tr>`).join('')}</tbody></table></div>`;
    element.querySelector('.rag-evidence')!.innerHTML = `<strong>可用于回答的原文（前两条）</strong>${results.slice(0, 2).map((document, index) => `<blockquote>${document.quote}<cite>[${index + 1}] ${document.title} · 文档 v${document.version}</cite></blockquote>`).join('')}`;
  }
  identity.addEventListener('change', render, { signal });
  revoke.addEventListener('change', render, { signal });
  render();
}
