/**
 * PROTOTYPE — 动物分类 DAG 数据生成器
 *
 * 两层 DAG：维度（根） → 叶子节点（具体品种）
 * 同一品种可出现在多个维度下（多父节点），形成 DAG。
 * 生成约 targetCount 个节点，用于测试大规模图节点选取交互。
 */

/** 分类维度（扁平结构：维度 → 叶子节点列表） */
const DIMENSIONS = [
  {
    name: '按品种分类',
    items: [
      '哈士奇', '金毛', '拉布拉多', '泰迪', '柯基', '边牧', '德牧', '萨摩耶', '柴犬', '阿拉斯加',
      '英短', '美短', '布偶', '暹罗', '波斯猫', '缅因猫', '橘猫', '狸花猫',
      '灰狼', '红狼', '赤狐', '北极狐', '狮子', '老虎', '豹', '猎豹',
    ],
  },
  {
    name: '按用途分类',
    items: [
      '哈士奇', '阿拉斯加', '德牧', '拉布拉多', '边牧', '杜宾', '罗威纳',
      '金毛', '泰迪', '柯基', '柴犬', '萨摩耶', '英短', '布偶',
      '藏獒', '猎狐犬', '比格犬', '吉娃娃', '博美', '雪纳瑞', '贵宾',
    ],
  },
  {
    name: '按体型分类',
    items: [
      '泰迪', '柯基', '柴犬', '吉娃娃', '博美',
      '哈士奇', '边牧', '萨摩耶', '英短', '暹罗',
      '金毛', '拉布拉多', '德牧', '阿拉斯加', '藏獒', '缅因猫',
      '杜宾', '罗威纳', '雪纳瑞', '贵宾',
    ],
  },
  {
    name: '按产地分类',
    items: [
      '柴犬', '藏獒', '狸花猫', '暹罗',
      '德牧', '杜宾', '罗威纳', '英短', '波斯猫',
      '金毛', '美短', '猎狐犬', '比格犬',
      '哈士奇', '阿拉斯加', '萨摩耶', '北极狐',
      '布偶', '缅因猫', '博美',
    ],
  },
]

/**
 * 生成动物分类 DAG 数据（两层结构：维度 → 叶子）
 * @param {number} targetCount 目标节点数（会通过变体扩展来逼近）
 * @returns {{ nodes: Array, edges: Array }} G6 v5 扁平数据
 */
export function createAnimalDag(targetCount = 1000) {
  const nodes = []
  const edges = []
  const nodeMap = new Map() // label -> id
  const edgeSet = new Set() // "source->target" 去重
  let idCounter = 0

  function ensureNode(label, level, category) {
    if (nodeMap.has(label)) return nodeMap.get(label)
    const id = `n${idCounter++}`
    nodeMap.set(label, id)
    nodes.push({ id, data: { label, level, category } })
    return id
  }

  function addEdge(sourceId, targetId) {
    const key = `${sourceId}->${targetId}`
    if (edgeSet.has(key)) return
    edgeSet.add(key)
    edges.push({ id: `e${edges.length}`, source: sourceId, target: targetId })
  }

  // 构建两层核心 DAG：维度(level=0) → 叶子(level=2)
  const dimensionIds = []
  for (const dim of DIMENSIONS) {
    const dimId = ensureNode(dim.name, 0, '维度')
    dimensionIds.push(dimId)

    for (const item of dim.items) {
      const itemId = ensureNode(item, 2, '具体品种')
      addEdge(dimId, itemId)
    }
  }

  // 如果核心节点不够，通过变体扩展
  const VARIANTS = ['变种', '亚种', '混血', '培育', '稀有']
  const COLORS = ['白色', '黑色', '灰色', '金色', '花色', '红色', '棕色']

  // 叶子节点 = 有入边且 category 为 '具体品种' 的节点
  const leafNodes = nodes.filter(n => n.data.category === '具体品种')

  while (nodes.length < targetCount) {
    const base = leafNodes[Math.floor(Math.random() * leafNodes.length)]
    if (!base) break

    const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const label = `${base.data.label}·${color}${variant}`

    if (nodeMap.has(label)) continue

    const newId = ensureNode(label, 3, '变种')
    // 变体连到原节点的所有父维度（继承多父关系）
    const parentEdges = edges.filter(e => e.target === base.id)
    for (const pe of parentEdges) {
      addEdge(pe.source, newId)
    }
  }

  return { nodes, edges }
}

/**
 * 从 DAG 数据构建辅助索引（供图交互使用）
 */
export function buildDagIndex(data) {
  const parentMap = new Map() // nodeId -> Set<parentId>
  const childMap = new Map()  // nodeId -> Set<childId>
  const nodeById = new Map()

  for (const n of data.nodes) {
    nodeById.set(n.id, n)
    parentMap.set(n.id, new Set())
    childMap.set(n.id, new Set())
  }

  for (const e of data.edges) {
    parentMap.get(e.target)?.add(e.source)
    childMap.get(e.source)?.add(e.target)
  }

  return { parentMap, childMap, nodeById }
}

/**
 * 获取节点的所有路径（从根到该节点）
 * 限制返回路径数，避免 DAG 中路径爆炸
 */
export function getPathsToRoot(index, nodeId, maxPaths = 5) {
  const { parentMap, nodeById } = index
  const paths = []
  const stack = [[nodeId]]

  while (stack.length > 0 && paths.length < maxPaths) {
    const path = stack.pop()
    const current = path[0]
    const parents = parentMap.get(current)

    if (!parents || parents.size === 0) {
      paths.push([...path])
      continue
    }

    for (const parentId of parents) {
      if (stack.length + paths.length >= maxPaths) break
      stack.push([parentId, ...path])
    }
  }

  return paths.map(p => p.map(id => nodeById.get(id)?.data?.label || id))
}

/**
 * 将 DAG 扁平数据转为嵌套树结构（供 VirtTree 消费）。
 * DAG 中一个节点可能有多个父节点，在树中只出现在第一个父节点下（去重）。
 * 输出只含 { id, label, category, children }，不含 level/isLeaf（VirtTree 内部自行计算）。
 * @param {{ nodes: Array, edges: Array }} data DAG 扁平数据
 * @returns {Array} 嵌套树数组
 */
export function buildNestedTree(data) {
  const childMap = new Map()
  const nodeById = new Map()
  const parentCount = new Map()

  for (const n of data.nodes) {
    nodeById.set(n.id, n)
    childMap.set(n.id, [])
  }
  for (const e of data.edges) {
    childMap.get(e.source)?.push(e.target)
    parentCount.set(e.target, (parentCount.get(e.target) || 0) + 1)
  }

  // 根节点：没有入边的节点
  const roots = data.nodes.filter(n => !parentCount.has(n.id))
  const visited = new Set()

  function buildNode(id) {
    if (visited.has(id)) return null // DAG 去重：只出现在第一个父节点下
    visited.add(id)
    const raw = nodeById.get(id)
    if (!raw) return null
    const childIds = childMap.get(id) || []
    const children = childIds.map(buildNode).filter(Boolean)
    return {
      id: raw.id,
      label: raw.data?.label || raw.id,
      category: raw.data?.category || '',
      children,
    }
  }

  return roots.map(buildNode).filter(Boolean)
}
