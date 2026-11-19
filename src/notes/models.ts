/** Executable, deterministic teaching models. No model API or internal service is called. */
export function comparePrecision(origin: number, offset: number) {
  return {
    absolute: Math.fround(origin + offset) - Math.fround(origin),
    relative: Math.fround(offset),
    ulp: 2 ** (Math.floor(Math.log2(Math.abs(origin))) - 23),
  };
}

export type Vec3 = [number, number, number];
export interface Box { id: number; min: Vec3; max: Vec3 }
export interface Ray { origin: Vec3; direction: Vec3 }
export interface BVHNode { id: number; bounds: Box; boxes?: Box[]; children?: [BVHNode, BVHNode] }

export function intersectBox(ray: Ray, box: Box, limit = Infinity): number | null {
  if (ray.direction.every(value => value === 0) || limit < 0 || Number.isNaN(limit)) return null;
  let enter = 0;
  let exit = limit;
  for (let axis = 0; axis < 3; axis++) {
    const origin = ray.origin[axis];
    const direction = ray.direction[axis];
    if (!Number.isFinite(origin) || !Number.isFinite(direction)) return null;
    // Treat exact ±0 explicitly: a parallel ray on the slab must not produce 0/0.
    if (direction === 0) {
      if (origin < box.min[axis] || origin > box.max[axis]) return null;
      continue;
    }
    let near = (box.min[axis] - origin) / direction;
    let far = (box.max[axis] - origin) / direction;
    if (near > far) [near, far] = [far, near];
    enter = Math.max(enter, near);
    exit = Math.min(exit, far);
    if (enter > exit) return null;
  }
  return enter <= limit ? enter : null;
}

export function buildBVH(boxes: Box[]): BVHNode {
  if (!boxes.length) throw new Error('Cannot build an empty BVH');
  let nextId = 0;
  function build(items: Box[]): BVHNode {
    const bounds: Box = { id: -1, min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    for (const item of items) for (let axis = 0; axis < 3; axis++) {
      bounds.min[axis] = Math.min(bounds.min[axis], item.min[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], item.max[axis]);
      const centroid = (item.min[axis] + item.max[axis]) / 2;
      low[axis] = Math.min(low[axis], centroid);
      high[axis] = Math.max(high[axis], centroid);
    }
    const node: BVHNode = { id: nextId++, bounds };
    const extents = high.map((value, axis) => value - low[axis]);
    const axis = extents.indexOf(Math.max(...extents));
    if (items.length <= 2 || extents[axis] === 0) { node.boxes = items; return node; }
    const ordered = [...items].sort((a, b) => (a.min[axis] + a.max[axis]) - (b.min[axis] + b.max[axis]) || a.id - b.id);
    const middle = Math.floor(ordered.length / 2);
    node.children = [build(ordered.slice(0, middle)), build(ordered.slice(middle))];
    return node;
  }
  return build(boxes);
}

export function traceBVH(root: BVHNode, ray: Ray) {
  let closest = Infinity;
  let hit: number | null = null;
  let nodeTests = 1;
  let primitiveTests = 0;
  const visited: number[] = [];
  const tested: number[] = [];
  const entry = intersectBox(ray, root.bounds);
  const stack = entry === null ? [] : [{ node: root, entry }];
  while (stack.length) {
    const current = stack.pop()!;
    if (current.entry > closest) continue;
    const node = current.node;
    visited.push(node.id);
    if (node.boxes) {
      for (const box of node.boxes) {
        primitiveTests++;
        tested.push(box.id);
        const distance = intersectBox(ray, box, closest);
        if (distance !== null && (distance < closest || (distance === closest && (hit === null || box.id < hit)))) {
          closest = distance;
          hit = box.id;
        }
      }
    } else if (node.children) {
      const intersections: { node: BVHNode; entry: number }[] = [];
      for (const child of node.children) {
        nodeTests++;
        const distance = intersectBox(ray, child.bounds, closest);
        if (distance !== null) intersections.push({ node: child, entry: distance });
      }
      // Push far first so the nearer child is popped first.
      intersections.sort((a, b) => b.entry - a.entry);
      stack.push(...intersections);
    }
  }
  return { hit, distance: hit === null ? null : closest, nodeTests, primitiveTests, visited, tested };
}

export const demoBoxes: Box[] = Array.from({ length: 24 }, (_, index) => {
  const x = (index % 6) * 1.8 + .3;
  const y = Math.floor(index / 6) * 1.8 + .3 + (index % 3) * .12;
  return { id: index, min: [x, y, 0], max: [x + .8, y + .7, 1] };
});

export interface AgentExecution {
  step: 'plan' | 'retrieve' | 'approval' | 'write' | 'done';
  crashed: boolean;
  effects: Map<string, string>;
  events: string[];
}
export function createAgentExecution(): AgentExecution {
  return { step: 'plan', crashed: false, effects: new Map(), events: ['检查点：plan，尚未调用工具。'] };
}
export function approveAgent(run: AgentExecution) {
  if (run.step !== 'approval') return;
  run.step = 'write';
  run.events.push('审批通过；持久化 write 意图与稳定调用键 run-01:ticket-01。');
}
export function advanceAgent(run: AgentExecution, loseReceipt = false) {
  if (run.crashed || run.step === 'done') return;
  if (run.step === 'plan') {
    run.step = 'retrieve';
    run.events.push('计划已记录；下一步调用只读知识检索。');
  } else if (run.step === 'retrieve') {
    run.step = 'approval';
    run.events.push('检索返回两份合成证据；检查点停在 approval，等待确认。');
  } else if (run.step === 'write') {
    const key = 'run-01:ticket-01';
    if (run.effects.has(key)) run.events.push('相同幂等键命中原结果 TICKET-001；没有再创建工单。');
    else {
      run.effects.set(key, 'TICKET-001');
      run.events.push('外部系统模拟写入生效：TICKET-001（副作用共 1 次）。');
    }
    if (loseReceipt) {
      run.crashed = true;
      run.events.push('模拟故障：结果回执丢失；本地检查点仍为 write。');
    } else {
      run.step = 'done';
      run.events.push('结果已记入检查点，执行结束。');
    }
  }
}
export function resumeAgent(run: AgentExecution) {
  if (!run.crashed) return;
  run.crashed = false;
  run.events.push('从 write 检查点恢复，沿用原调用键。');
  advanceAgent(run);
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  groups: string[];
  lexical: number;
  vector: number;
  version: number;
  quote: string;
}
export const knowledgeDocuments: KnowledgeDocument[] = [
  { id: 'vpn-guide', title: '研发远程接入申请', groups: ['engineering'], lexical: 1, vector: 2, version: 3, quote: '研发成员先提交远程接入工单，经直属负责人审批后开通。' },
  { id: 'salary-access', title: '薪酬系统权限申请', groups: ['hr'], lexical: 2, vector: 1, version: 5, quote: '薪酬权限只向已授权人事成员开放，申请需由人事负责人审批。' },
  { id: 'request-process', title: '通用权限申请流程', groups: ['all'], lexical: 3, vector: 3, version: 2, quote: '权限申请需写明系统名称、使用目的和有效期限。' },
  { id: 'hr-records', title: '人事档案访问说明', groups: ['hr'], lexical: 4, vector: 5, version: 1, quote: '人事档案访问按岗位授权，跨部门访问需要单独审批。' },
  { id: 'engineering-review', title: '研发权限复核清单', groups: ['engineering'], lexical: 5, vector: 4, version: 4, quote: '研发系统权限每季度复核，离岗成员应及时移出授权组。' },
];
export function retrieveKnowledge(group: 'engineering' | 'hr', revoked = false) {
  // Apply access policy to both retrieval branches, before fusion and any answer construction.
  const allowed = knowledgeDocuments.filter(document => (document.groups.includes('all') || document.groups.includes(group)) && !(revoked && document.id === 'vpn-guide'));
  const lexical = [...allowed].sort((a, b) => a.lexical - b.lexical);
  const vector = [...allowed].sort((a, b) => a.vector - b.vector);
  return allowed.map(document => {
    const lexicalRank = lexical.indexOf(document) + 1;
    const vectorRank = vector.indexOf(document) + 1;
    return { ...document, lexicalRank, vectorRank, score: 1 / (60 + lexicalRank) + 1 / (60 + vectorRank) };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
