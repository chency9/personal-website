import { callout, citation, codeBlock } from './types';
import type { TechnicalNote } from './types';
const runtime = 'durable-agent-runtime';
const a = (n: number) => citation(runtime, n);
const rag = 'permission-aware-rag';
const r = (n: number) => citation(rag, n);

export const agentNotes: TechnicalNote[] = [
{
  slug: runtime, category: 'Agent 底座', eyebrow: 'AGENT SYSTEMS / STATE, REPLAY & SIDE EFFECTS',
  title: '让 Agent 从故障中继续：检查点、幂等键与副作用边界',
  summary: '把一次推理循环拆成可恢复的运行状态，沿着“写入成功但回执丢失”的故障，设计工具执行、审批、Outbox 和预算。',
  readingMinutes: 14, topics: ['Checkpoint / Replay', 'Idempotency / Outbox', 'Approval / Budget'],
  question: 'Agent 创建工单成功后进程崩溃，恢复时再调用一次，究竟是恢复，还是又办了一遍？',
  lead: `<p>一个 while 循环，加上模型和工具，就能做出会干活的 Agent。真正困难的是它干到一半断电、模型请求超时、用户改了权限之后，还能说明白：已经做了什么、可以重试什么、哪些结果仍然未知。</p><p>这里研究的是执行底座，不预设某个模型胜出。状态存储、确定性重放、外部副作用和授权边界，比框架名称更能决定系统能否被恢复与审计。下面的表与 schema 是一种设计方案，不是在声称本站已经部署了这样的生产服务。</p>`,
  sections: [
    { id: 'state-not-chat', title: '聊天记录不是运行状态', body: `
      <p>messages 能保存对话，却不能自然回答哪个逻辑步骤已提交、哪个工具只是发出请求、谁批准了这次写入。运行状态至少需要三层标识：</p><ul><li><strong>run_id：</strong>一次业务任务，绑定租户、发起者、工作流版本和总预算。</li><li><strong>step_id / effect_id：</strong>一个逻辑步骤或副作用，在网络重试中保持稳定。</li><li><strong>attempt：</strong>同一逻辑调用的第几次尝试。它可以增长，但不能替代 effect_id。</li></ul>
      <p>模型输出也不是可任意重做的纯函数。当前时间、随机数、数据库读取、LLM 生成都可能改变结果。Temporal 要求 Workflow 的重放保持确定性，把 LLM、API 和数据库等外部操作放进 Activity；已完成结果由运行历史重放，不是把整段代码当成新任务再执行。${a(1)}${a(2)}</p>
      <div class="note-formula">QUEUED → RUNNING → WAIT_APPROVAL → RUNNING → SUCCEEDED
                ↘ RETRY_WAIT → RUNNING
                ↘ UNCERTAIN → RECONCILE
                ↘ FAILED / CANCELLED / BUDGET_EXHAUSTED</div>
      <p>这个状态机允许表达“我不知道远端是否完成”。超时意味着没有收到回执，不等于远端没有执行。把所有错误都变成 RETRY_WAIT，会把不可判定的副作用误当成安全的重复计算。</p>` },
    { id: 'checkpoint-boundary', title: '检查点保证恢复边界，不保证外部事务', body: `
      <p>LangGraph 的检查点以 thread 和执行阶段组织状态，跨 thread 的长期数据则属于另一层 store。持久化模式也有不同崩溃窗口：${a(3)}${a(6)}</p>
      <div class="note-table-scroll" tabindex="0" role="region" aria-label="检查点模式与崩溃窗口"><table><thead><tr><th>模式</th><th>落盘时机</th><th>需要接受的边界</th></tr></thead><tbody><tr><td>sync</td><td>下一步前完成写入</td><td>多一次同步等待；远端副作用仍不在本地事务里</td></tr><tr><td>async</td><td>下一步与持久化并行</td><td>进程崩溃可能丢掉尚未落盘的状态</td></tr><tr><td>exit</td><td>退出边界</td><td>不保护执行中途进程崩溃的中间状态</td></tr></tbody></table></div>
      <p>即便采用 sync，在第一个 durable checkpoint 写好以前，单靠检查点也难区分“从未接收请求”和“接收后丢了状态”。入口还应记录 admission/run，确保任务接收本身可被追踪。检查点需要保存原始工具结果或不可变引用，以及 workflow、prompt、模型、工具 schema 的版本；升级代码后恢复旧 run，必须有兼容策略。</p>
      <p>另一个容易踩的点是审批中断：LangGraph interrupt 恢复时，<strong>整个节点会从头执行</strong>，不是从代码光标继续。中断前若已经发送邮件、创建记录或调用付费 API，恢复时可能再做一次。副作用要放在正确边界，且具备幂等语义。${a(4)}</p>` },
    { id: 'uncertain-effect', title: '一次写入，存在两个系统的提交点', body: `
      <p>设本地先记录 PREPARED，再调用远端建工单。远端创建成功，进程却在保存 tool_result 前崩溃。恢复后，本地看见的仍是 PREPARED：</p>
      <div class="note-formula">本地 PREPARED(effect_id, payload_hash)
  → 远端 create_ticket(effect_id) 已成功
  → 回执丢失 / 本地进程崩溃
  → 本地没有结果，不能据此判断“远端未执行”</div>
      <p>如果每次重试都生成随机 request_id，远端就会把它当成全新业务。正确方向是重用同一逻辑 effect_id，并由副作用接收方在自己的事务中把幂等键、业务写入和首次结果一起保存。第二次调用同一个键，应得到第一次的结果。</p>
      <div data-note-demo="agent" class="note-demo"></div>
      ${callout('没有幂等协议时，未知就必须保持未知', '本地 UNIQUE 约束能避免本地重复计划，却不能保证另一台机器只执行一次。下游不支持幂等键、也查不到首次调用结果时，应进入 UNCERTAIN / RECONCILE，采用查询、人工核对或明确补偿，不能许诺“自动重试且绝不重复”。')}
      <p>还要给幂等性加上期限与参数约束：键的保留期必须覆盖重试、恢复和人工对账窗口；同一个键却换了 payload，应该拒绝而不是偷偷执行。参数变化意味着新逻辑动作，需要新的 effect_id 与新审批。</p>` },
    { id: 'outbox-and-tool-contract', title: '把工具调用变成可提交的意图', body: `
      <p>一个可实现的最小存储骨架如下，字段是本文的设计建议。tenant_id 不能只写进表而不参与授权查询；state_version 用于并发控制；effect_id 则约束逻辑副作用。</p>
      ${codeBlock('SQL · 结构草图', `runs(tenant_id, run_id, actor_id, workflow_version,
     state_version, status, checkpoint_ref, trace_id)

effects(tenant_id, run_id, effect_id, tool_name,
        payload_hash, status, result_ref,
        UNIQUE(tenant_id, run_id, effect_id))

outbox(event_id, tenant_id, run_id, effect_id,
       payload_ref, status, lease_until)`)}
      <p>先将执行意图、待发消息和运行状态变更放在同一个本地事务中，再由 worker 分发。Transactional Outbox 消除了“业务写入成功却没记录待发消息”这一类本地双写问题；但 relay 在发出后、标记成功前仍可能崩溃，所以重复投递依然存在，消费者必须幂等。${a(5)}</p>
      ${codeBlock('Python · 执行契约伪代码', `def prepare(run, proposal):
    # 身份、租户、权限来自服务端可信上下文
    tool = registry.require_allowlisted(proposal.tool)
    args = tool.schema.validate(proposal.args)
    authorize(run.actor, tool, args)
    effect = immutable_effect(run, tool, args)
    require_approval(effect.id, effect.payload_hash)
    with db.transaction():
        reserve_budget_once(effect.id)
        insert_effect_once(effect)
        insert_outbox_once(effect)
        compare_and_swap_run(run.id, run.state_version)
        # CAS 失败则回滚，不能继续派发

def dispatch(effect):
    result = effect.tool.call(
        effect.args, idempotency_key=effect.id,
        timeout=effect.timeout)
    persist_result_and_advance(effect, result)`)}
      <p>审批不能只是“用户说了可以”。它应绑定主体、动作目标、参数 hash 和状态版本；检索文档或模型输出里的“已获批准”不能替代授权。租约或 fencing token 可以限制旧 worker 提交新状态，却不能撤回已经发出的网络请求。这两道边界需要分别处理。</p>` },
    { id: 'budgets-and-invariants', title: '预算和故障不变量，才是上线前的考题', body: `
      <p>“最多思考十轮”只是预算的一部分。还需要约束工具调用次数、token/金额、总时长与并发；调用前预留，调用后结算，超时不明时保留未决账。Embedding、重排和重试都可能消耗成本，不能只统计最终回答的 token。</p><p>trace 至少关联 run_id、step_id、effect_id、attempt 与父 span，记录状态变化、工具名、输入 hash、源文档版本、时延与重试原因。审计不等于把内网原文、凭据和个人信息完整复制到日志；保存受控引用往往更合适。</p>
      <div class="note-table-scroll" tabindex="0" role="region" aria-label="Agent 故障注入与不变量"><table><thead><tr><th>故障注入</th><th>需要保持的不变量</th></tr></thead><tbody><tr><td>接收后、首个 checkpoint 前杀进程</td><td>admission 能证明任务已接收</td></tr><tr><td>外部写入后、保存结果前崩溃</td><td>沿用 effect_id；支持幂等的下游只有一份业务结果</td></tr><tr><td>重复投递 Outbox</td><td>不产生第二个逻辑副作用</td></tr><tr><td>审批后修改参数</td><td>旧审批失效，参数 hash 必须匹配</td></tr><tr><td>重试时耗尽预算</td><td>不发下一次调用，未决动作仍进入对账</td></tr><tr><td>升级后恢复旧 run</td><td>走兼容版本路径或显式迁移，不默默套用新图</td></tr></tbody></table></div>
      <p>这些验证不是模型评测的替代品。模型可能选错工具，底座也可能重复执行一个本来选对的工具；前者是决策质量，后者是执行语义。只有分开测，才能知道要修 prompt、工具契约，还是事务边界。</p>` },
  ],
  conclusion: '可恢复的 Agent 不只是能把循环再跑起来，而是能解释恢复后哪些步骤被重放、哪些结果被复用、哪些副作用仍需对账。把推理结果、持久化状态和外部效果分开，自动化才有可靠的边界。',
  sources: [
    { title: 'Workflow Definition', publisher: 'Temporal Documentation', url: 'https://docs.temporal.io/workflow-definition', supports: '确定性重放；LLM、API、数据库等非确定操作应隔离为 Activities。' },
    { title: 'Activities', publisher: 'Temporal Documentation', url: 'https://docs.temporal.io/activities', supports: 'Activity 的重试与幂等要求，不意味着外部 exactly-once。' },
    { title: 'Checkpointers', publisher: 'LangGraph / LangChain Documentation', url: 'https://docs.langchain.com/oss/python/langgraph/checkpointers', supports: '检查点、thread、持久化模式及对应的进程崩溃窗口。' },
    { title: 'Interrupts', publisher: 'LangGraph / LangChain Documentation', url: 'https://docs.langchain.com/oss/python/langgraph/interrupts', supports: '中断恢复从节点头重跑，之前的副作用需要幂等。' },
    { title: 'Transactional Outbox', publisher: 'Chris Richardson / Microservices.io', url: 'https://microservices.io/patterns/data/transactional-outbox.html', supports: '本地事务记录待发消息；relay 仍可能重复投递，消费者仍需幂等。' },
    { title: 'Persistence', publisher: 'LangGraph / LangChain Documentation', url: 'https://docs.langchain.com/oss/python/langgraph/persistence', supports: 'thread 内状态、长期 store 与内存持久化的区别。' },
  ],
},
{
  slug: rag, category: '内网知识库', eyebrow: 'KNOWLEDGE SYSTEMS / PERMISSIONS, RETRIEVAL & EVIDENCE',
  title: '内网知识库的难点，藏在检索之前：ACL、混合召回与证据链',
  summary: '从可信身份到权限撤销，设计两路检索、RRF、重排、引用和缓存；用成对权限测试，而不是一个笼统准确率验收。',
  readingMinutes: 15, topics: ['ACL / Hybrid retrieval', 'RRF / Reranking', 'Evidence / Evaluation'],
  question: '同一个问题，研发和人事应该看到不同的证据；那权限究竟在哪一步生效？',
  lead: `<p>把文档切块、算向量、塞进向量库，再接一个模型，足够做出能回答问题的演示。放进内网之后，问题变了：它会不会读到不该读的文件？撤销权限后，旧缓存还会不会泄露？答案引用了文件名，是否真的由那段原文支撑？</p><p>原始 RAG 把参数记忆与非参数检索结合起来，但它本身不是访问控制协议，也不保证每个回答有依据。这篇把权限、召回、证据和评测拆开，给出一条可检查的数据路径。${r(8)}</p>`,
  sections: [
    { id: 'trusted-scope', title: '先确定“谁能看”，再问“哪篇最相关”', body: `
      <p>安全过滤字段只是字符串，不会自动认证身份。微软的 security filter 文档明确：应用需要认证用户、取得可信 grants，并保证每条查询都带权限条件。不能让浏览器或 LLM 直接决定最终 group_id 列表。${r(1)}</p>
      <div class="note-formula">可信身份与租户解析
  → 权限范围内的 BM25 与向量召回
  → 去重 / RRF 融合
  → 已授权候选重排
  → 邻接段落补全 + 再鉴权
  → 证据预算 / 生成
  → 论断核对 / 引用原文鉴权</div>
      <p>一个过滤条件的逻辑形状可以是：tenant 相同、版本有效、未删除，且 allowed_principals 与当前有效主体集合有交集。过滤语法应由 SDK 或严格编码构建；身份来自服务端会话。空 ACL 应默认拒绝，租户内公开文档则显式拥有对应公开主体，不能把“没写权限”理解成全网可见。</p>
      <p>权限要覆盖词法检索、向量检索、查询改写、多跳检索、父段补全、缓存和原文引用。只在最终回答里删掉一句话，已经太晚：未授权原文可能早已进入模型、reranker 或 trace。</p>
      ${callout('preFilter 不等于先物理删掉全部向量', '在 Azure 的实现里，preFilter 在各 shard 的 HNSW 遍历中约束可选候选；它可能增加查询成本。postFilter 则在候选产生后过滤，高选择性条件与小 k 可能造成有权相关文档未被召回。这里的 pre/post 是检索语义，不是让模型在回答末尾判断权限。')}
      <p>因此，“先取 top 10，再删到 0”不能证明知识库没有答案。需要区分无证据、权限内召回不足与真正没有可见文档。${r(2)}</p>` },
    { id: 'chunk-and-version', title: '切分不是只选一个 chunk_size', body: `
      <p>制度、代码、表格和扫描件有不同的结构。先保留标题层级、表头、单位、代码块与条款边界，再用 token 长度限制。每隔固定字数切一刀可以当基线，但不能把一个数值和它的单位切到两边，再期待模型自行补全。</p>
      ${codeBlock('文档与 chunk 元数据 · 设计草图', `tenant_id, source_id, source_uri, source_version, acl_version,
chunk_id, parent_id, section_path, content_hash,
page_or_line_start, page_or_line_end, updated_at, deleted,
embedding_model_revision`)}
      <p>用小子块做召回、大父段做补全，有机会兼顾召回粒度和证据完整性，但父段必须再次鉴权。一个可见子块不代表整个附件或父目录都可见。标题路径、页码和内容 hash 还用于把引用锚定到不可变版本。</p><p>重复页眉、OCR 错字、表格列关系、错误版本和过大 overlap 都会损害检索。这里没有通用最优块大小。可按“文档类型 × 查询类型 × chunk/overlap”做实验，同时记录授权相关文档召回、证据完整性和上下文 token；Embedding 模型版本也要一致，不能把不同向量空间混在一个相似度比较中。这些是本文建议的验证维度。</p>` },
    { id: 'hybrid-and-rrf', title: 'RRF 融合名次，不把不同分数硬加', body: `
      <p>设备型号、错误码、工单号和函数名需要词法精确匹配；口语、同义表达则可能受益于语义检索。BEIR 的跨域基准提示 BM25 是不能轻易跳过的强基线，却不意味着它在每份内网语料上必胜。应拿本域标注集比较，而不是先选一个时髦名词。${r(6)}</p>
      <p>BM25 分数和 cosine 相似度不是同一量纲。RRF 用每一路的名次累加，避免直接混加原始分值：${r(3)}${r(4)}</p>
      <div class="note-formula">RRF(d) = Σ[r 中包含 d] 1 / (c + rankᵣ(d))
名次从 1 开始；缺席某一路时，该路贡献为 0。
c 是 rank constant，不是近邻候选数 k，也不是最终返回条数。</div>
      <p>取 c=60，仅作可复算示例：A 在两路为 (1,3)，B 为 (2,1)，C 仅在第二路排 2：</p>
      <div class="note-table-scroll" tabindex="0" role="region" aria-label="RRF 数值例子"><table><thead><tr><th>文档</th><th>词法名次</th><th>向量名次</th><th>RRF</th></tr></thead><tbody><tr><td>A</td><td>1</td><td>3</td><td>1/61+1/63 ≈ .03226646</td></tr><tr><td>B</td><td>2</td><td>1</td><td>1/62+1/61 ≈ .03252247</td></tr><tr><td>C</td><td>缺席</td><td>2</td><td>1/62 ≈ .01612903</td></tr></tbody></table></div>
      <p>融合得到 B&gt;A&gt;C；.0325 不是答案正确的概率。改变融合列表数会改变分数尺度，也不能跨不同检索布局套用同一个“自信阈值”。候选窗口更是硬边界：关键文档在所有列表里都未出现，融合无法凭空找回它。</p>
      ${codeBlock('Python · RRF 核心与权限边界', `def rrf(ranked_lists, c=60):
    scores = {}
    for ids in ranked_lists:
        seen = set()
        for rank, chunk_id in enumerate(ids, start=1):
            if chunk_id in seen:
                continue
            seen.add(chunk_id)
            scores[chunk_id] = scores.get(chunk_id, 0) + 1 / (c + rank)
    return sorted(scores.items(), key=lambda x: (-x[1], x[0]))

# 两路都已经由同一可信授权范围约束
lexical = bm25(query, filter=trusted_scope)
dense = vector(query_embedding, filter=trusted_scope)
fused = rrf([lexical.ids, dense.ids])`)}
      <div data-note-demo="rag" class="note-demo"></div>` },
    { id: 'rerank-and-citations', title: '重排不能补回丢失证据，引用也不是装饰', body: `
      <p>reranker 只能在已有候选里重新排序。微软的语义排序明确放在初始 BM25 或 RRF 之后；其服务只将前 50 条交给该阶段，这是产品实现限制，不是所有 RAG 系统的定理。完全没有被召回的段落，不会因为加了 reranker 自动出现。${r(5)}</p>
      <p>重排后还有上下文预算问题：去掉重复块、保留必要条件与表头，优先保证回答所需的证据完整，而不是把 top K 全拼进去。相邻补全时重新检查版本与权限；原文中的指令始终是数据，不能因此取得工具执行权。</p>
      <p>引用至少要定位到 source_id、source_version、chunk_id 和原文位置。然后检查回答中的实体、数字、否定、适用范围是否真的被这段证据支持。比如原文说“试用期内需负责人审批”，回答却写成“所有员工都需审批”，即使引对文件，也扩大了规则范围。</p>
      ${callout('相关性与支撑关系，是两道检查', '文档主题相关，不能推出每个论断都被原文蕴含。证据不足时应说明缺了什么；版本冲突时保留来源与生效时间，不让模型随意合并成一条从未存在的制度。')}` },
    { id: 'revocation-and-cache', title: '撤销权限后，缓存是另一条数据通路', body: `
      <p>检索路径守住了，旧答案缓存仍可能漏出原文。缓存 key 只有 query 肯定不够；只加 user_id 也不够，因为用户可能已经被移出授权组。以下是本文基于权限边界推导的设计建议，不是云服务自动提供的保证：</p>
      <div class="note-formula">cache_key = hash(
  tenant, effective_permissions_fingerprint, acl_version,
  corpus_version, query, retrieval_version,
  embedding_revision, model_revision, prompt_revision
)</div>
      <p>缓存值还应保存证据版本与 ACL 版本，命中时重新验证。变更事件要同时影响 BM25、向量索引、父段补全、检索缓存、生成缓存和原文链接。删除文档和回滚版本也走同一条失效链路。</p><p>短 TTL 只能限制陈旧窗口，不是立即撤销承诺。若连接器同步有延迟，需要额外的 deny overlay、实时源鉴权或受控停用机制。不能把“每五分钟同步一次”描述成“权限修改即时生效”。普通字符串过滤与某产品原生权限继承也不是同一能力，接入每种数据源前都要逐项核实。${r(1)}</p>` },
    { id: 'evaluation', title: '别用一个准确率掩盖六种失败', body: `
      <p>把评测拆成检索、排序、生成依据、拒答、权限与时效。Ragas 的研究也分别考虑上下文质量和忠实生成；自动评估可以辅助，不能代替本域黄金集和真正的授权测试。${r(7)}</p>
      <div class="note-table-scroll" tabindex="0" role="region" aria-label="知识库分层评测"><table><thead><tr><th>层次</th><th>如何测</th><th>容易遗漏的边界</th></tr></thead><tbody><tr><td>召回</td><td>Recall@K、MRR / nDCG</td><td>黄金集需按当前身份可见范围定义，分精确标识符、模糊与多跳问题</td></tr><tr><td>重排</td><td>重排前后 nDCG / MRR</td><td>候选之外的证据仍然不存在</td></tr><tr><td>依据</td><td>逐条论断与引用对照</td><td>模型 judge 需要人工校准</td></tr><tr><td>拒答</td><td>无证据、冲突版本、过期规则</td><td>既测乱答，也测错误拒答</td></tr><tr><td>权限</td><td>同问题，有权 A / 无权 B 成对测试</td><td>覆盖热缓存、父段、引用与 trace</td></tr><tr><td>撤销</td><td>访问并缓存→撤权→再次询问</td><td>仅测试过滤表达式远远不够</td></tr></tbody></table></div>
      <p>检索 Recall@K 的一个可执行定义是：前 K 个候选中的授权相关文档数，除以当前身份下黄金授权相关文档总数。不存在授权相关证据时要单列无答案集合，不把分母 0 混进平均值。权限测试则在不可见资料里放独特标记，检查它是否出现在任何下游服务输入、返回、引用或日志中。</p><p>最后才看分阶段时延、p50/p95、token 与调用成本，并固定语料版本与问题集合。没有实际部署和测量，不能给出一个看似漂亮的“95% 准确率”作为收尾。</p>` },
  ],
  conclusion: '一个可信的知识库，需要能解释：为什么召回这段、为什么当前用户能看、这句话由哪一版原文支撑，以及权限变化后旧答案如何失效。向量库是其中一环，证据与权限才贯穿整条链路。',
  sources: [
    { title: 'Security filter pattern for trimming results', publisher: 'Microsoft Learn / Azure AI Search', url: 'https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search', supports: '字符串过滤不认证身份；应用负责可信主体、所有查询的权限约束及防绕过。' },
    { title: 'Filters in vector queries', publisher: 'Microsoft Learn / Azure AI Search', url: 'https://learn.microsoft.com/en-us/azure/search/vector-search-filters', supports: 'HNSW preFilter、postFilter 的执行位置、召回与延迟取舍。' },
    { title: 'Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods', publisher: 'Cormack, Clarke, Büttcher · SIGIR 2009 原论文', url: 'https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf', supports: 'RRF 的原始研究；不将论文的实验成绩作为本站成绩。' },
    { title: 'Relevance scoring in hybrid search using RRF', publisher: 'Microsoft Learn / Azure AI Search', url: 'https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking', supports: '名次融合、rank constant 与候选 k 的区别，以及语义重排的位置。' },
    { title: 'Semantic ranking overview', publisher: 'Microsoft Learn / Azure AI Search', url: 'https://learn.microsoft.com/en-us/azure/search/semantic-search-overview', supports: '语义重排只处理初始结果；前 50 条是该产品实现的限制。' },
    { title: 'BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models', publisher: 'Thakur et al. · 2021 原论文', url: 'https://arxiv.org/abs/2104.08663', supports: '跨域检索评测和 BM25 基线；不能推导任何具体内网语料的必胜方案。' },
    { title: 'Ragas: Automated Evaluation of Retrieval Augmented Generation', publisher: 'Es et al. · 2023 原论文', url: 'https://arxiv.org/abs/2309.15217', supports: '将检索上下文、忠实生成与回答质量分开评估的思路。' },
    { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', publisher: 'Lewis et al. · 2020 原论文', url: 'https://arxiv.org/abs/2005.11401', supports: '参数记忆与非参数检索结合的 RAG 原始机制。权限管线是本文的工程分析。' },
  ],
},
];
