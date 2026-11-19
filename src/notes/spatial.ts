import { callout, citation, codeBlock } from './types';
import type { TechnicalNote } from './types';
const precision = 'earth-scale-precision';
const p = (n: number) => citation(precision, n);
const bvh = 'bvh-ray-traversal';
const b = (n: number) => citation(bvh, n);

export const spatialNotes: TechnicalNote[] = [
{
  slug: precision, category: '空间计算', eyebrow: 'SPATIAL COMPUTING / COORDINATES & PRECISION',
  title: '地球这么大，模型为何还在抖？从 ECEF 到相机相对坐标',
  summary: '从 WGS84、ENU 和 float32 的间距推导，拆开位置抖动与深度冲突；再看 Cesium 的 high/low 为什么必须分开相减。',
  readingMinutes: 12, topics: ['WGS84 → ECEF → ENU', 'Float32 / RTE', 'Depth precision'],
  question: '当坐标已经是六百多万米，一个 1 cm 的位移到底在哪一步消失了？',
  lead: `<p>把模型放到地球上，镜头一靠近，边缘开始跳动。直觉会让人增加面数、调抗锯齿，甚至把相机动画换成更平滑的插值。但如果两个顶点在上传 GPU 时已经舍入成同一个数，后面的处理再精致，也恢复不了差值。</p><p>这里固定约定：全局位置以米表示，输入是 WGS84 椭球经纬高；CPU 的 JavaScript Number 是双精度，普通顶点缓冲使用 float32。下面讨论这条数值链路，不把坐标精度、测绘精度和视觉效果混为一谈。</p>`,
  sections: [
    { id: 'coordinate-contract', title: '先写坐标契约，再写变换矩阵', body: `
      <p>“经纬度”不足以定义一份空间数据。至少需要知道大地基准、轴序、角度单位和高度基准。椭球高 h 也不自动等于海拔；把两种高度混用，会形成有规律的整体偏移，而不是随机浮点抖动。</p>
      <p>设经度 λ、椭球纬度 φ 均已转成弧度，WGS84 长半轴 a=6,378,137 m，扁率 f=1/298.257223563，e²=2f−f²。先求卯酉圈曲率半径 N，再得到地心地固坐标 ECEF：${p(1)}</p>
      <div class="note-formula">N(φ) = a / √(1 − e² sin²φ)
x = (N + h) cosφ cosλ
y = (N + h) cosφ sinλ
z = [N(1 − e²) + h] sinφ</div>
      <p>选一个局部原点 C，先在 ECEF 中计算 Δ=P−C，再旋转到东、北、天 ENU。对点坐标只做 R·P 而不减 C，会把地心误当成局部原点。ESA 给出的 ENU 基向量可整理为：${p(2)}</p>
      <div class="note-formula">[E]   [−sinλ          cosλ          0   ] [Δx]
[N] = [−sinφ cosλ    −sinφ sinλ     cosφ] [Δy]
[U]   [ cosφ cosλ     cosφ sinλ     sinφ] [Δz]
反变换：P = C + Rᵀ · [E,N,U]ᵀ</div>
      <p>ENU 本身是正交刚体变换，不会在某个半径以外突然失效。近似发生在你把 U=0 的切平面当作地表时：用球面估算，10 km 处相对切平面的下沉约 L²/(2R)≈7.84 m。这是曲率解释，不是 WGS84 精确测地计算。</p>
      ${callout('轴序也有手性', '如果渲染器采用 Y-up 右手系，可选择 (x,y,z)=(E,U,−N)。直接用 (E,U,N) 会改变手性。相机、三角形绕序、法线和拾取射线必须遵守同一套约定；这是一种可选映射，不是所有引擎的默认行为。')}` },
    { id: 'float32-gap', title: 'float32 的精度是间距，不是固定小数位', body: `
      <p>binary32 的有效精度为 24 个二进制有效位，正规数在 [2ᵉ,2ᵉ⁺¹) 内的相邻间距为 2ᵉ⁻²³。数越大，能表达的最小差值越大。“单精度能精确到小数点后七位”是错误的。Number 到 Math.fround 的舍入规则可查规范。${p(7)}</p>
      <p>在 6,378,137 m 量级，相邻 float32 间距是 0.5 m。一个 1 cm 位移比它小得多：</p>
      ${codeBlock('JavaScript · 可在控制台复算', `const camera = 6378137;
const point = camera + 0.01;
Math.fround(point) - Math.fround(camera); // 0
Math.fround(point - camera);             // 0.009999999776482582`)}
      <p>第一条路径先丢精度，再相减；第二条路径在双精度中消去共同的大平移，再把小量转成 float32。它们在代数上相似，在有限精度里却不是同一件事。局部坐标量级为 1 km 时，float32 间距约 0.061 mm；10 km 时约 0.977 mm。这是数值格式的间距，不是定位设备的精度。</p><div data-note-demo="precision" class="note-demo"></div>` },
    { id: 'relative-to-eye', title: '把大平移抵消在正确的一侧', body: `
      <p>最小修复是在 CPU 仍保有差值时做 P−C，必要时再应用视图旋转，最后上传局部 float32。数据存储可以继续使用全局坐标，渲染坐标无需强迫业务数据库跟着镜头移动。</p>
      ${codeBlock('渲染管线示意 · 不是引擎 API', `world64  = sourcePosition;
camera64 = cameraGlobalPosition;
delta64  = world64 - camera64;       // 双精度中抵消大平移
view64   = viewRotation * delta64;  // 不再附加一次大平移
uploadFloat32(view64);
// GPU：剩下的是小量与投影
gl_Position = projection * vec4(viewPosition, 1.0);`)}
      <p>这不意味着每帧都在 CPU 重写所有顶点。更实际的组织是分块局部顶点、每块的高精度原点，以及与相机一致的相对变换。选择 floating origin 时，要把模型平移、包围盒、拾取和缓存成组更新；同一帧混用新旧原点，会制造新的抖动与错误命中。这是由坐标一致性推导的工程约束。</p>
      <h3>Cesium 的 high/low 不是再造一个 double</h3><p>Cesium 1.120 的编码源码把位置拆成 high 与 low，以 65,536 为分段单位，并不只是把 high 设成 f32(value)。相机也编码成两部分，在着色器中分别相减，再相加：${p(3)}${p(4)}</p>
      ${codeBlock('GLSL · relative-to-eye 的关键次序', `vec3 highDifference = positionHigh - cameraHigh;
vec3 lowDifference  = positionLow  - cameraLow;
vec3 relativePosition = highDifference + lowDifference;`)}
      <p>若先在单精度里执行 high+low 还原大坐标，再减相机，大部分收益会丢失。编码还必须与模型空间、相机空间一致。这是对实现机制的分析，不建议把某个历史版本的内部类型当成当前稳定 API。</p>` },
    { id: 'depth-is-separate', title: '模型不抖了，为什么两片面还在打架？', body: `
      <p>两个非常接近的面交替显示，是另一笔账。透视深度可写成 d=A+B/z，常见映射把很多可分辨值挤在近裁面附近。对固定步长深度量化，距离误差会随 z² 放大；把 near 无限制往 0 推，会让远处层次更难区分。相机相对坐标无法恢复深度缓冲里没有的分辨率。${p(5)}</p>
      <p>reversed-Z 让 near 对应 1、far 对应 0，与浮点深度在小数值附近更密的分布相配合。以正的视空间距离 z、[0,1] 深度范围、无限远裁面为例，反向深度可趋近 d=n/z。收益有前提：投影约定、深度格式、比较方向、清除值必须成套一致。单独把片元深度改成 1−depth，不等于完成同样的管线。</p>
      <p>本项目使用的 three.js r180 源码明确：请求 reversedDepthBuffer 需要 EXT_clip_control，是否真的启用要看 renderer.capabilities.reversedDepthBuffer。不能把较早文章中的浏览器支持描述当成今天的事实。${p(6)}</p>
      ${codeBlock('Three.js r180 · 请求不等于启用', `const renderer = new THREE.WebGLRenderer({
  reversedDepthBuffer: true
});
console.log(renderer.capabilities.reversedDepthBuffer);
// 仍需设计合理裁剪范围，验证目标设备的实际效果。`)}
      ${callout('先定位误差，再选方案', '相机移动时整片模型跳动，优先检查位置量化与矩阵平移；静止时近共面的片元交替覆盖，检查深度精度；整体稳定偏移，则回查基准、轴序和高度。症状可能叠加，不能只凭一张截图下结论。')}` },
    { id: 'verification', title: '用数值闭环和误差预算验收', body: `
      <p>验收顺序是先验证坐标变换，再验证数值管线，最后验证画面。把输入、单位与误差上限写入测试，不只说“看起来不抖”。</p>
      <ul><li><strong>变换闭环：</strong>选已知 ENU 位移，经 Rᵀ 加回 ECEF 原点，再用 R(P−C) 还原。以经纬度 (120.1551°,30.2741°)、椭球高 20 m 为数学输入，本次双精度计算把 (1,2,3) m 还原为约 (0.99999999977,1.99999999999,3.00000000012) m。这只验证数学闭环。</li><li><strong>位置误差：</strong>同时测试先舍入后相减、先相减后舍入，在镜头移动和原点重设时比较屏幕偏差；局部顶点、模型矩阵和相机矩阵都要纳入检查。</li><li><strong>深度误差：</strong>分别改变 near/far、面间距和深度方案。不要把位置精度的改进归功于深度技巧。</li><li><strong>空间分析：</strong>长距离仍按业务所需的椭球或测地方法计算，不因为局部渲染方便，就把切平面直线距离当作所有距离的真值。</li></ul>
      <p>全局坐标负责“它在世界的哪里”，局部坐标负责“这一帧怎样把它稳定画出来”。两个任务可以协作，不必共享一种数值表示。</p>` },
  ],
  conclusion: '精度设计的核心，是在差值尚未丢失时消去共同的大量。先定义坐标契约，再选择局部表示；最后单独处理深度分辨率。把问题拆开，才能知道每一种技巧究竟修复了哪一步。',
  sources: [
    { title: 'Ellipsoidal and Cartesian Coordinates Conversion', publisher: 'ESA Navipedia', url: 'https://gssc.esa.int/navipedia/index.php/Ellipsoidal_and_Cartesian_Coordinates_Conversion', supports: '椭球经纬高到 ECEF 的公式与符号定义。' },
    { title: 'Transformations between ECEF and ENU coordinates', publisher: 'ESA Navipedia', url: 'https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates', supports: 'ENU 基向量、转置逆变换及椭球法向 Up。' },
    { title: 'EncodedCartesian3.js · Cesium 1.120', publisher: 'CesiumGS · 固定历史版本源码', url: 'https://raw.githubusercontent.com/CesiumGS/cesium/1.120/packages/engine/Source/Core/EncodedCartesian3.js', supports: 'high/low 编码实现，不代表当前公开 API。' },
    { title: 'translateRelativeToEye.glsl', publisher: 'CesiumGS · main，读取于 2026-11-19', url: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Shaders/Builtin/Functions/translateRelativeToEye.glsl', supports: '分别抵消 high、low，再合成相对相机位置。' },
    { title: 'Visualizing Depth Precision', publisher: 'Nathan Reed / NVIDIA Technical Blog', url: 'https://developer.nvidia.com/blog/visualizing-depth-precision/', supports: '透视深度、近裁面与浮点 reversed-Z。原文实验不作为本站性能数据。' },
    { title: 'WebGLRenderer.js · three.js r180', publisher: 'three.js · 与项目版本相符的源码', url: 'https://raw.githubusercontent.com/mrdoob/three.js/r180/src/renderers/WebGLRenderer.js', supports: '反向深度的扩展条件，以及请求参数与实际 capabilities 的区别。' },
    { title: 'Math.fround / Number::toFloat32', publisher: 'TC39 · ECMAScript Specification', url: 'https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.fround', supports: 'Number 转单精度的舍入语义。ULP 数值与示例输出由本文复算。' },
  ],
},
{
  slug: bvh, category: '三维算法', eyebrow: '3D ALGORITHMS / RAY QUERIES & BVH',
  title: '一条射线如何避开百万面片：BVH、Slab 与 SAH',
  summary: '从三维区间相交推导拾取加速，计算划分成本，并处理平行射线、非均匀缩放和动态场景中的反直觉边界。',
  readingMinutes: 13, topics: ['Ray / AABB', 'SAH / Traversal', 'Local-space queries'],
  question: '拾取时真正需要变快的，是三角形求交公式，还是被送进公式的候选数量？',
  lead: `<p>一条射线和一个三角形求交并不神秘，昂贵的是把同样的工作对每个三角形都做一次。BVH 的价值在于证明“一整片物体不可能被命中”，让后面的精确计算根本不用发生。</p><p>这里讨论最近命中查询：找到射线前方参数 t 最小的物体。遮挡查询只需要任何一个合适命中，可以更早退出。下方实验用盒体代替网格，真实执行三维求交与遍历，但不把它包装成百万三角形的性能测试。</p>`,
  sections: [
    { id: 'slab', title: 'AABB 求交，是三个区间取交集', body: `
      <p>写射线 r(t)=o+td，所需范围为 [tMin,tMax]。轴对齐包围盒是三个轴向 slab 的交集。每一轴的两张边界平面给出一个 t 区间，三个区间与射线范围的交集不空，就命中盒子。${b(1)}</p>
      <div class="note-formula">t₁ᵢ = (minᵢ − oᵢ) / dᵢ
t₂ᵢ = (maxᵢ − oᵢ) / dᵢ
tEnter = max(tMin, min(t₁x,t₂x), min(t₁y,t₂y), min(t₁z,t₂z))
tExit  = min(tMax, max(t₁x,t₂x), max(t₁y,t₂y), max(t₁z,t₂z))
命中条件：tEnter ≤ tExit</div>
      <p>方向为负时交换该轴的进入与离开参数。方向为 ±0 时，射线平行于 slab：起点在区间外直接排除，在区间内则该轴不限制 t。显式分支也绕开了边界上的 0/0。</p>
      ${codeBlock('TypeScript · 清晰版 slab 核心', `let enter = 0, exit = tMax;
for (let axis = 0; axis < 3; axis++) {
  if (d[axis] === 0) { // 包含 -0
    if (o[axis] < min[axis] || o[axis] > max[axis]) return null;
    continue;
  }
  let a = (min[axis] - o[axis]) / d[axis];
  let b = (max[axis] - o[axis]) / d[axis];
  if (a > b) [a, b] = [b, a];
  enter = Math.max(enter, a);
  exit = Math.min(exit, b);
  if (enter > exit) return null;
}
return enter;`)}
      <p>这个易读版本假定有效盒体、有限输入和非零方向，不等于完整的保守浮点实现：pbrt 还对 tFar 做误差界扩张，避免边界舍入造成假阴性。“除零会得到无穷，所以所有 min/max 都安全”也不对：NaN 会经 JavaScript 的 Math.min/max 传播。${b(1)}</p>
      ${callout('不要随手写一个万能 epsilon', '把 abs(d)&lt;1e−8 当作平行判断，会随方向向量缩放而改变结果。一个很小但非零的方向，仍可能在很大的 t 上命中。阈值必须与参数范围、坐标尺度和误差要求一起设计。')}` },
    { id: 'traversal', title: '先访问近处，再缩短远处的搜索范围', body: `
      <p>构建时，内部节点包住两个子树，叶节点保存图元范围。查询时先测根盒，未命中就结束；命中了才进入子树，到叶子才做真正的图元求交。盒命中只是候选，不等于三角形命中。</p><p>维护 tClosest，发现更近的图元后，后续盒测试都带着这个上界。一个节点的进入参数已大于 tClosest，就不必遍历它。下面实验按两个子盒的实际 tEnter 优先访问近处；pbrt 展示的按划分轴方向符号选择顺序，是一种更便宜的近远近似，不要混称同一实现。${b(2)}</p>
      <div data-note-demo="bvh" class="note-demo"></div>
      <p>“物体测试”与“节点测试”分开计数。前者减少不一定等于总耗时下降，遍历、分支和数据布局也有成本。高度重叠的盒子可能迫使查询访问大量叶子，不能给 BVH 无条件标一个 O(log N)。</p>` },
    { id: 'sah', title: 'SAH 问的是：这次切分值得吗？', body: `
      <p>最长轴按质心中位数划分容易实现，却不保证“左右各一半”就是低查询成本。Surface Area Heuristic 用子盒表面积与父盒表面积之比，近似衡量射线进入子树的机会：${b(2)}</p>
      <div class="note-formula">A(dx,dy,dz) = 2(dx·dy + dy·dz + dz·dx)
Csplit = CT + (AL/AP) · NL · CI + (AR/AP) · NR · CI
Cleaf  = N · CI</div>
      <p>注意是<strong>表面积</strong>，不是体积。CT 是遍历成本，CI 是图元求交成本。父立方体边长 10，AP=600；沿中线切成两个半盒，AL=AR=400，各含 4 个图元。沿用 pbrt 实现中的示例成本 CT=0.5、CI=1：</p>
      <div class="note-formula">Csplit = 0.5 + (400/600)×4 + (400/600)×4 ≈ 5.833
Cleaf = 8
若两个子盒都与父盒同样大：Csplit = 0.5 + 4 + 4 = 8.5</div>
      <p>第二种切分更贵。AL/AP+AR/AP 可以大于 1，因为访问两子树不是互斥事件，一条射线可能同时穿过它们。把比率强行归一化会抹掉重叠的代价。</p><p>pbrt 4ed 的近似构建把质心分到 12 个桶，扫描前后缀边界来考察 11 个切分点，比枚举每个位置便宜。12 和 0.5 是实现选择，不是理论最优常数。质心完全重合时也要终止或使用明确的备用策略，避免无限递归或空子树。</p><p>SAH 估计成本，不是毫秒。静态大模型可为查询质量多花构建时间；每帧形变、少量射线的场景可能更在意构建速度。最终应分开测构建、内存、盒测试、图元测试与查询延迟。</p>` },
    { id: 'transforms', title: '非均匀缩放，会悄悄改掉你的 t', body: `
      <p>仿射实例不必每动一次就重建网格 BVH。保存局部 BVH，将世界射线乘逆模型矩阵：点的齐次分量为 1，方向为 0，因此方向不接受平移。${b(3)}</p>
      <div class="note-formula">oLocal = M⁻¹ · (oWorld, 1)
dLocal = M⁻¹ · (dWorld, 0)
M⁻¹(oWorld + t·dWorld) = oLocal + t·dLocal</div>
      <p>只要保持 dLocal 的尺度，变换前后的参数 t 可以一致。对象沿 x 放大两倍，世界射线 d=(1,0,0)，局部方向就是 (0.5,0,0)。局部面 x=5 对应世界面 x=10：保持方向 0.5，命中 t=10；若归一化成 1，局部 t 变为 5。</p><p>不能把不同模型里的这个“局部 t”直接排序。若所用库内部归一化了方向，就把命中点变回世界，按世界定义比较距离或参数。世界方向也未单位化时，t 原本不等于米。法线还需要逆转置，不能复用方向的变换方式。</p>` },
    { id: 'dynamic-validation', title: '动态场景与验证，决定它能否留下来', body: `
      <p>一种可选组织是网格局部 BVH，加一层实例级包围结构。实例移动时更新外层；顶点形变时自底向上 refit 内层包围盒。refit 保留拓扑，成本较低，但长期形变可能增加兄弟重叠，之后仍需重建。这是成本模型推导的设计选择，不是所有场景的性能保证。</p><p>对单位盒 [0,1]³，至少覆盖下列输入：</p>
      <div class="note-table-scroll" tabindex="0" role="region" aria-label="射线边界测试"><table><thead><tr><th>起点 o</th><th>方向 d</th><th>进入 t</th></tr></thead><tbody><tr><td>(−1,.5,.5)</td><td>(1,0,0)</td><td>1</td></tr><tr><td>(0,−1,.5)</td><td>(0,1,0)</td><td>1，边界平行</td></tr><tr><td>(−1,2,.5)</td><td>(1,0,0)</td><td>不命中</td></tr><tr><td>(.5,.5,.5)</td><td>(1,0,0)</td><td>0，盒内起点</td></tr><tr><td>(2,.5,.5)</td><td>(−1,0,0)</td><td>1，负方向</td></tr></tbody></table></div>
      <p>再用暴力遍历做最近命中的差分验证，加入反向射线、切角、退化盒、很小的非零方向和缩短的 tMax。性能比较使用相同场景与射线集合，把建树成本单列。没有这些条件，“快了多少倍”通常只是把实验条件藏起来了。</p>` },
  ],
  conclusion: '好的加速结构先排除不可能，再精确计算可能。BVH 的工程价值不只在一棵树，还在稳健区间运算、正确的 t 语义、可量化的划分成本，以及能对照暴力结果的验证路径。',
  sources: [
    { title: 'Basic Shape Interface · Ray–Bounds Intersections', publisher: 'Physically Based Rendering · 4th Edition', url: 'https://pbr-book.org/4ed/Shapes/Basic_Shape_Interface', supports: 'slab 求交、NaN 风险与 tFar 的保守误差界扩张。' },
    { title: 'Bounding Volume Hierarchies', publisher: 'Physically Based Rendering · 4th Edition', url: 'https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies', supports: '构建、SAH、分桶、线性布局、遍历与最近命中剪枝。' },
    { title: 'Applying Transformations', publisher: 'Physically Based Rendering · 4th Edition', url: 'https://pbr-book.org/4ed/Geometry_and_Transformations/Applying_Transformations', supports: '点、方向、射线与法线的变换区别，以及局部射线的参数尺度。' },
  ],
},
];
