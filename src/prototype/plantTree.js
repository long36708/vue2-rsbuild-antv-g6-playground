/**
 * PROTOTYPE — 植物分类树（性能测试数据生成）
 *
 * 以植物分类学（界 → 门 → 纲 → 目 → 科 → 属 → 种）为示例，
 * 生成一棵大规模树（默认 1w 节点），用于压测 G6 的渲染与布局性能。
 *
 * 返回 G6 v5 扁平图数据格式：
 *   { nodes: [{ id, data: { label, level, category, color } }], edges: [{ id, source, target }] }
 * 每个子节点只有一个父节点，因此是一棵严格的树（非 DAG）。
 */

/** 分类层级名称 */
const LEVEL_NAMES = ['界', '门', '纲', '目', '科', '属', '种']

/** 各层级用于生成名称的词库（level 1~5 为分类学名词） */
const TAXON_POOLS = {
  1: ['被子植物门', '裸子植物门', '蕨类植物门', '苔藓植物门', '藻类植物门'],
  2: ['双子叶植物纲', '单子叶植物纲', '松柏纲', '真蕨纲', '苔纲', '绿藻纲', '褐藻纲', '石松纲'],
  3: ['蔷薇目', '菊目', '豆目', '禾本目', '百合目', '唇形目', '茄目', '伞形目', '石竹目', '锦葵目', '樟目', '壳斗目', '杜鹃花目', '茜草目', '莎草目'],
  4: ['蔷薇科', '菊科', '豆科', '禾本科', '百合科', '唇形科', '茄科', '伞形科', '石竹科', '锦葵科', '樟科', '壳斗科', '杜鹃花科', '茜草科', '莎草科', '大戟科', '山茶科'],
  5: ['蔷薇属', '月季属', '玫瑰属', '苹果属', '李属', '菊属', '蒿属', '向日葵属', '大豆属', '稻属', '小麦属', '百合属', '鸢尾属', '薄荷属', '鼠尾草属', '茄属', '辣椒属', '胡萝卜属', '石竹属', '棉花属', '樟属', '栎属', '山茶属', '杜鹃属', '报春属', '茜草属', '大戟属', '茶属', '柳属', '松属'],
}

/** 种加词（species epithet）词库，用于组合物种名 */
const EPITHETS = [
  '红',
  '白',
  '紫',
  '金',
  '银',
  '粉',
  '蓝',
  '黄',
  '绿',
  '黑',
  '大花',
  '小花',
  '长叶',
  '圆叶',
  '尖叶',
  '毛叶',
  '光叶',
  '香',
  '早花',
  '晚花',
  '高山',
  '湿地',
  '林生',
  '栽培',
  '野生',
  '矮生',
  '蔓生',
  '直立',
  '重瓣',
  '单瓣',
  '斑叶',
  '金边',
  '银边',
  '红脉',
  '白边',
  '柔毛',
  '无毛',
  '速生',
  '晚熟',
]

/** 每个层级的分支度（BFS 展开时每个节点生成的子节点数；超出数组长度时取末项） */
const BRANCH_PLAN = [5, 3, 4, 5, 6, 8]

/** 按层级配色 */
const LEVEL_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
]

const GENUS_POOL = TAXON_POOLS[5]

function makeLabel(level, parentLabel, index) {
  if (level <= 5) {
    const pool = TAXON_POOLS[level]
    return pool[index % pool.length]
  }
  // 种（species）：取父节点「属」名 + 种加词
  const genus = parentLabel || GENUS_POOL[index % GENUS_POOL.length]
  const epithet = EPITHETS[(index + level) % EPITHETS.length]
  return `${genus}·${epithet}`
}

/**
 * 生成一棵规模约为 targetCount 的植物分类树。
 * @param {number} targetCount 目标节点总数（默认 10000）
 * @returns {{ nodes: Array, edges: Array }} 返回 G6 v5 扁平图数据，nodes/edges 均为数组
 */
export function createPlantTree(targetCount = 10000) {
  const nodes = []
  const edges = []
  const labelMap = new Map()
  const childrenMap = new Map()
  const usedLabels = new Set()
  let idCounter = 0

  function addNode(rawLabel, level, category) {
    // 保证展示名称唯一（相同分类名词重复时追加序号）
    let label = rawLabel
    let suffix = 1
    while (usedLabels.has(label)) {
      label = `${rawLabel}(${suffix++})`
    }
    usedLabels.add(label)
    const id = `p${idCounter++}`
    labelMap.set(id, label)
    const color = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
    const node = { id, children: [], data: { label, level, category, color } }
    childrenMap.set(id, node.children)
    nodes.push(node)
    return id
  }

  function branchCount(level) {
    return BRANCH_PLAN[Math.min(level, BRANCH_PLAN.length - 1)]
  }

  const rootId = addNode('植物界', 0, LEVEL_NAMES[0])
  const queue = [{ id: rootId, level: 0 }]

  while (nodes.length < targetCount) {
    const { id, level } = queue.shift()
    const children = branchCount(level)
    for (let i = 0; i < children && nodes.length < targetCount; i++) {
      const childLevel = level + 1
      const label = makeLabel(childLevel, labelMap.get(id), i)
      const childId = addNode(
        label,
        childLevel,
        LEVEL_NAMES[Math.min(childLevel, LEVEL_NAMES.length - 1)],
      )
      edges.push({ id: `e${edges.length}`, source: id, target: childId })
      childrenMap.get(id).push(childId)
      queue.push({ id: childId, level: childLevel })
    }
  }

  return { nodes, edges }
}

/**
 * 生成以「嵌套 children」表示的层级树（G6 v5 树形布局可直接消费）。
 * 与 createPlantTree 树形等价，但节点通过 children 字段递归嵌套。
 * @param {number} targetCount 目标节点总数（默认 10000）
 * @returns { object } 单根节点对象 { id, children, data }
 */
export function createPlantTreeHierarchy(targetCount = 10000) {
  const labelMap = new Map()
  const usedLabels = new Set()
  let idCounter = 0

  function addNode(rawLabel, level, category) {
    let label = rawLabel
    let suffix = 1
    while (usedLabels.has(label)) {
      label = `${rawLabel}(${suffix++})`
    }
    usedLabels.add(label)
    const id = `p${idCounter++}`
    labelMap.set(id, label)
    const color = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
    return { id, children: [], data: { label, level, category, color } }
  }

  function branchCount(level) {
    return BRANCH_PLAN[Math.min(level, BRANCH_PLAN.length - 1)]
  }

  const root = addNode('植物界', 0, LEVEL_NAMES[0])
  const queue = [{ node: root, level: 0 }]

  let total = 1
  while (total < targetCount) {
    const { node, level } = queue.shift()
    const children = branchCount(level)
    for (let i = 0; i < children && total < targetCount; i++) {
      const childLevel = level + 1
      const label = makeLabel(childLevel, labelMap.get(node.id), i)
      const child = addNode(
        label,
        childLevel,
        LEVEL_NAMES[Math.min(childLevel, LEVEL_NAMES.length - 1)],
      )
      node.children.push(child)
      queue.push({ node: child, level: childLevel })
      total++
    }
  }

  return root
}

/** 返回层级配色表，供图例展示 */
export function getLevelColor(level) {
  return LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
}

export const PLANT_LEVEL_NAMES = LEVEL_NAMES

/**
 * 生成一棵规模约为 targetCount 的植物分类 DAG（多父节点有向无环图）。
 *
 * 与 createPlantTree 的区别：DAG 中一个子节点可以拥有多个父节点，
 * 模拟「同一物种同时从属于分类学维度和生态/用途维度」的场景。
 *
 * 无环保证：所有边只从 level L 指向 level L+1，因此不可能形成环。
 * 交叉链接：生成新节点时，以 crossLinkRate 概率额外从同层的其他分支
 * 再选一个父节点，形成多父关系。
 *
 * @param {number} targetCount 目标节点总数（默认 10000）
 * @param {number} crossLinkRate 交叉链接概率（0~1，默认 0.15）
 * @returns {{ nodes: Array, edges: Array }} G6 v5 扁平图数据
 */
export function createPlantDag(targetCount = 10000, crossLinkRate = 0.15) {
  const nodes = []
  const edges = []
  const labelMap = new Map()
  const usedLabels = new Set()
  let idCounter = 0
  /** level -> 该层所有节点 id 数组，用于选取第二父节点 */
  const nodesByLevel = new Map()

  function addNode(rawLabel, level, category) {
    let label = rawLabel
    let suffix = 1
    while (usedLabels.has(label)) {
      label = `${rawLabel}(${suffix++})`
    }
    usedLabels.add(label)
    const id = `p${idCounter++}`
    labelMap.set(id, label)
    const color = LEVEL_COLORS[Math.min(level, LEVEL_COLORS.length - 1)]
    nodes.push({ id, data: { label, level, category, color } })
    if (!nodesByLevel.has(level))
      nodesByLevel.set(level, [])
    nodesByLevel.get(level).push(id)
    return id
  }

  function branchCount(level) {
    return BRANCH_PLAN[Math.min(level, BRANCH_PLAN.length - 1)]
  }

  // 多个根节点（不同分类维度），模拟 DAG 多入口
  const rootDefs = [
    { name: '植物界', category: '系统分类' },
    { name: '生态类', category: '生态类型' },
    { name: '经济类', category: '经济用途' },
  ]
  const rootIds = rootDefs.map((def) => {
    return addNode(def.name, 0, def.category)
  })

  const queue = rootIds.map(id => ({ id, level: 0 }))

  while (nodes.length < targetCount) {
    const { id, level } = queue.shift()
    const children = branchCount(level)
    for (let i = 0; i < children && nodes.length < targetCount; i++) {
      const childLevel = level + 1
      const label = makeLabel(childLevel, labelMap.get(id), i)
      const childId = addNode(
        label,
        childLevel,
        LEVEL_NAMES[Math.min(childLevel, LEVEL_NAMES.length - 1)],
      )
      // 第一父节点（主分支）
      edges.push({ id: `e${edges.length}`, source: id, target: childId })
      queue.push({ id: childId, level: childLevel })

      // 交叉链接：以 crossLinkRate 概率从同层其他分支选取第二父节点
      if (childLevel >= 2 && Math.random() < crossLinkRate) {
        const sameLevelNodes = nodesByLevel.get(level) || []
        const candidates = sameLevelNodes.filter(nid => nid !== id)
        if (candidates.length > 0) {
          const secondParent = candidates[Math.floor(Math.random() * candidates.length)]
          // 去重：避免重复边
          const exists = edges.some(
            e => e.source === secondParent && e.target === childId,
          )
          if (!exists) {
            edges.push({ id: `e${edges.length}`, source: secondParent, target: childId })
          }
        }
      }
    }
  }

  return { nodes, edges }
}
