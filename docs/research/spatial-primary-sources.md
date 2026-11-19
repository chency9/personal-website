# 空间 / 3D 原始资料研究备忘

核验日期：2026-11-19（Asia/Shanghai）。本文件服务于网站的空间精度与 BVH 技术文章。以下资料均通过实际网络 GET 读取正文或源码，HTTP 200；不是根据搜索摘要拼接。下载快照在忽略提交的 `.qa/research/` 中。数值示例是本次用 Python `math` / `struct` 实际计算的结果，不是论文性能数据。

## 已核验的原始资料

| 编号 | 原始资料 / 所属方 | 实际读取地址 | 用途与边界 |
| --- | --- | --- | --- |
| S1 | *Ellipsoidal and Cartesian Coordinates Conversion*，ESA Navipedia；J. Sanz Subirana、J. M. Juan Zornoza、M. Hernández-Pajares | <https://gssc.esa.int/navipedia/index.php/Ellipsoidal_and_Cartesian_Coordinates_Conversion> | 椭球经纬高 → ECEF 的式 (1)–(3)；网页标注原始发表年 2011，修订 2024-10-25。 |
| S2 | *Transformations between ECEF and ENU coordinates*，ESA Navipedia，同上作者 | <https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates> | ENU 基向量与转置矩阵，式 (3)–(6)；明确椭球法向 Up 与球面径向不同。 |
| S3 | `EncodedCartesian3.js`，CesiumGS，固定标签 **1.120** | <https://raw.githubusercontent.com/CesiumGS/cesium/1.120/packages/engine/Source/Core/EncodedCartesian3.js> | 原始 high/low 编码实现；这是固定历史版本，不能写成当前公开 API。 |
| S4 | `translateRelativeToEye.glsl`，CesiumGS，读取当日 main | <https://raw.githubusercontent.com/CesiumGS/cesium/main/packages/engine/Source/Shaders/Builtin/Functions/translateRelativeToEye.glsl> | 分别减 high / low，再相加的 GPU relative-to-eye；main 会变化，引用应带访问日期。 |
| S5 | *Visualizing Depth Precision*，Nathan Reed，NVIDIA Technical Blog | <https://developer.nvidia.com/blog/visualizing-depth-precision/> | 透视深度与 1/z、浮点 reversed-Z 的关系与投影约定；实验结果仅属于文中设置，不能改写成网站实测。 |
| S6 | *Physically Based Rendering: From Theory to Implementation*, 4ed，§6.1.2 *Ray–Bounds Intersections* | <https://pbr-book.org/4ed/Shapes/Basic_Shape_Interface> | slab 区间交、无穷与 NaN 的处理、`tFar *= 1 + 2 * gamma(3)` 的保守边界扩张。 |
| S7 | 同书 4ed，§7.3 *Bounding Volume Hierarchies* | <https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies> | SAH、12 桶近似构建、退化质心、线性布局、迭代遍历、最近命中后缩短 tMax。 |
| S8 | 同书 4ed，§3.10 *Applying Transformations* | <https://pbr-book.org/4ed/Geometry_and_Transformations/Applying_Transformations> | 点 / 方向 / 法线 / 射线的变换；方向不做平移，法线用逆转置；射线变换保持原方向尺度。 |
| S9 | `WebGLRenderer.js`，three.js，固定标签 **r180** | <https://raw.githubusercontent.com/mrdoob/three.js/r180/src/renderers/WebGLRenderer.js> | 当前项目依赖版本的反向深度条件：`reversedDepthBuffer` 请求参数、`EXT_clip_control` 要求以及 capabilities 实际启用值。 |
| S10 | ECMA-262，§21.3.2.17 `Math.fround`，TC39 | <https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.fround> | 规范明确转换到 IEEE 754-2019 binary32、使用 roundTiesToEven，再回到 binary64 Number；支持网页量化实验的语义。 |

没有采用的失效或不可读入口：Cesium 当前 `EncodedCartesian3.html` 文档、当前 main 下 `EncodedCartesian3.js` / `Ellipsoid.js` 返回 404；Khronos 的 Depth Buffer Precision wiki 返回 403。这些地址不应作为本次已阅读来源出现在文章中。

## 文章一：大坐标下，如何让 1 cm 不消失

### 1. 先说明坐标与单位

S1 的输入是椭球纬度 φ、经度 λ、椭球高 h；角度先转为弧度，h 与椭球长半轴 a 使用米。海拔不是自动等于椭球高。定义：

```text
f = 1 / 298.257223563       // WGS84 扁率，示例取值
a = 6378137 m              // WGS84 长半轴，示例取值
e² = 2f − f²
N(φ) = a / sqrt(1 − e² sin²φ)
x = (N + h) cosφ cosλ
y = (N + h) cosφ sinλ
z = (N(1 − e²) + h) sinφ
```

公式来自 S1；本次使用的 WGS84 参数生成 `e² = 0.0066943799901413165`。实际工程还必须明确输入数据使用的基准、轴序和高度基准，不能仅凭“经纬度”三个字认定兼容。

围绕一个 ECEF 原点 C，令 Δ = P − C。S2 的 ENU 矩阵是：

```text
    [ −sinλ          cosλ          0    ]
R = [ −sinφ cosλ    −sinφ sinλ      cosφ ]
    [  cosφ cosλ     cosφ sinλ      sinφ ]

[E, N, U]ᵀ = R(P − C)
P = C + Rᵀ[E, N, U]ᵀ
```

重要区别：S2 讨论的是向量方向的旋转，实际点坐标必须先减原点。直接写 `R * P` 会把地心当作局部坐标原点。

ENU 是正交刚体变换，不会因为离原点远就自动数学失效。真正的近似是把局部 `U=0` 平面当作整片地球表面，或者把 E/N 的直线距离直接当长距离测地线长度。按球体近似，10 km 的地表相对切平面下沉约 `L²/(2R) ≈ 7.84m`；这是解释曲率用的近似推导，不能当 WGS84 精确测地结果。

在 Y-up 的右手渲染坐标系中，一个可选映射是 `(x,y,z)=(E,U,−N)`。因为 `E×U=−N`，若直接映射 `(E,U,N)` 就改变了手性。选什么轴可以不同，但相机、法线、三角形绕序、射线变换必须一致。这一点来自上述基向量关系的推导，不是 Cesium 默认坐标约定的声明。

### 2. 浮点误差在哪里发生

binary32 的正规数区间 `[2^e, 2^(e+1))` 相邻数间距是 `2^(e−23)`。精确度随量级变差；“float32 精度是固定 7 位小数”是错误说法。本次使用 `struct.pack/unpack('f', x)` 得到：

网页可用 `Math.fround` 重现实验。S10 的算法明确先转到 IEEE 754-2019 binary32、采用 roundTiesToEven，再转回 binary64 Number；函数返回值的容器仍是 JavaScript Number，不是让整个 JS 运算管线自动变为单精度。

| 实际计算 | 结果 |
| --- | --- |
| float32 在 6,378,137m 量级的相邻数间距 | 0.5m |
| `f32(6378137 + .01) − f32(6378137)` | 0 |
| `f32((6378137 + .01) − 6378137)` | 0.009999999776482582m |
| float32 在 1,000m 量级的相邻数间距 | 0.00006103515625m，约 0.061mm |
| float32 在 10,000m 量级的相邻数间距 | 0.0009765625m，约 0.977mm |

核心不是“先把最终结果放大”，而是别在减去共同大平移前就丢掉差值。推荐文章中的最小例子：

```js
const camera = 6378137;
const point = camera + .01;
const wrong = Math.fround(point) - Math.fround(camera); // 0
const local = Math.fround(point - camera);             // 约 .01
```

数值实验只隔离一维 binary32 量化；并不证明整个 GPU 管线具有厘米精度。顶点局部量级、视图矩阵构建、模型平移、投影与深度缓冲仍会贡献误差。

可以将渲染管线写成下面的约束，而不是泛泛“换成双精度”：

1. 数据存储与空间分析保留全局坐标；CPU 用高精度计算原点 / 相机位置。
2. 在仍保有差值时做 `P − C`，再旋转至局部 ENU。
3. 发送到普通 GPU 顶点缓冲的是局部 float32，模型 / 相机矩阵的平移也要保持相对原点的一致约定。
4. 若重定基准原点，缓存、包围盒、空间索引与当前帧模型变换要成组更新；不要让同一帧一半对象用旧原点、一半用新原点。

第 4 项是从坐标一致性推导出的工程设计建议，不是某篇论文保证的具体架构。

### 3. Cesium high / low 的确切做法与限制

S3 的 1.120 源码不是简单“高位等于 `f32(value)`”。它以 **65536** 为边界，正数为：

```text
high = floor(value / 65536) * 65536
low = value − high
```

负数用绝对值取整后恢复负号，不能把负数 `floor(value/65536)` 的行为不加说明地当作逐字复现。

S4 采用：

```glsl
vec3 highDifference = high - czm_encodedCameraPositionMCHigh;
vec3 lowDifference  = low  - czm_encodedCameraPositionMCLow;
return vec4(highDifference + lowDifference, 1.0);
```

应分别抵消大项和小项，再相加。若先在单精度里执行 `high + low` 还原大坐标，然后再减相机，大部分优势会丢失。源码还带一个设备特定的 highDifference 检查；文章无需逐字照抄实现，也不应把这个私有类型当成当前稳定 API。

这类表示法解决的是位置与变换量级问题。它既不自动提高纹理 / 法线精度，也不自动消除 z-fighting。

### 4. 位置精度和深度精度是两笔账

S5 说明透视深度可表示为 `d = A + B/z`，通常非线性地集中在近裁面附近。缩小 near 并不是没有成本；近裁面过近会伤害大部分距离段的区分能力。

reversed-Z 把 near 映射到 1、far 映射到 0，和浮点深度数值的分布相配合能显著改善远处精度。成立条件要写清：深度格式、投影后范围、比较方向与清除值必须成套一致。不能只在片元着色器里做一个 `1-depth` 就宣称得到相同收益。

NVIDIA 文章较早，其“GL ES 无 clip-control”不能直接搬成 2026 年浏览器支持现状。与本项目版本相对应，S9 的 three.js r180 源码明确 `reversedDepthBuffer` 需要 `EXT_clip_control`，实际启用看 `renderer.capabilities.reversedDepthBuffer`。如果文章给出 renderer 示例，应写成能力检测，而不是浏览器普遍保证。

不要转述 S5 中“某设置零错误”的表格成本站实测；那是作者的模拟输入与比较实验，而且作者也说明更紧的深度间隔仍可产生误差。

### 5. 本次计算的坐标闭环样例

取 `(λ,φ,h)=(120.1551°,30.2741°,20m)`，仅作为数学输入，不表示任何测绘控制点的实测真值：

```text
ECEF C = (−2769423.441017098,
           4766934.599933231,
           3196661.8091337476) m

ENU Δ = (1,2,3) m
ECEF Δ = (−1.6596739731315764,
           0.8660787909932425,
           3.239658906536509) m

用 R(P−C) 还原：
(0.999999999766511, 1.9999999999892066, 3.000000000124977) m
最大正交性残差 |R Rᵀ−I| = 1.1102230246251565e−16
```

这是 CPU 双精度计算闭环，不代表 GNSS、底图或现场定位有该精度。

## 文章二：射线不是慢，没被排除的候选太多

### 1. Ray–AABB slab 相交

射线写为 `r(t)=o+td`。AABB 是三个轴向 slab 的交集。每轴计算两平面给出的 t，将三段区间与所需射线段 `[tMin,tMax]` 取交。这是 S6 的算法，不需要把“三维”简化成一个屏幕矩形碰撞。

适合网页讲解的显式零分量版本如下。它优先清楚处理平行情况，不等价于 pbrt 完整的浮点误差界实现：

```ts
type V3 = readonly [number, number, number];
function hitAabb(o: V3, d: V3, lo: V3, hi: V3,
                 tMin = 0, tMax = Infinity) {
  // 调用方保证有限坐标、lo<=hi、非零方向，区间初始有效。
  let enter = tMin, exit = tMax;
  for (let axis = 0; axis < 3; axis++) {
    if (d[axis] === 0) { // 包含 −0
      if (o[axis] < lo[axis] || o[axis] > hi[axis]) return null;
      continue;       // 在 slab 内，沿该轴不再限制 t
    }
    let a = (lo[axis] - o[axis]) / d[axis];
    let b = (hi[axis] - o[axis]) / d[axis];
    if (a > b) [a, b] = [b, a];
    enter = Math.max(enter, a);
    exit = Math.min(exit, b);
    if (enter > exit) return null;
  }
  return { enter, exit };
}
```

不能用“除零就是无穷，所以随便 Math.min/max 都安全”带过。射线恰好在边界平面上且方向平行，会出现 `0 * Infinity = NaN`（或 `0/0`）。S6 特别说明其更新使用比较表达式以避免 NaN 进入区间；JS `Math.min` / `Math.max` 会传播 NaN。上例用显式分支绕开了此问题，但仍不提供数值误差的完整保守保证。

`abs(d)<1e−8` 不是普适替代：方向向量的任意缩放会改变这个判断。若采用 epsilon，必须明确参数尺度、坐标尺度和可接受误差，不能靠“加个很小的值”获得稳健性。

S6 的实现还将 `tFar` 放宽为 `tFar * (1+2γ(3))`，这是对运算误差的保守处理；不会凭空把包围盒测试变成精确三角形命中。浮点边界误判应结合对象尺度和使用的数值格式评估。

对单位盒 `[0,1]^3` 的必测输入：

| 起点 o | 方向 d | 期望 |
| --- | --- | --- |
| `(-1,.5,.5)` | `(1,0,0)` | `[1,2]` |
| `(0,-1,.5)` | `(0,1,0)` | `[1,2]`；边界平行不能传播 NaN |
| `(-1,2,.5)` | `(1,0,0)` | 未命中，y 平行且在 slab 外 |
| `(.5,.5,.5)` | `(1,0,0)` | 射线从盒内出发，若 tMin=0 则 `[0,.5]` |
| `(2,.5,.5)` | `(-1,0,0)` | `[1,2]`；负方向必须交换区间端点 |

还应测试切边 / 切角、空区间、退化盒、大坐标、非法 NaN 输入；全零 d 不应被悄悄当作正常射线。

### 2. SAH 用表面积，不是体积

S7 的 Surface Area Heuristic（表面积启发式）用射线穿过凸包围体的条件概率近似，常见成本写为：

```text
A(dx,dy,dz) = 2(dx·dy + dy·dz + dz·dx)
Csplit = CT + (AL/AP) NL CI + (AR/AP) NR CI
Cleaf  = N CI
```

`CT` 为遍历节点成本，`CI` 为图元相交成本。pbrt 4ed 的对应实现选择 `CI=1、CT=1/2`，近似 SAH 使用 12 桶、前缀 / 后缀扫描来考察 11 个切分点；这是具体实现参数，不是理论规定的最佳值。

本次计算的例子：父盒边长 10、面积 AP=600；两个半盒面积 AL=AR=400，各包含 4 个图元：

```text
Csplit = .5 + 400/600·4 + 400/600·4 = 5.833333...
Cleaf  = 8
```

若两个子盒都和父盒同样大，`Csplit=.5+4+4=8.5`，比直接叶子更差。注意 `AL/AP+AR/AP` 可以大于 1：访问两个子树不是互斥事件，一条射线可以同时穿过它们。这正是过度重叠会削弱裁剪效果的原因，不能把这两个比率强行归一化成和为 1 的“概率分配”。

SAH 是成本模型，不是实际毫秒数；具体 ray distribution、缓存、SIMD、GPU 分歧和构建成本可能改变最优选择。不要写“BVH 必然 O(log N)”或“用了 SAH 就快十倍”。完全重叠、巨型长薄三角形、糟糕划分等情况下可能退化到扫描大量图元。

### 3. 构建与遍历不是一回事

S7 的工程细节可以形成文章的真正内容：

- 按图元包围盒质心的最大跨度选划分轴；同位置质心无法有意义地继续该划分，应终止或采取明确的备用策略，避免空子树 / 无限递归。
- 桶边界需要夹紧：最大质心可能落入索引 `nBuckets`，源码会改为 `nBuckets−1`。
- 构建后按深度优先顺序压平为连续数组，左子紧邻父节点、记录右子偏移，叶子持有连续图元范围，减少指针追踪。
- 最近命中查询：拿到更近图元后将 `tMax` 缩短，后续节点使用该上界做裁剪；“任何命中”查询则可以在首个合适命中时结束。二者不能混用。
- pbrt 的子树访问顺序使用切分轴方向符号作为便宜的近远近似；如果示例实现按两个子盒的实际 `tEnter` 排序，应明确这是另一种策略，不能声称在逐字复现其遍历。

包围盒命中只产生候选，必须在叶子内进行真正的三角形 / 图元相交。网页如果仅使用盒子作场景，应写“盒体拾取 / BVH 剪枝示意”，不要把计数说成真实三角网格场景性能。

### 4. 模型局部空间与射线参数

根据 S8，若世界到模型变换为 `M⁻¹`：

```text
o_local = M⁻¹ · (o_world, 1)
d_local = M⁻¹ · (d_world, 0)
```

方向不要接受平移；在可逆仿射变换下，**保持方向不归一化**，有 `M⁻¹(o+td)=o_local+t d_local`，原 t 仍可比较。若擅自归一化 `d_local`，局部 t 尺度就会变。

实际计算的简单例子：对象沿 x 放大 2，世界射线方向 `(1,0,0)`；局部方向是 `(.5,0,0)`。局部面 `x=5` 对应世界面 `x=10`：

```text
保持局部 d=.5：局部 t = 5/.5 = 10，与世界 t 一致
把局部 d 归一化为 1：局部 t = 5，不能直接当世界距离
```

更一般的非均匀缩放尤其容易导致多个对象间最近命中排序错误。若库内部对方向归一化，就把命中点变回世界空间，再用世界定义比较距离 / 参数。世界 d 也未单位化时，t 本来就不等于米；`t` 和距离要在文章中区分。

法线与方向不同，法线需要 `(M⁻¹)ᵀ`，随后按需要归一化。把点变换矩阵、方向变换和法线矩阵混作一种“乘矩阵”会在非均匀缩放下产生错误。

### 5. 静态场景与动态场景的取舍

以下是由包围条件与成本模型推导的工程建议，应标为设计判断，不是 S7 的性能结论：

- 刚体实例移动：保留各网格局部 BVH；更新实例级结构 / 外层包围体，拾取时将射线变换到局部。避免为每次刚体变换重建所有三角形层级。
- 顶点形变：refit 自底向上更新包围盒可以保留树拓扑，但持续变形可能让兄弟重叠恶化；需要用盒测试数、图元测试数、实际延迟监控质量，必要时重建。
- 要比较 SAH / 中位数分割，至少拆开构建耗时、每条射线的盒测试与图元测试、内存大小和查询总延迟。一次构建后百万次查询，与每帧重建后少量查询，其选择可能相反。
- 网页演示若展示“排除了多少对象”，应从当次实际运行的遍历计数得出，明确对象数、命中策略和场景种子；不要把裁剪百分比等同于 FPS 提升。

## 可直接用于文章的验证与表述约束

1. 空间实验至少展示“先量化后相减 / 先相减后量化”两条真实路径，显示物理单位及误差，不只显示装饰性的抖动。
2. ENU 提供正反变换闭环，并说明椭球高、弧度、轴序；若只画 2D 投影，正文要说明 3D 数学与投影之间的关系。
3. BVH 演示的盒测试 / 图元测试计数来自实际执行路径；未命中、盒内起点、边界平行负方向都能验证。
4. 每篇至少给出一个在什么条件下不成立的段落；将原始资料结论、本文的工程建议、本文的实测分开。
5. 对没有搭建的 Cesium GPU、测绘设备或大网格性能，不声称“我验证达到某精度 / 某 FPS”。
