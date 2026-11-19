# Agent 执行底座与内网知识库：原始资料核对

查阅日期：2026-11-19。本文供网站长文写作与演示模型校核使用。资料均实际通过网络获取，全文/Markdown 缓存在 `.qa/research/`，不把框架的能力描述成本站已经部署的生产系统。不引用未经运行验证的吞吐量、召回提升或业务案例。

## 已核实来源

| 编号 | 来源与可访问地址 | 实际核实内容 |
| --- | --- | --- |
| A1 | Temporal, [Workflow Definition](https://docs.temporal.io/workflow-definition) | Workflow 重放要求确定性；相同输入须按相同顺序发出 Workflow API 调用；API、LLM、数据库等非确定操作应放到 Activity。 |
| A2 | Temporal, [Activities](https://docs.temporal.io/activities) | Activity 可执行非确定代码，官方建议幂等；失败按 retry policy 重试；每次尝试从初始状态开始，除非利用 heartbeat detail checkpoint。 |
| A3 | LangGraph, [Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | super-step 检查点、thread、pending writes、sync/async/exit 三种持久化模式及崩溃窗口。已读取该页 Markdown 全文相关章节。 |
| A4 | LangGraph, [Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts) | interrupt 会保存状态；恢复必须使用同一个 thread ID；恢复时整段节点从头运行，中断前的副作用必须幂等。 |
| A5 | Chris Richardson, [Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) | 同一数据库事务记录业务变化与待发消息；relay 仍可能重复发布，消费者必须幂等。作者自有模式资料。 |
| A6 | LangGraph, [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) | checkpointer 面向 thread 内状态，store 面向跨 thread 数据；内存 Saver 不跨进程重启保留。 |
| R1 | Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | 原始 RAG 论文摘要：结合参数记忆与非参数检索；检索不是保证无幻觉、保证访问控制的协议。后半句是对能力边界的工程分析，不是论文原句。 |
| R2 | Thakur et al., [BEIR](https://arxiv.org/abs/2104.08663) | 18 个不同领域数据集、10 类检索系统的摘要描述；BM25 是稳健基线，不宜宣称 dense 对所有企业语料必胜。 |
| R3 | Microsoft Learn, [Security filter pattern](https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search) | 普通安全过滤器按 principal 字符串包含/排除文档，本身不认证身份；应用必须提供可信身份与 grants、对所有查询应用过滤并防止绕过。 |
| R4 | Microsoft Learn, [Vector query filters](https://learn.microsoft.com/en-us/azure/search/vector-search-filters) | preFilter 在每个 shard 的 HNSW 遍历过程中约束候选；postFilter/strictPostFilter 可能对高度选择性的条件和小 k 产生假阴性；preFilter 也可能增加 CPU 和延迟。 |
| R5 | Microsoft Learn, [Hybrid search scoring / RRF](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking) | reciprocal rank fusion 公式；rank constant 与最近邻 k 不同；语义重排在 RRF 合并之后，重排分值单独报告。 |
| R6 | Microsoft Learn, [Semantic ranking overview](https://learn.microsoft.com/en-us/azure/search/semantic-search-overview) | 语义重排是对初始 BM25 或 RRF 结果的第二阶段排序；Azure 该实现只将前 50 条送入语义重排。50 是产品实现限制，不是通用 RAG 定理。 |
| R7 | Es et al., [Ragas: Automated Evaluation of Retrieval Augmented Generation](https://arxiv.org/abs/2309.15217) | 原论文摘要把检索上下文、依据上下文的忠实生成、生成质量分开评估；自动评估不能替代真实权限检查和人工黄金集。最后一句是工程判断。 |
| R8 | Cormack, Clarke, Büttcher, [Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods](https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf) | 原始 RRF 论文 PDF 实际成功下载；公式与常数性质主要交叉依据 R5/R9 核对。不在本站复用论文的实验成绩充当本站成绩。 |
| R9 | Elastic, [Reciprocal rank fusion](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion) | rank_constant、rank_window_size 与最终 size 不同；融合不同相关性指标；返回窗口决定哪些候选有机会被融合。 |
| R10 | Microsoft Learn, [Document-level access control](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) | 普通应用管理安全过滤与原生权限过滤不同；原生各连接器能力和 API 状态需逐项核对，不能笼统说所有源权限自动继承。 |

访问说明：A1/A2/R1–R10 页面均实际返回 HTTP 200。LangGraph 的旧 `durable-execution` URL 在查阅时重定向到 `persistence`，持久化模式的详细论据在 A3，不应再假定旧页面结构。R6 的 `semantic-ranking` 旧路径重定向到表中最终地址。R8 原始 `plg.uwaterloo.ca` 地址重定向到表中地址。OpenTelemetry 旧 agent spans 文档已迁移，这次不把失效的旧页面作为文章证据。

## 文章一：能恢复的 Agent，先把副作用从推理中拆出来

### 可以直接使用的论点与证据

1. **聊天记录不是运行状态。** 需要分别记录 run、逻辑 step、状态版本、业务副作用、工具结果、成本预算和可恢复位置。A6 明确区分 thread checkpoint 与跨 thread store。文章中的数据库字段是可实现的设计建议，不应冒充 LangGraph 固定 schema。
2. **模型输出也是非确定结果。** 网络请求、LLM 生成、当前时间、随机数、数据库读取，不能在确定性重放中被无条件重做。A1 明确写出把 LLM/AI、数据库和其他外部交互放入 Activity。要么重放已记录的结果，要么显式创建新的逻辑步骤。
3. **checkpoint 是恢复边界，不是外部业务事务。** A3 的 `sync` 只承诺下一步前完成检查点写入；不能让远端支付、建工单或发邮件与本地检查点自然变成一个原子事务。
4. **“重试成功”不等于“只执行一次”。** A2 允许 Activity 重试，A5 解释 relay 在发布后、写确认前崩溃会重复发布。正确表述应是至少一次尝试加幂等效果，且前提是下游执行去重。
5. **中断恢复不是从代码光标继续。** A4 原文："The node restarts from the beginning"。把付费调用、创建记录或发消息写在 interrupt 前面，恢复时可能再次执行。
6. **存了检查点也有丢失窗口。** A3：`exit` 到退出时才持久化，进程中途崩溃不可恢复中间状态；`async` 允许下一步与持久化并行，崩溃存在未落盘风险；`sync` 先落盘再进入下一步，有额外延迟。即使 sync，在第一个 durable checkpoint 写好前也无法仅用 checkpoint 区分“从未接收”和“已接收后丢失”。需要另外的 admission/run 行或 outbox。

### 推荐讲清的故障时序

```text
本地记录 PREPARED(effect_id, payload_hash)
    → 远端 create_ticket(effect_id) 成功
    → 进程在保存 tool_result 前崩溃
    → 恢复后无法仅凭本地状态判断远端是否完成
```

失败的修复是“换一个随机 request_id 再重试”。正确处理：重试沿用同一逻辑 `effect_id`；下游如果支持幂等键，则在它自己的事务中把去重键与业务写入一起提交，并返回第一次调用的结果。若下游没有幂等协议或查询结果机制，结果进入 `UNCERTAIN/RECONCILE`，不能承诺自动重试就无重复。

### 状态机与存储最小骨架（建议设计）

```text
QUEUED → RUNNING → WAIT_APPROVAL → RUNNING → SUCCEEDED
                 ↘ RETRY_WAIT → RUNNING
                 ↘ UNCERTAIN → RECONCILE
                 ↘ FAILED / CANCELLED / BUDGET_EXHAUSTED
```

```sql
-- 所有 run 查询都带 tenant_id，并在服务端校验当前主体授权
runs(tenant_id, run_id, actor_id, workflow_version, state_version,
     status, budget_reserved, checkpoint_ref, trace_id)

-- effect_id 代表逻辑副作用，不代表第几次网络尝试
effects(tenant_id, run_id, effect_id, tool_name, payload_hash,
        status, result_ref, UNIQUE(tenant_id, run_id, effect_id))

outbox(event_id, tenant_id, run_id, effect_id, payload_ref,
       status, lease_until, created_at)
```

```python
def prepare_effect(run, proposal):
    # model 仅提出动作；主体、权限和预算来自服务端可信上下文
    tool = registry.require_allowlisted(proposal.tool)
    args = tool.schema.validate(proposal.args)
    authorize(run.actor, tool, args)
    budget.reserve(run.id, estimate(tool, args))
    # 固定 effect ID 和 payload；重试不生成新的 ID
    effect = immutable_effect(run, tool, args)
    require_approval_bound_to(run.id, effect.id, effect.payload_hash)
    with db.transaction():
        db.insert_effect_once(effect)
        db.insert_outbox_once(effect)
        db.compare_and_swap_run(run.id, run.state_version)

def dispatch(effect):
    # 本地 unique 约束只解决本地竞争，不足以保证远端只写一次
    reply = effect.tool.call(
        effect.args, idempotency_key=effect.id, timeout=effect.timeout
    )
    persist_result_and_advance(effect, reply)
```

**必须随伪代码说明的边界：**

- `compare-and-swap`/租约/栅栏 token 可以防止旧 worker 覆盖新状态，但不能撤回已发出的远端网络请求。
- 下游幂等记录的保留期必须覆盖本系统可能的重试、恢复与人工补偿窗口；过期后同一 key 不再天然安全。
- payload 改变后不要复用原 effect；生成新的逻辑动作并重新审批。审批应绑定主体、动作目标、参数 hash 和状态版本，不能接受模型或检索文档中的“用户已同意”。
- checkpoint 保存原始工具结果或不可变引用，以及 prompt/model/tool schema/workflow 版本。新版本更改重放路径时，需要版本策略，不是把旧状态塞进新图就能保证可恢复。
- 外部工具超时只是“没有收到结果”，不等于“远端没有执行”。对于不可逆写入，状态必须能表达未知。

### 预算与 trace（设计建议，不宣称某框架默认提供）

预算要同时约束最大模型轮数、工具调用次数、token/金额、总时长与并发。调用前预留、调用后结算，超时不明时保留未决预算。每轮只看生成 tokens 会漏掉重试、embedding、reranker 和工具成本。

trace 至少关联 `run_id / step_id / logical_effect_id / attempt / parent_span`，记录工具名、输入 hash、检索源版本、延迟、消耗、重试原因与状态迁移；可审计引用即可，不应把内网文档、凭据和个人信息完整复制到日志。

### 最有说服力的验证

| 注入故障 | 应验证的不变量 |
| --- | --- |
| 接收请求后、首个 checkpoint 前杀进程 | admission 行可证明请求已接收，恢复不会把它当全新 run |
| 外部写入成功后、写本地结果前杀进程 | 重试使用相同 effect ID；支持幂等的下游只有一个业务对象 |
| 重复投递 outbox 事件 | 结果不新增第二个逻辑 effect |
| 审批后修改参数 | 旧审批失效；执行参数 hash 与批准 hash 完全一致 |
| 预算在重试期间耗尽 | 不发起下一次调用；未决调用仍进入对账 |
| workflow 升级后恢复旧 run | 通过兼容版本路径重放，或显式拒绝并迁移 |

建议演示：在本地状态机中切换“远端成功后崩溃”与“恢复”，观察“朴素重试产生两张工单”和“幂等键只产生一张”之间的差别。必须标为可重现的故障模型，不能冒充真实外部系统。

## 文章二：内网知识库，先做可证明的权限边界，再讨论向量库

### 不可省略的论点

1. **知识被检索到，不代表它可以被当前用户看见。** R3 明确指出，权限字符串本身没有认证语义。后端需要验证身份、映射可信组、施加 tenant 和源权限约束。模型生成的 group_id、浏览器直接传来的完整 ACL、源文档正文自称的权限都不可信。
2. **权限必须在每条检索路径成立。** BM25、向量、query rewrite、多跳检索、缓存命中、reranker 和 citation 原文回看均需相同授权约束。只在最终回答阶段删掉一段引用，会让未授权原文先进入模型、重排服务或 trace。
3. **预过滤与结果后过滤不等价。** R4：preFilter 在 HNSW 遍历中限制可选文档；高度选择性时可能更慢。postFilter 在各 shard 候选之后过滤，可能把全局相关且有权限的文档漏掉。不能把“top 10 检索后过滤成 0”解释为“知识库没有答案”。
4. **词法与语义检索互补。** 设备型号、工单号、函数名、错误码和原样条款通常需要精确词法信号；口语同义表达适合语义检索。R2 说明 BM25 是稳健基线，但不意味着它在每个具体语料都优于 dense。需要本域评测。
5. **RRF 不要求分值可比，但仍受候选窗口影响。** R5/R9 的融合只利用名次，避免直接把 BM25 分数与 cosine 相加。若关键文档在所有召回窗口之外，融合和 reranker 都无法把它凭空找回。
6. **重排不等于重新搜索。** R6 把它定义为初始 BM25/RRF 结果的第二阶段。一般性的 reranker 无法修复完全未召回的证据；Azure 前 50 的限制只能描述为该产品实现。
7. **“有 citation”不等于“论断被支撑”。** 需要记录 citation 对应的 source/chunk/version/文本位置，并检查回答中的实体、数字、条件是否真由这段证据支持。来源相关性和论断蕴含关系是两种检查。

### 建议的端到端管线

```text
身份校验与可信 tenant/group 解析
    → 查询规范化、保护精确标识符
    → 同一权限范围内 BM25 ∪ dense 召回
    → 按 chunk ID 去重、RRF 融合
    → 只对已授权候选重排
    → 邻接段落补全，并再次校验版本/ACL
    → 证据预算、去重与生成
    → 论断—证据核对、按不可变版本给引用
```

过滤器的形状（仅说明，不是直接拼接用户输入的代码）：

```text
tenant_id == authenticated_user.tenant
AND source_version == current_visible_version
AND deleted == false
AND any(allowed_principals ∩ authenticated_user.effective_principals)
```

实际实现必须使用 SDK 参数或严格的 filter 编码；认证信息从服务端会话/令牌解析，不能让 LLM 自己生成最终授权 filter。对于“公开”资料也应明确所在租户和公开范围，不能把空 ACL 自动解释成所有人可见。

### 文档切分与版本模型（设计建议）

```text
tenant_id, source_id, source_uri, source_version, acl_version,
chunk_id, parent_id, section_path, content_hash,
page_or_line_start, page_or_line_end, updated_at, deleted
```

切分先保持标题层级、表头、代码块和条款边界，再用 token 长度限制；固定每 N 字只是基线，不应切断表头与单位。可用子块做召回、父段做上下文补全，但父段也必须再次授权，不能因子块可见就返回整个含机密附件的父文档。

重复页眉页脚、扫描 OCR 错误、表格横向关系、错误版本与过大 overlap 都会损害检索；并非把 chunk_size 调小就一定更好。把“如何选 chunk size”写成实验矩阵：按文档类型 × 查询类型 × chunk/overlap × 召回/证据完整性 × 上下文成本评测，没有通用最优常数。

### RRF：可复算的小例子

对于结果列表集合 R，名次从 1 开始：

```text
RRF(d) = Σ[r ∈ R 且 d 在 r 中] 1 / (c + rank_r(d))
```

缺席某列表时贡献 0。`c` 是 rank constant，不能与最近邻候选数 k 或最终返回条数混为一谈。以下使用 c=60，仅为常见示例值，不宣称对所有语料最优。

| 文档 | BM25 名次 | dense 名次 | 本次实际计算的 RRF |
| --- | ---: | ---: | ---: |
| A | 1 | 3 | 1/61 + 1/63 = 0.0322664585 |
| B | 2 | 1 | 1/62 + 1/61 = 0.0325224749 |
| C | 缺席 | 2 | 1/62 = 0.0161290323 |

所以 B > A > C。RRF 只代表这些候选列表的共识，不能声称 0.0325 是答案正确概率。增加融合列表会改变分数尺度，不能跨不同查询布局套同一阈值。

```python
def rrf(lists, constant=60):
    score = {}
    for ranked_ids in lists:
        seen = set()
        for rank, chunk_id in enumerate(ranked_ids, start=1):
            if chunk_id in seen:
                continue
            seen.add(chunk_id)
            score[chunk_id] = score.get(chunk_id, 0) + 1 / (constant + rank)
    return sorted(score.items(), key=lambda item: (-item[1], item[0]))

# 所有列表必须已经由相同可信权限条件限定
lexical = bm25(query, filter=trusted_scope)
dense = vector(query_embedding, filter=trusted_scope)
fused = rrf([lexical.ids, dense.ids])
reranked = rerank(query, authorized_text(fused[:candidate_budget]))
```

### 权限撤销与缓存：容易被忽略的第二条数据通路

以下是基于 R3/R10 的工程推导，不是服务商自动承诺：如果索引中的权限和回答缓存落后于真实权限，撤销后仍可能读到旧答案。缓存 key 不能只有 query，也不能只加 user_id 就结束：至少绑定 tenant、有效权限指纹/权限版本、语料版本与检索/模型/prompt 版本。用户 membership 变化时，原 key 必须失效。

缓存值还需存证据的 source_version 与 ACL 版本；读取缓存和打开原文时都重验。变更事件要同时更新/失效 BM25、向量、parent 补全、结果缓存与生成缓存。短 TTL 是暴露窗口上限的一部分，不是立即撤销保证。若连接器同步有延迟，需要 deny overlay、实时源鉴权或明确的受控停用机制；删除文档与回滚版本也应走同一链路。

### 评测要拆开，不能只给一个“准确率”

| 层次 | 可执行的定义或测试 | 边界 |
| --- | --- | --- |
| 检索召回 | Recall@K = 前 K 个候选中的相关文档数 / 黄金相关文档总数；另看 MRR/nDCG | 黄金相关文档标注可能不完整；按精确标识符/多跳/时效/模糊问题分桶 |
| 排序 | nDCG@K / MRR，检查重排前后变化 | reranker 只能排序已有候选；单看最终答案会掩盖召回失败 |
| 生成依据 | 将回答拆为可核验论断，标注是否被引用文本支持 | R7 可辅助自动评估，但 LLM judge 存在模型偏差，不能代替人工校准 |
| 拒答 | 对无证据、冲突版本、过期条款的问题统计错误作答与错误拒答 | 拒答不是固定 confidence 阈值可普遍解决的问题 |
| 权限隔离 | 同一问题，A 有权、B 无权；覆盖缓存热命中、父段补全、引用原文与 trace | 未授权的标记字符串不应出现在任何下游服务输入或返回中 |
| 撤销 | 先访问并缓存，再撤销组成员或文档权限，再重复问题 | 单测过滤表达式不足以证明整条链路没有旧数据 |
| 成本/延迟 | p50/p95、召回/重排/生成分阶段时间、tokens 与调用数 | 演示不预设或编造真实生产分位数 |

建议用成对权限样例做站内合成演示：同一 query 在“研发/财务”身份下有不同候选集合；切换“检索后过滤”展示召回被候选窗口截断；切换“检索中约束”展示可见集合内排序。所有样例明确标为合成数据，真实系统的授权不能依赖页面上的角色切换器。

## 写作与引用注意

- 可以把“我会怎样设计”写为作者观点，但不要写成已经服务多少企业、达成多少百分比准确率的经历。
- 所有强断言挂对应来源；架构 schema、缓存 key 和故障验证属于作者的工程推导，应明确这种区别。
- 论文是机制和评测方法的来源，不是给本站的质量背书。
- 本站文章应提供可运行的核心算法/状态模型和复算数据，而不是贴一段依赖未说明的伪代码就称“生产可用”。
