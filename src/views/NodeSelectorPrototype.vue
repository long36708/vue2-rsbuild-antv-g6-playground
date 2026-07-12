<script>
/**
 * PROTOTYPE — 大规模 DAG 节点选取交互原型（VirtTree 版）
 *
 * 使用 vue-virt-list 的 VirtTree 组件实现虚拟滚动树形导航，
 * 1000+ 节点下只渲染可见区域的 DOM，大幅提升性能。
 *
 * 运行：pnpm run dev → 访问 /prototype/node-selector
 */
import { VirtTree } from 'vue-virt-list'
import { createAnimalDag, buildDagIndex, buildNestedTree, getPathsToRoot } from '@/prototype/animalDag'

const CATEGORY_COLORS = {
  '维度': '#5B8FF9',
  '分类': '#5AD8A6',
  '品种': '#F6BD16',
  '具体品种': '#E8684A',
  '变种': '#9270CA',
}

export default {
  name: 'NodeSelectorPrototype',
  components: { VirtTree },
  data() {
    return {
      CATEGORY_COLORS,
      nodeCount: 1000,
      dagIndex: null,
      dagData: null,
      nestedTreeData: [],
      selectedNodeId: null,
      searchKeyword: '',
      searchResults: [],
      treeExpandedKeys: [],
      treeSelectedKeys: [],
      hiddenLevels: [],
      listScrollTop: 0,
      listPageSize: 80,
      loading: false,
      stats: { nodeCount: 0, edgeCount: 0, genTime: 0 },
    }
  },
  computed: {
    allNodes() {
      if (!this.dagIndex) return []
      return [...this.dagIndex.nodeById.values()]
    },
    levelStats() {
      const s = {}
      for (const n of this.allNodes) {
        const lv = n.data.level
        s[lv] = (s[lv] || 0) + 1
      }
      return Object.entries(s).map(([l, c]) => ({ level: +l, count: c })).sort((a, b) => a.level - b.level)
    },
    visibleNodeIds() {
      if (this.hiddenLevels.length === 0) return new Set(this.allNodes.map(n => n.id))
      return new Set(this.allNodes.filter(n => !this.hiddenLevels.includes(n.data.level)).map(n => n.id))
    },
    filteredNodes() {
      const vis = this.visibleNodeIds
      let nodes = this.allNodes.filter(n => vis.has(n.id))
      if (this.searchKeyword.trim()) {
        const kw = this.searchKeyword.trim().toLowerCase()
        nodes = nodes.filter(n => n.data.label.toLowerCase().includes(kw))
      }
      return nodes
    },
    showNodeList() {
      return this.searchKeyword.trim() !== '' || this.hiddenLevels.length > 0
    },
    paginatedNodes() {
      const start = Math.floor(this.listScrollTop / 28) * this.listPageSize
      return this.filteredNodes.slice(start, start + this.listPageSize * 2)
    },
    selectedNode() {
      return this.selectedNodeId && this.dagIndex ? this.dagIndex.nodeById.get(this.selectedNodeId) : null
    },
    selectedParents() {
      if (!this.selectedNodeId || !this.dagIndex) return []
      const ids = this.dagIndex.parentMap.get(this.selectedNodeId)
      return ids ? [...ids].map(id => this.dagIndex.nodeById.get(id)).filter(Boolean) : []
    },
    selectedChildren() {
      if (!this.selectedNodeId || !this.dagIndex) return []
      const ids = this.dagIndex.childMap.get(this.selectedNodeId)
      return ids ? [...ids].map(id => this.dagIndex.nodeById.get(id)).filter(Boolean) : []
    },
    selectedPaths() {
      return this.selectedNodeId && this.dagIndex ? getPathsToRoot(this.dagIndex, this.selectedNodeId) : []
    },
    treeFieldNames() {
      return { key: 'id', title: 'label', children: 'children' }
    },
  },
  created() {
    this._searchTimer = null
  },
  mounted() {
    this.$nextTick(() => this.generate())
  },
  methods: {
    generate() {
      this.loading = true
      requestAnimationFrame(() => {
        const t0 = performance.now()
        this.dagData = createAnimalDag(this.nodeCount)
        this.dagIndex = buildDagIndex(this.dagData)
        this.nestedTreeData = buildNestedTree(this.dagData)
        const t1 = performance.now()
        this.stats = {
          nodeCount: this.dagData.nodes.length,
          edgeCount: this.dagData.edges.length,
          genTime: +(t1 - t0).toFixed(1),
        }
        this.loading = false
        // 默认展开第 0 层（维度根节点）
        const rootKeys = this.nestedTreeData.map(n => n.id)
        this.treeExpandedKeys = rootKeys
      })
    },
    selectNode(nodeId) {
      this.selectedNodeId = nodeId
      this.treeSelectedKeys = [nodeId]
    },
    handleTreeSelect(selectedKeys) {
      if (selectedKeys && selectedKeys.length > 0) {
        this.selectedNodeId = selectedKeys[selectedKeys.length - 1]
        this.treeSelectedKeys = selectedKeys
      }
    },
    handleTreeExpand(expandedKeys) {
      this.treeExpandedKeys = expandedKeys
    },
    handleSearch() {
      clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(() => {
        if (!this.searchKeyword.trim()) {
          this.searchResults = []
        } else {
          const kw = this.searchKeyword.trim().toLowerCase()
          this.searchResults = this.allNodes.filter(n => n.data.label.toLowerCase().includes(kw)).slice(0, 50)
        }
      }, 200)
    },
    toggleLevel(level) {
      const i = this.hiddenLevels.indexOf(level)
      if (i > -1) this.hiddenLevels.splice(i, 1)
      else this.hiddenLevels.push(level)
    },
    getCategoryColor(category) {
      return CATEGORY_COLORS[category] || '#999'
    },
    getChildCount(node) {
      return node.children ? node.children.length : 0
    },
  },
}
</script>

<template>
  <div class="node-selector-proto">
    <div class="proto-header">
      <h2>大规模 DAG 节点选取交互原型</h2>
      <p class="proto-desc">
        动物分类 DAG（如：狗→哈士奇←雪橇犬），{{ stats.nodeCount }} 节点 / {{ stats.edgeCount }} 边，数据生成 {{ stats.genTime }}ms。
        💡 左侧 VirtTree 虚拟滚动导航 | 右侧搜索 + 层级筛选快速定位
      </p>
    </div>

    <div class="proto-body">
      <!-- 左侧：VirtTree 虚拟滚动树形浏览器 -->
      <div class="tree-explorer">
        <div class="explorer-hd">
          <h4>📂 分类导航</h4>
          <span class="explorer-stats">{{ stats.nodeCount }} 个节点（虚拟滚动）</span>
        </div>
        <div v-if="loading" class="tree-loading">生成数据中…</div>
        <div v-else class="tree-virt-wrap">
          <VirtTree
            ref="virtTreeRef"
            :list="nestedTreeData"
            :field-names="treeFieldNames"
            :expanded-keys="treeExpandedKeys"
            :selected-keys="treeSelectedKeys"
            :selectable="true"
            :indent="18"
            :item-pre-size="28"
            :item-gap="0"
            class="virt-tree"
            item-class="virt-tree-node"
            @update:expandedKeys="handleTreeExpand"
            @select="handleTreeSelect"
          >
            <template #content="{ node }">
              <div class="tree-node-content" :class="{ selected: selectedNodeId === node.key }">
                <span class="tree-dot" :style="{ background: getCategoryColor(node.data?.category) }"></span>
                <span class="tree-label">{{ node.title }}</span>
                <span v-if="getChildCount(node) > 0" class="tree-count">({{ getChildCount(node) }})</span>
              </div>
            </template>
          </VirtTree>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 搜索 -->
        <div class="panel-section">
          <h4>🔎 搜索节点</h4>
          <input v-model="searchKeyword" class="search-input" placeholder="输入名称，如：哈士奇" @input="handleSearch" />
          <div v-if="searchResults.length" class="search-results">
            <div v-for="n in searchResults" :key="n.id" class="search-item" :class="{ active: selectedNodeId === n.id }" @click="selectNode(n.id)">
              <span class="s-dot" :style="{ background: getCategoryColor(n.data.category) }"></span>
              <span class="s-label">{{ n.data.label }}</span>
              <span class="s-lv">L{{ n.data.level }}</span>
            </div>
          </div>
          <div v-else-if="searchKeyword && !searchResults.length" class="search-empty">无匹配</div>
        </div>

        <!-- 层级筛选 -->
        <div class="panel-section">
          <h4>🏷️ 层级筛选</h4>
          <div class="level-btns">
            <button v-for="s in levelStats" :key="s.level" class="lv-btn" :class="{ active: !hiddenLevels.includes(s.level) }" @click="toggleLevel(s.level)">
              L{{ s.level }} <small>({{ s.count }})</small>
            </button>
          </div>
          <div class="lv-actions">
            <button class="link-btn" @click="hiddenLevels = []">全选</button>
            <button class="link-btn" @click="hiddenLevels = levelStats.map(s => s.level)">全不选</button>
          </div>
        </div>

        <!-- 节点详情 -->
        <div v-if="selectedNode" class="panel-section detail-sec">
          <h4>📌 {{ selectedNode.data.label }}</h4>
          <div class="d-row"><span class="d-lbl">ID</span><span class="d-val">{{ selectedNode.id }}</span></div>
          <div class="d-row"><span class="d-lbl">层级</span><span class="d-val">L{{ selectedNode.data.level }} · {{ selectedNode.data.category }}</span></div>
          <div v-if="selectedParents.length" class="d-row">
            <span class="d-lbl">父节点 ({{ selectedParents.length }})</span>
            <div class="tag-wrap">
              <span v-for="p in selectedParents" :key="p.id" class="p-tag" @click="selectNode(p.id)">{{ p.data.label }}</span>
            </div>
          </div>
          <div v-if="selectedChildren.length" class="d-row">
            <span class="d-lbl">子节点 ({{ selectedChildren.length }})</span>
            <div class="tag-wrap">
              <span v-for="c in selectedChildren.slice(0, 10)" :key="c.id" class="c-tag" @click="selectNode(c.id)">{{ c.data.label }}</span>
              <span v-if="selectedChildren.length > 10" class="more">+{{ selectedChildren.length - 10 }}</span>
            </div>
          </div>
          <div v-if="selectedPaths.length" class="d-row paths-row">
            <span class="d-lbl">路径</span>
            <div class="paths">
              <div v-for="(path, i) in selectedPaths" :key="i" class="path">
                <template v-for="(seg, j) in path">
                  <span :key="'n'+j" class="path-node" :style="{ borderColor: getCategoryColor(['维度', '具体品种', '变种'][j] || '具体品种') }">{{ seg }}</span>
                  <span v-if="j < path.length - 1" :key="'a'+j" class="path-arrow">→</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 匹配结果列表（仅搜索/筛选后展示） -->
        <div v-if="showNodeList" class="panel-section list-sec">
          <h4>📋 匹配结果 ({{ filteredNodes.length }})</h4>
          <div class="v-list" @scroll="(e) => listScrollTop = e.target.scrollTop">
            <div v-for="n in paginatedNodes" :key="n.id" class="li" :class="{ selected: selectedNodeId === n.id }" @click="selectNode(n.id)">
              <span class="li-dot" :style="{ background: getCategoryColor(n.data.category) }"></span>
              <span class="li-label">{{ n.data.label }}</span>
              <span class="li-badge">L{{ n.data.level }}</span>
            </div>
          </div>
        </div>

        <!-- 无选中时的提示 -->
        <div v-if="!selectedNode && !showNodeList" class="panel-section hint-sec">
          <p>👈 从左侧 VirtTree 虚拟树中展开并点击节点</p>
          <p>🔎 或使用搜索框快速定位</p>
          <p>🏷️ 或通过层级筛选缩小范围</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-selector-proto { display: flex; flex-direction: column; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.proto-header { padding: 10px 16px; border-bottom: 1px solid #e8e8e8; background: #fff; flex-shrink: 0; }
.proto-header h2 { margin: 0 0 2px; font-size: 16px; }
.proto-desc { margin: 0; font-size: 12px; color: #888; }
.proto-body { display: flex; flex: 1; overflow: hidden; }

/* 树形浏览器（主区域） */
.tree-explorer { flex: 1; background: #fafbfc; border-right: 1px solid #e8e8e8; display: flex; flex-direction: column; min-width: 0; }
.explorer-hd { padding: 8px 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.explorer-hd h4 { margin: 0; font-size: 13px; }
.explorer-stats { font-size: 11px; color: #999; }
.tree-virt-wrap { flex: 1; overflow: hidden; }
.tree-loading { padding: 20px; text-align: center; color: #999; font-size: 13px; }

/* VirtTree 自定义内容样式 */
.tree-node-content {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  border-left: 3px solid transparent;
  width: 100%;
}
.tree-node-content:hover { background: #e6f7ff; }
.tree-node-content.selected { background: #fff7e6; border-left-color: #FA8C16; font-weight: 500; }
.tree-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tree-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree-count { font-size: 10px; color: #999; flex-shrink: 0; }

/* VirtTree 全局样式覆盖 */
:deep(.virt-tree) { height: 100%; }
:deep(.virt-tree-node) { padding: 0 8px; }
:deep(.virt-tree-item) { cursor: pointer; }

/* 右侧面板 */
.right-panel { width: 320px; flex-shrink: 0; overflow-y: auto; background: #fff; border-left: 1px solid #e8e8e8; padding: 10px; }
.panel-section { margin-bottom: 10px; padding: 10px; border: 1px solid #f0f0f0; border-radius: 4px; background: #fcfcfc; }
.panel-section h4 { margin: 0 0 6px; font-size: 13px; color: #333; }

/* 搜索 */
.search-input { width: 100%; padding: 6px 8px; border: 1px solid #d9d9d9; border-radius: 4px; font-size: 12px; box-sizing: border-box; outline: none; }
.search-input:focus { border-color: #1890ff; box-shadow: 0 0 0 2px rgba(24,144,255,0.1); }
.search-results { max-height: 200px; overflow-y: auto; margin-top: 6px; }
.search-item { display: flex; align-items: center; gap: 6px; padding: 4px 6px; cursor: pointer; border-radius: 3px; font-size: 12px; }
.search-item:hover { background: #e6f7ff; }
.search-item.active { background: #fff7e6; }
.s-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.s-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.s-lv { font-size: 10px; color: #999; }
.search-empty { font-size: 12px; color: #999; margin-top: 4px; }

/* 层级 */
.level-btns { display: flex; flex-wrap: wrap; gap: 4px; }
.lv-btn { padding: 2px 8px; border: 1px solid #d9d9d9; border-radius: 3px; background: #fff; font-size: 11px; cursor: pointer; }
.lv-btn.active { background: #1890ff; color: #fff; border-color: #1890ff; }
.lv-btn small { font-size: 10px; opacity: 0.8; }
.lv-actions { margin-top: 4px; display: flex; gap: 8px; }
.link-btn { background: none; border: none; color: #1890ff; font-size: 11px; cursor: pointer; padding: 0; }

/* 详情 */
.detail-sec { background: #fffbe6; }
.d-row { margin-bottom: 4px; font-size: 12px; }
.d-lbl { color: #999; display: inline-block; width: 70px; }
.d-val { color: #333; }
.tag-wrap { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
.p-tag { padding: 1px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; background: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.p-tag:hover { background: #bae7ff; }
.c-tag { padding: 1px 6px; border-radius: 3px; font-size: 11px; cursor: pointer; background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
.c-tag:hover { background: #d9f7be; }
.more { font-size: 10px; color: #999; padding: 1px 4px; }
.paths { margin-top: 2px; }
.path { margin-bottom: 3px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; }
.path-node { padding: 1px 5px; border: 2px solid; border-radius: 3px; font-size: 11px; background: #fff; }
.path-arrow { color: #999; font-size: 10px; }

/* 提示 */
.hint-sec { color: #999; font-size: 12px; line-height: 2; }

/* 虚拟列表 */
.list-sec { padding-bottom: 4px; }
.v-list { max-height: 300px; overflow-y: auto; }
.li { display: flex; align-items: center; gap: 6px; padding: 4px 6px; cursor: pointer; border-radius: 3px; font-size: 12px; border-left: 3px solid transparent; }
.li:hover { background: #e6f7ff; }
.li.selected { background: #fff7e6; border-left-color: #FA8C16; }
.li-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.li-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.li-badge { font-size: 10px; color: #999; }
</style>
