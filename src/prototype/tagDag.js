/**
 * PROTOTYPE — 多父节点标签树（DAG）+ 环检测
 *
 * 问题：标签树从"单父节点（树）"升级为"多父节点（DAG）"，
 *       添加 parent→child 边时必须保证不形成环。
 *
 * 这是一个纯逻辑模块，不依赖任何 I/O 或 UI，可直接移植到正式代码中。
 *
 * 边方向约定：edge { source → target } 表示 source 是 target 的父节点，target 是 source 的子节点。
 * 环检测原理：添加 source→target 前，检查 target 是否已能到达 source（BFS 沿出边搜索）。
 * 层级限制：节点层级 = 从根到该节点的最长路径 + 1（根为第 1 级），最大不超过 MAX_LEVEL 级。
 */

/** 最大层级限制 */
export const MAX_LEVEL = 10

/** 创建空的标签 DAG */
export function createTagDag() {
  return {
    nodes: new Map(), // id -> { id, label }
    edges: [], // [{ source, target }]
    childrenMap: new Map(), // id -> Set<id>  出边邻接表
    parentMap: new Map(), // id -> Set<id>  入边邻接表
  }
}

/** 添加节点 */
export function addNode(dag, id, label) {
  if (dag.nodes.has(id)) {
    return { ok: false, error: `节点「${id}」已存在` }
  }
  dag.nodes.set(id, { id, label: label || id })
  if (!dag.childrenMap.has(id))
    dag.childrenMap.set(id, new Set())
  if (!dag.parentMap.has(id))
    dag.parentMap.set(id, new Set())
  return { ok: true }
}

/** 修改节点显示名称 */
export function updateNodeLabel(dag, id, label) {
  if (!dag.nodes.has(id))
    return { ok: false, error: `节点「${id}」不存在` }
  const text = (label || '').trim()
  if (!text)
    return { ok: false, error: '名称不能为空' }
  dag.nodes.get(id).label = text
  return { ok: true }
}

/** 移除节点及其所有关联边 */
export function removeNode(dag, id) {
  if (!dag.nodes.has(id)) {
    return { ok: false, error: `节点「${id}」不存在` }
  }
  // 通过邻接表 O(k) 清理关联边，k 为该节点的度
  const parents = dag.parentMap.get(id) || new Set()
  const children = dag.childrenMap.get(id) || new Set()
  for (const pid of parents) {
    dag.childrenMap.get(pid)?.delete(id)
  }
  for (const cid of children) {
    dag.parentMap.get(cid)?.delete(id)
  }
  dag.nodes.delete(id)
  dag.childrenMap.delete(id)
  dag.parentMap.delete(id)
  dag.edges = dag.edges.filter(e => e.source !== id && e.target !== id)
  return { ok: true }
}

/** 获取直接子节点（出边方向，O(1) 邻接表查询） */
export function getChildren(dag, id) {
  return [...(dag.childrenMap.get(id) || new Set())]
}

/** 获取直接父节点（入边方向，O(1) 邻接表查询） */
export function getParents(dag, id) {
  return [...(dag.parentMap.get(id) || new Set())]
}

/**
 * 检查添加 source→target 边是否会形成环。
 * 原理：BFS 从 target 出发沿出边搜索，若能到达 source 则会成环。
 */
export function wouldCreateCycle(dag, sourceId, targetId) {
  if (sourceId === targetId)
    return true // 自环

  const visited = new Set()
  const queue = [targetId]

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === sourceId)
      return true
    if (visited.has(current))
      continue
    visited.add(current)

    for (const child of getChildren(dag, current)) {
      if (!visited.has(child)) {
        queue.push(child)
      }
    }
  }
  return false
}

/** 添加边（含环检测 + 重复检测 + 自环检测） */
export function addEdge(dag, sourceId, targetId) {
  if (!dag.nodes.has(sourceId)) {
    return { ok: false, error: `源节点「${sourceId}」不存在` }
  }
  if (!dag.nodes.has(targetId)) {
    return { ok: false, error: `目标节点「${targetId}」不存在` }
  }
  if (sourceId === targetId) {
    return { ok: false, error: '不能添加自环边' }
  }
  // O(1) 邻接表判重，替代 O(E) 的 edges.some
  const childSet = dag.childrenMap.get(sourceId)
  if (childSet && childSet.has(targetId)) {
    return { ok: false, error: `边「${sourceId} → ${targetId}」已存在` }
  }
  if (wouldCreateCycle(dag, sourceId, targetId)) {
    return {
      ok: false,
      error: `添加边「${sourceId} → ${targetId}」会形成环（${targetId} 已能到达 ${sourceId}）`,
    }
  }
  if (wouldExceedMaxLevel(dag, sourceId, targetId)) {
    return {
      ok: false,
      error: `添加边「${sourceId} → ${targetId}」会超过最大层级限制（${MAX_LEVEL} 级）`,
    }
  }

  dag.edges.push({ source: sourceId, target: targetId })
  dag.childrenMap.get(sourceId).add(targetId)
  dag.parentMap.get(targetId).add(sourceId)
  return { ok: true }
}

/** 移除边 */
export function removeEdge(dag, sourceId, targetId) {
  const before = dag.edges.length
  dag.edges = dag.edges.filter(
    e => !(e.source === sourceId && e.target === targetId),
  )
  if (dag.edges.length === before) {
    return { ok: false, error: `边「${sourceId} → ${targetId}」不存在` }
  }
  dag.childrenMap.get(sourceId)?.delete(targetId)
  dag.parentMap.get(targetId)?.delete(sourceId)
  return { ok: true }
}

/** 获取所有祖先节点（能到达 id 的所有节点） */
export function getAncestors(dag, id) {
  const ancestors = new Set()
  const queue = getParents(dag, id)
  while (queue.length > 0) {
    const current = queue.shift()
    if (ancestors.has(current))
      continue
    ancestors.add(current)
    queue.push(...getParents(dag, current))
  }
  return [...ancestors]
}

/** 获取所有后代节点（从 id 出发可达的所有节点） */
export function getDescendants(dag, id) {
  const descendants = new Set()
  const queue = getChildren(dag, id)
  while (queue.length > 0) {
    const current = queue.shift()
    if (descendants.has(current))
      continue
    descendants.add(current)
    queue.push(...getChildren(dag, current))
  }
  return [...descendants]
}

/**
 * 计算节点层级（从根到该节点的最长路径 + 1，根节点为第 1 级）。
 * 多父节点取所有父节点层级最大值 + 1。
 */
export function getNodeLevel(dag, id, memo = new Map()) {
  if (memo.has(id))
    return memo.get(id)
  const parents = getParents(dag, id)
  if (parents.length === 0) {
    memo.set(id, 1)
    return 1
  }
  const level = 1 + Math.max(...parents.map(p => getNodeLevel(dag, p, memo)))
  memo.set(id, level)
  return level
}

/**
 * 计算从节点出发的最长向下链（边数，叶子节点为 0）。
 */
export function getMaxDownwardChain(dag, id, memo = new Map()) {
  if (memo.has(id))
    return memo.get(id)
  const children = getChildren(dag, id)
  if (children.length === 0) {
    memo.set(id, 0)
    return 0
  }
  const chain = 1 + Math.max(...children.map(c => getMaxDownwardChain(dag, c, memo)))
  memo.set(id, chain)
  return chain
}

/**
 * 检查添加 source→target 边后是否会导致任意节点层级超过 MAX_LEVEL。
 * 原理：新边使 target 层级可能变为 max(原层级, source层级+1)，
 *       若层级增加则级联影响所有后代，最深 = newTargetLevel + target的最长向下链。
 */
export function wouldExceedMaxLevel(dag, sourceId, targetId) {
  const memo = new Map()
  const sourceLevel = getNodeLevel(dag, sourceId, memo)
  const targetLevel = getNodeLevel(dag, targetId, memo)
  const newTargetLevel = Math.max(targetLevel, sourceLevel + 1)
  if (newTargetLevel <= targetLevel)
    return false // 层级不变，安全
  const maxChain = getMaxDownwardChain(dag, targetId, new Map())
  return newTargetLevel + maxChain > MAX_LEVEL
}

/**
 * 搜索节点（按 id 或 label 模糊匹配，不区分大小写）。
 * 返回匹配节点数组，每项附带层级信息。
 * limit 参数防止万级节点下返回过多结果。
 */
export function searchNodes(dag, keyword, limit = 50) {
  const kw = keyword.trim().toLowerCase()
  if (!kw)
    return []
  const results = []
  const memo = new Map()
  for (const node of dag.nodes.values()) {
    if (results.length >= limit)
      break
    if (
      node.id.toLowerCase().includes(kw)
      || node.label.toLowerCase().includes(kw)
    ) {
      results.push({ ...node, level: getNodeLevel(dag, node.id, memo) })
    }
  }
  return results
}

/** 转为 g6 v5 数据格式 */
export function toG6Data(dag) {
  return {
    nodes: [...dag.nodes.values()].map(n => ({
      id: n.id,
      data: { label: n.label },
    })),
    edges: dag.edges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
    })),
  }
}

/** 获取状态摘要（轻量版，不生成全量字符串数组） */
export function getStateSummary(dag) {
  return {
    nodeCount: dag.nodes.size,
    edgeCount: dag.edges.length,
    edges: dag.edges.slice(0, 200).map(e =>
      `${dag.nodes.get(e.source)?.label || e.source} → ${dag.nodes.get(e.target)?.label || e.target}`,
    ),
  }
}

/** 创建带示例数据的 DAG（10 级深链，多分类维度交叉，含多个多父节点） */
export function createSampleDag() {
  const dag = createTagDag()

  // L1 两个独立分类维度
  addNode(dag, 'animal', '动物')
  addNode(dag, 'purpose', '用途')

  // L2
  addNode(dag, 'dog', '狗')
  addNode(dag, 'cat', '猫')
  addNode(dag, 'sled', '雪橇犬')
  addNode(dag, 'working', '工作犬')
  addNode(dag, 'pet-cat', '宠物猫')
  addEdge(dag, 'animal', 'dog')
  addEdge(dag, 'animal', 'cat')
  addEdge(dag, 'purpose', 'sled')
  addEdge(dag, 'purpose', 'working')
  addEdge(dag, 'purpose', 'pet-cat')

  // L3 — 多父节点：同一标签同时从属于「物种」和「用途」两个维度
  addNode(dag, 'husky', '哈士奇') // 父：狗 + 雪橇犬
  addNode(dag, 'golden', '金毛') // 父：狗 + 工作犬
  addNode(dag, 'corgi', '柯基')
  addNode(dag, 'ragdoll', '布偶猫') // 父：猫 + 宠物猫
  addNode(dag, 'siamese', '暹罗猫') // 父：猫 + 宠物猫
  addNode(dag, 'alaskan', '阿拉斯加')
  addNode(dag, 'gsd', '德牧')
  addEdge(dag, 'dog', 'husky')
  addEdge(dag, 'dog', 'golden')
  addEdge(dag, 'dog', 'corgi')
  addEdge(dag, 'cat', 'ragdoll')
  addEdge(dag, 'cat', 'siamese')
  addEdge(dag, 'sled', 'husky')
  addEdge(dag, 'working', 'golden')
  addEdge(dag, 'pet-cat', 'ragdoll')
  addEdge(dag, 'pet-cat', 'siamese')
  addEdge(dag, 'sled', 'alaskan')
  addEdge(dag, 'working', 'gsd')

  // L4
  addNode(dag, 'silver-husky', '银化哈士奇')
  addNode(dag, 'short-ragdoll', '短毛布偶')
  addNode(dag, 'golden-pup', '金毛幼犬')
  addNode(dag, 'gsd-pup', '德牧幼犬')
  addEdge(dag, 'husky', 'silver-husky')
  addEdge(dag, 'ragdoll', 'short-ragdoll')
  addEdge(dag, 'golden', 'golden-pup')
  addEdge(dag, 'gsd', 'gsd-pup')

  // L5
  addNode(dag, 'silver-pup', '银化幼犬')
  addNode(dag, 'ragdoll-pup', '布偶幼猫')
  addNode(dag, 'golden-grand', '金毛孙')
  addNode(dag, 'gsd-grand', '德牧孙')
  addEdge(dag, 'silver-husky', 'silver-pup')
  addEdge(dag, 'short-ragdoll', 'ragdoll-pup')
  addEdge(dag, 'golden-pup', 'golden-grand')
  addEdge(dag, 'gsd-pup', 'gsd-grand')

  // L6 — 银化血系：从「狗支」与「猫支」两个维度同时汇入（深层多父节点）
  addNode(dag, 'silver-blood', '银化血系')
  addNode(dag, 'golden-blood', '金毛血系')
  addNode(dag, 'gsd-blood', '德牧血系')
  addEdge(dag, 'silver-pup', 'silver-blood')
  addEdge(dag, 'ragdoll-pup', 'silver-blood')
  addEdge(dag, 'golden-grand', 'golden-blood')
  addEdge(dag, 'gsd-grand', 'gsd-blood')

  // L7 — 第一代：从「银化血系」与「金毛血系」两个维度同时汇入（深层多父节点）
  addNode(dag, 'gen1', '第一代')
  addNode(dag, 'gsd-gen1', '德牧一代')
  addEdge(dag, 'silver-blood', 'gen1')
  addEdge(dag, 'golden-blood', 'gen1')
  addEdge(dag, 'gsd-blood', 'gsd-gen1')

  // L8
  addNode(dag, 'gen2', '第二代')
  addNode(dag, 'gsd-gen2', '德牧二代')
  addEdge(dag, 'gen1', 'gen2')
  addEdge(dag, 'gsd-gen1', 'gsd-gen2')

  // L9
  addNode(dag, 'gen3', '第三代')
  addNode(dag, 'gsd-gen3', '德牧三代')
  addEdge(dag, 'gen2', 'gen3')
  addEdge(dag, 'gsd-gen2', 'gsd-gen3')

  // L10 — 第四代：从「第三代」与「德牧三代」两个维度同时汇入（深层多父节点，已达最大层级）
  addNode(dag, 'gen4', '第四代')
  addEdge(dag, 'gen3', 'gen4')
  addEdge(dag, 'gsd-gen3', 'gen4')

  return dag
}

/**
 * 创建大规模样本 DAG（约 1000 个节点）
 * 结构：多棵宽树 + 部分跨树多父节点边，保持无环且不超过 MAX_LEVEL 级
 * @param {number} targetNodes 目标节点数
 */
export function createLargeSampleDag(targetNodes = 1000) {
  const dag = createTagDag()
  const maxLevel = MAX_LEVEL

  // 根节点数量：用多棵并行子树来填充节点
  const rootCount = 10
  const roots = []
  for (let i = 0; i < rootCount; i++) {
    const id = `root-${i}`
    addNode(dag, id, `根${i}`)
    roots.push(id)
  }

  let nodeCounter = rootCount
  const allIds = [...roots]

  // BFS 逐层扩展，直到达到目标节点数或最大层级
  let currentLevelIds = [...roots]
  let level = 1

  while (nodeCounter < targetNodes && level < maxLevel) {
    const nextLevelIds = []
    // 每个当前层节点生成若干子节点
    const childrenPerNode = Math.max(1, Math.ceil((targetNodes - nodeCounter) / currentLevelIds.length))
    for (const parentId of currentLevelIds) {
      if (nodeCounter >= targetNodes) break
      const actualChildren = Math.min(childrenPerNode, targetNodes - nodeCounter)
      for (let c = 0; c < actualChildren; c++) {
        const childId = `n-${nodeCounter}`
        const childLabel = `节点${nodeCounter}`
        addNode(dag, childId, childLabel)
        addEdge(dag, parentId, childId)
        allIds.push(childId)
        nextLevelIds.push(childId)
        nodeCounter++
      }
    }
    currentLevelIds = nextLevelIds
    level++
  }

  // 添加一些跨树多父节点边（不形成环、不超层级）
  // 选取同层或相邻层的节点建立额外父子关系
  const crossEdgeCount = Math.min(200, Math.floor(targetNodes * 0.2))
  let addedCross = 0
  for (let i = 0; i < crossEdgeCount && addedCross < crossEdgeCount; i++) {
    // 随机选一个非根节点作为 target
    const targetIdx = rootCount + Math.floor(Math.random() * (allIds.length - rootCount))
    const targetId = allIds[targetIdx]
    // 随机选一个不同子树的根路径上的节点作为 source
    const sourceIdx = Math.floor(Math.random() * allIds.length)
    const sourceId = allIds[sourceIdx]
    if (sourceId === targetId) continue
    // 尝试添加，失败则跳过
    const result = addEdge(dag, sourceId, targetId)
    if (result.ok) addedCross++
  }

  return dag
}
