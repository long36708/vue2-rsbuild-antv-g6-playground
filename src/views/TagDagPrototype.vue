<script>
import { Graph } from '@antv/g6'
import {
  addEdge,
  addNode,
  createSampleDag,
  getAncestors,
  getChildren,
  getDescendants,
  getNodeLevel,
  getParents,
  getStateSummary,
  MAX_LEVEL,
  removeEdge,
  removeNode,
  searchNodes,
  toG6Data,
  updateNodeLabel,
  wouldCreateCycle,
  wouldExceedMaxLevel,
} from '@/prototype/tagDag'

export default {
  name: 'TagDagPrototype',
  data() {
    return {
      dag: createSampleDag(),
      graph: null,
      selectedNodeId: null,
      // 表单
      newNodeId: '',
      newNodeLabel: '',
      edgeSource: '',
      edgeTarget: '',
      newNodeParents: [],
      // 右键菜单当前作用的节点（由 v-contextmenu 配合 G6 事件确定）
      contextMenuNodeId: null,
      // 节点操作对话框
      dialogVisible: false,
      dialogType: '', // 'addChild' | 'addParent' | 'edit'
      dialogNodeId: null,
      dialogForm: { id: '', label: '', parentId: '' },
      removeNodeId: '',
      removeEdgeIndex: null,
      // 搜索
      searchKeyword: '',
      searchResults: [],
      // 反馈
      lastAction: null,
    }
  },
  computed: {
    maxLevel() {
      return MAX_LEVEL
    },
    nodeOptions() {
      return [...this.dag.nodes.values()]
    },
    summary() {
      return getStateSummary(this.dag)
    },
    selectedNode() {
      if (!this.selectedNodeId)
        return null
      return this.dag.nodes.get(this.selectedNodeId) || null
    },
    selectedLevel() {
      if (!this.selectedNodeId)
        return 0
      return getNodeLevel(this.dag, this.selectedNodeId)
    },
    selectedParents() {
      if (!this.selectedNodeId)
        return []
      return getParents(this.dag, this.selectedNodeId).map(id => `${this.dag.nodes.get(id)?.label || id}（${id}）`)
    },
    selectedChildren() {
      if (!this.selectedNodeId)
        return []
      return getChildren(this.dag, this.selectedNodeId).map(id => `${this.dag.nodes.get(id)?.label || id}（${id}）`)
    },
    selectedAncestors() {
      if (!this.selectedNodeId)
        return []
      return getAncestors(this.dag, this.selectedNodeId).map(id => `${this.dag.nodes.get(id)?.label || id}（${id}）`)
    },
    selectedDescendants() {
      if (!this.selectedNodeId)
        return []
      return getDescendants(this.dag, this.selectedNodeId).map(id => `${this.dag.nodes.get(id)?.label || id}（${id}）`)
    },
    edgePreview() {
      if (!this.edgeSource || !this.edgeTarget)
        return null
      if (this.edgeSource === this.edgeTarget) {
        return { wouldCycle: true, safe: false, info: false, message: '⚠ 自环：不能添加' }
      }
      const exists = this.dag.edges.some(e => e.source === this.edgeSource && e.target === this.edgeTarget)
      if (exists) {
        return { wouldCycle: false, safe: false, info: true, message: '边已存在' }
      }
      const wouldCycle = wouldCreateCycle(this.dag, this.edgeSource, this.edgeTarget)
      if (wouldCycle) {
        return { wouldCycle: true, safe: false, info: false, message: '⚠ 会形成环，禁止添加' }
      }
      const wouldExceed = wouldExceedMaxLevel(this.dag, this.edgeSource, this.edgeTarget)
      if (wouldExceed) {
        return { wouldCycle: false, safe: false, info: false, message: `⚠ 会超过最大层级限制（${MAX_LEVEL} 级），禁止添加` }
      }
      return { wouldCycle: false, safe: true, info: false, message: '✓ 安全，可以添加' }
    },
    dialogTitle() {
      if (this.dialogType === 'addChild')
        return '添加子节点'
      if (this.dialogType === 'addParent')
        return '添加父节点'
      if (this.dialogType === 'edit')
        return '修改节点信息'
      return ''
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initGraph()
    })
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.destroy()
      this.graph = null
    }
  },
  methods: {
    initGraph() {
      const container = this.$refs.graphContainer
      if (!container)
        return

      this.graph = new Graph({
        container,
        width: container.offsetWidth || 800,
        height: container.offsetHeight || 600,
        autoFit: 'view',
        data: toG6Data(this.dag),
        node: {
          style: {
            size: 36,
            fill: '#C6E5FF',
            stroke: '#5B8FF9',
            lineWidth: 2,
            labelText: d => d.data?.label || d.id,
            labelPlacement: 'bottom',
            labelFontSize: 13,
            labelFill: '#333',
          },
          state: {
            selected: {
              fill: '#FFE7BA',
              stroke: '#FA8C16',
              lineWidth: 3,
            },
            searched: {
              fill: '#D3F261',
              stroke: '#7CB305',
              lineWidth: 3,
            },
          },
        },
        edge: {
          style: {
            endArrow: true,
            stroke: '#bfbfbf',
            lineWidth: 1.5,
          },
        },
        layout: {
          type: 'dagre',
          rankdir: 'TB',
          nodesep: 40,
          ranksep: 60,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      })

      this.graph.on('node:click', (evt) => {
        const nodeId = evt.target.id
        this.selectNode(nodeId)
      })

      this.graph.on('node:contextmenu', (evt) => {
        const nodeId = evt.target.id
        this.contextMenuNodeId = nodeId
        this.selectNode(nodeId)
      })

      this.graph.on('canvas:contextmenu', () => {
        // 在空白处右键：清空作用节点，避免菜单操作到旧节点
        this.contextMenuNodeId = null
      })

      this.graph.on('canvas:click', () => {
        this.selectNode(null)
        this.contextMenuNodeId = null
      })

      this.graph.on('node:click', () => {
        this.contextMenuNodeId = null
      })

      this.graph.render()
    },
    // ---- 右键菜单（v-contextmenu）----
    menuAddChild() {
      const nodeId = this.contextMenuNodeId
      if (!nodeId)
        return
      this.dialogType = 'addChild'
      this.dialogNodeId = nodeId
      this.dialogForm = { id: '', label: '', parentId: nodeId }
      this.dialogVisible = true
    },
    menuAddParent() {
      const nodeId = this.contextMenuNodeId
      if (!nodeId)
        return
      this.dialogType = 'addParent'
      this.dialogNodeId = nodeId
      this.dialogForm = { id: '', label: '', parentId: '' }
      this.dialogVisible = true
    },
    menuEdit() {
      const nodeId = this.contextMenuNodeId
      if (!nodeId)
        return
      const node = this.dag.nodes.get(nodeId)
      this.dialogType = 'edit'
      this.dialogNodeId = nodeId
      this.dialogForm = { id: node.id, label: node.label, parentId: '' }
      this.dialogVisible = true
    },
    menuDelete() {
      const id = this.contextMenuNodeId
      if (!id)
        return
      const result = removeNode(this.dag, id)
      this.lastAction = { ok: result.ok, message: result.ok ? `节点「${id}」删除成功` : result.error }
      if (result.ok) {
        if (this.selectedNodeId === id)
          this.selectedNodeId = null
        this.refreshGraph()
      }
    },
    confirmDialog() {
      const type = this.dialogType
      const nodeId = this.dialogNodeId
      const form = this.dialogForm
      if (type === 'addChild') {
        const id = form.id.trim()
        const label = form.label.trim()
        if (!id) {
          this.lastAction = { ok: false, message: '请输入节点 ID' }
          return
        }
        const r = addNode(this.dag, id, label)
        if (!r.ok) {
          this.lastAction = { ok: false, message: r.error }
          return
        }
        const e = addEdge(this.dag, nodeId, id) // 当前节点作为父
        this.lastAction = { ok: true, message: e.ok ? `已添加子节点「${id}」并关联` : `节点「${id}」已添加，但关联失败：${e.error}` }
        this.refreshGraph()
      }
      else if (type === 'addParent') {
        if (!form.parentId) {
          this.lastAction = { ok: false, message: '请选择父节点' }
          return
        }
        const e = addEdge(this.dag, form.parentId, nodeId) // 选中的作为父
        this.lastAction = { ok: e.ok, message: e.ok ? `已为「${nodeId}」添加父节点「${form.parentId}」` : e.error }
        if (e.ok)
          this.refreshGraph()
      }
      else if (type === 'edit') {
        const r = updateNodeLabel(this.dag, nodeId, form.label)
        this.lastAction = { ok: r.ok, message: r.ok ? `节点「${nodeId}」名称已更新为「${form.label}」` : r.error }
        if (r.ok)
          this.refreshGraph()
      }
      this.dialogVisible = false
    },
    selectNode(nodeId) {
      this.selectedNodeId = nodeId
      this.applyHighlights()
    },
    async refreshGraph() {
      if (!this.graph)
        return
      this.graph.setData(toG6Data(this.dag))
      await this.graph.render()
      if (this.selectedNodeId && !this.dag.nodes.has(this.selectedNodeId)) {
        this.selectedNodeId = null
      }
      this.applyHighlights()
    },
    /** 统一应用搜索高亮和选中状态 */
    applyHighlights() {
      if (!this.graph)
        return
      const searchIds = new Set(this.searchResults.map(n => n.id))
      this.dag.nodes.forEach((_, id) => {
        if (searchIds.has(id)) {
          this.graph.setElementState(id, ['searched'])
        }
        else if (this.selectedNodeId === id) {
          this.graph.setElementState(id, ['selected'])
        }
        else {
          this.graph.setElementState(id, [])
        }
      })
    },
    handleSearch() {
      if (!this.searchKeyword.trim()) {
        this.clearSearch()
        return
      }
      this.searchResults = searchNodes(this.dag, this.searchKeyword)
      this.applyHighlights()
    },
    clearSearch() {
      this.searchResults = []
      this.applyHighlights()
    },
    focusNode(nodeId) {
      this.selectNode(nodeId)
      if (this.graph && this.graph.focusElement) {
        this.graph.focusElement(nodeId)
      }
    },
    handleAddNode() {
      const id = this.newNodeId.trim()
      const label = this.newNodeLabel.trim()
      if (!id) {
        this.lastAction = { ok: false, message: '请输入节点 ID' }
        return
      }
      const result = addNode(this.dag, id, label)
      if (!result.ok) {
        this.lastAction = { ok: false, message: result.error }
        return
      }
      // 与已存在节点建立关联（支持多父节点）
      const failed = []
      for (const parentId of this.newNodeParents) {
        const edgeResult = addEdge(this.dag, parentId, id)
        if (!edgeResult.ok)
          failed.push(edgeResult.error)
      }
      const count = this.newNodeParents.length - failed.length
      this.lastAction = {
        ok: true,
        message: failed.length
          ? `节点「${id}」添加成功，已建立 ${count} 条关联，${failed.length} 条失败：${failed.join('；')}`
          : `节点「${id}」添加成功，已建立 ${count} 条父节点关联`,
      }
      this.newNodeId = ''
      this.newNodeLabel = ''
      this.newNodeParents = []
      this.refreshGraph()
    },
    handleAddEdge() {
      if (!this.edgeSource || !this.edgeTarget) {
        this.lastAction = { ok: false, message: '请选择源节点和目标节点' }
        return
      }
      const result = addEdge(this.dag, this.edgeSource, this.edgeTarget)
      this.lastAction = {
        ok: result.ok,
        message: result.ok ? `边「${this.edgeSource} → ${this.edgeTarget}」添加成功` : result.error,
      }
      if (result.ok) {
        this.edgeSource = ''
        this.edgeTarget = ''
        this.refreshGraph()
      }
    },
    handleRemoveNode() {
      if (!this.removeNodeId) {
        this.lastAction = { ok: false, message: '请选择要删除的节点' }
        return
      }
      const result = removeNode(this.dag, this.removeNodeId)
      this.lastAction = { ok: result.ok, message: result.ok ? `节点「${this.removeNodeId}」删除成功` : result.error }
      if (result.ok) {
        if (this.selectedNodeId === this.removeNodeId) {
          this.selectedNodeId = null
        }
        this.removeNodeId = ''
        this.refreshGraph()
      }
    },
    handleRemoveEdge() {
      if (this.removeEdgeIndex === null) {
        this.lastAction = { ok: false, message: '请选择要删除的边' }
        return
      }
      const edge = this.dag.edges[this.removeEdgeIndex]
      if (!edge) {
        this.lastAction = { ok: false, message: '边不存在' }
        return
      }
      const result = removeEdge(this.dag, edge.source, edge.target)
      this.lastAction = {
        ok: result.ok,
        message: result.ok ? `边「${edge.source} → ${edge.target}」删除成功` : result.error,
      }
      if (result.ok) {
        this.removeEdgeIndex = null
        this.refreshGraph()
      }
    },
  },
}
</script>

<template>
  <div class="tag-dag-prototype">
    <div class="prototype-header">
      <h2>多父节点标签树原型（DAG + 环检测）</h2>
      <p class="prototype-desc">
        验证：多父节点标签树（DAG）的环检测 + 最多 {{ maxLevel }} 级层级限制 + 节点搜索。
        点击节点查看详情，尝试添加「哈士奇 → 狗」触发环检测；从已达第 10 级的「第四代」再添加子节点会触发层级限制。
      </p>
    </div>

    <div class="prototype-body">
      <!-- 左侧：g6 图画布 -->
      <div class="graph-area">
        <div ref="graphContainer" v-contextmenu:ctxmenu class="graph-container"></div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="control-panel">
        <!-- 搜索节点 -->
        <div class="panel-section">
          <h4>搜索节点</h4>
          <div class="form-row">
            <el-input
              v-model="searchKeyword"
              placeholder="按 ID 或名称搜索"
              size="small"
              clearable
              @input="handleSearch"
              @clear="clearSearch"
            ></el-input>
          </div>
          <div v-if="searchKeyword && searchResults.length > 0" class="search-results">
            <div
              v-for="node in searchResults"
              :key="node.id"
              class="search-result-item"
              @click="focusNode(node.id)"
            >
              {{ node.label }}（{{ node.id }}）<span class="search-level">L{{ node.level }}</span>
            </div>
          </div>
          <div v-if="searchKeyword && searchResults.length === 0" class="search-empty">
            未找到匹配节点
          </div>
        </div>

        <!-- 添加节点 -->
        <div class="panel-section">
          <h4>添加节点</h4>
          <div class="form-row">
            <el-input v-model="newNodeId" placeholder="节点 ID（如 husky）" size="small" @keyup.enter.native="handleAddNode"></el-input>
            <el-input v-model="newNodeLabel" placeholder="显示名称" size="small" @keyup.enter.native="handleAddNode"></el-input>
            <el-button type="primary" size="small" @click="handleAddNode">
              添加
            </el-button>
          </div>
          <div class="form-row">
            <el-select v-model="newNodeParents" placeholder="父节点（可多选，建立关联）" size="small" multiple filterable style="width: 100%">
              <el-option v-for="node in nodeOptions" :key="node.id" :label="`${node.label}（${node.id}）`" :value="node.id"></el-option>
            </el-select>
          </div>
        </div>

        <!-- 添加边 -->
        <div class="panel-section">
          <h4>添加边（父 → 子）</h4>
          <div class="form-row">
            <el-select v-model="edgeSource" placeholder="源节点（父）" size="small" filterable>
              <el-option v-for="node in nodeOptions" :key="node.id" :label="`${node.label}（${node.id}）`" :value="node.id"></el-option>
            </el-select>
            <span class="arrow">→</span>
            <el-select v-model="edgeTarget" placeholder="目标节点（子）" size="small" filterable>
              <el-option v-for="node in nodeOptions" :key="node.id" :label="`${node.label}（${node.id}）`" :value="node.id"></el-option>
            </el-select>
            <el-button type="primary" size="small" :disabled="!edgePreview?.safe" @click="handleAddEdge">
              添加
            </el-button>
          </div>
          <div v-if="edgePreview" class="edge-preview" :class="{ 'preview-warn': edgePreview.wouldCycle, 'preview-ok': edgePreview.safe, 'preview-info': edgePreview.info }">
            {{ edgePreview.message }}
          </div>
        </div>

        <!-- 删除节点 -->
        <div class="panel-section">
          <h4>删除节点</h4>
          <div class="form-row">
            <el-select v-model="removeNodeId" placeholder="选择节点" size="small" filterable>
              <el-option v-for="node in nodeOptions" :key="node.id" :label="`${node.label}（${node.id}）`" :value="node.id"></el-option>
            </el-select>
            <el-button type="danger" size="small" :disabled="!removeNodeId" @click="handleRemoveNode">
              删除
            </el-button>
          </div>
        </div>

        <!-- 删除边 -->
        <div class="panel-section">
          <h4>删除边</h4>
          <div class="form-row">
            <el-select v-model="removeEdgeIndex" placeholder="选择边" size="small" filterable>
              <el-option
                v-for="(edge, i) in dag.edges"
                :key="i"
                :label="`${dag.nodes.get(edge.source)?.label || edge.source} → ${dag.nodes.get(edge.target)?.label || edge.target}`"
                :value="i"
              ></el-option>
            </el-select>
            <el-button type="danger" size="small" :disabled="removeEdgeIndex === null" @click="handleRemoveEdge">
              删除
            </el-button>
          </div>
        </div>

        <!-- 选中节点信息 -->
        <div v-if="selectedNode" class="panel-section">
          <h4>选中节点：{{ selectedNode.label }}</h4>
          <div class="node-info">
            <div class="info-row">
              <span class="info-label">节点 ID：</span>
              <span class="info-value node-id">{{ selectedNode.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">层级：</span>
              <span class="info-value">第 {{ selectedLevel }} 级 / 共 {{ maxLevel }} 级</span>
            </div>
            <div class="info-row">
              <span class="info-label">直接父节点：</span>
              <span class="info-value">{{ selectedParents.length ? selectedParents.join('、') : '无' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">直接子节点：</span>
              <span class="info-value">{{ selectedChildren.length ? selectedChildren.join('、') : '无' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">所有祖先：</span>
              <span class="info-value">{{ selectedAncestors.length ? selectedAncestors.join('、') : '无' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">所有后代：</span>
              <span class="info-value">{{ selectedDescendants.length ? selectedDescendants.join('、') : '无' }}</span>
            </div>
          </div>
        </div>

        <!-- 状态摘要 -->
        <div class="panel-section">
          <h4>状态摘要</h4>
          <div class="summary">
            <span class="summary-item">节点数：<b>{{ summary.nodeCount }}</b></span>
            <span class="summary-item">边数：<b>{{ summary.edgeCount }}</b></span>
          </div>
          <div class="edge-list">
            <div v-for="(edge, i) in summary.edges" :key="i" class="edge-list-item">
              {{ edge }}
            </div>
          </div>
        </div>

        <!-- 操作结果 -->
        <div v-if="lastAction" class="panel-section">
          <div class="action-result" :class="{ 'result-ok': lastAction.ok, 'result-fail': !lastAction.ok }">
            {{ lastAction.ok ? '✓' : '✗' }} {{ lastAction.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单（v-contextmenu，自动定位到鼠标位置） -->
    <!-- eslint-disable-next-line vue/no-unused-refs -->
    <v-contextmenu ref="ctxmenu">
      <v-contextmenu-item @click="menuAddChild">
        添加子节点
      </v-contextmenu-item>
      <v-contextmenu-item @click="menuAddParent">
        添加父节点
      </v-contextmenu-item>
      <v-contextmenu-item @click="menuEdit">
        修改信息
      </v-contextmenu-item>
      <v-contextmenu-item divider></v-contextmenu-item>
      <v-contextmenu-item @click="menuDelete">
        删除节点
      </v-contextmenu-item>
    </v-contextmenu>

    <!-- 节点操作对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="360px" @close="dialogVisible = false">
      <div v-if="dialogType === 'addChild'">
        <p class="dialog-tip">
          将作为「{{ dialogNodeId }}」的子节点（父 → 子）
        </p>
        <el-input v-model="dialogForm.id" placeholder="节点 ID" size="small" class="dialog-field"></el-input>
        <el-input v-model="dialogForm.label" placeholder="显示名称" size="small" class="dialog-field"></el-input>
      </div>
      <div v-else-if="dialogType === 'addParent'">
        <p class="dialog-tip">
          为「{{ dialogNodeId }}」选择一个父节点（父 → 子）
        </p>
        <el-select v-model="dialogForm.parentId" placeholder="选择父节点" size="small" filterable style="width: 100%">
          <el-option v-for="node in nodeOptions.filter(n => n.id !== dialogNodeId)" :key="node.id" :label="`${node.label}（${node.id}）`" :value="node.id"></el-option>
        </el-select>
      </div>
      <div v-else-if="dialogType === 'edit'">
        <p class="dialog-tip">
          修改节点「{{ dialogNodeId }}」的显示名称
        </p>
        <el-input v-model="dialogForm.label" placeholder="显示名称" size="small" class="dialog-field"></el-input>
      </div>
      <span slot="footer">
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="confirmDialog">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<style scoped>
.tag-dag-prototype {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.prototype-header {
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
}

.prototype-header h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.prototype-desc {
  margin: 0;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

.prototype-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.graph-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #fafafa;
}

.graph-container {
  width: 100%;
  height: 100%;
}

.control-panel {
  width: 360px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 12px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
}

.panel-section {
  margin-bottom: 16px;
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  background: #fcfcfc;
}

.panel-section h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #333;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.form-row .el-input,
.form-row .el-select {
  width: auto;
  flex: 1;
  min-width: 80px;
}

.form-row .arrow {
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

.edge-preview {
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.4;
}

.preview-ok {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.preview-warn {
  background: #fff2e8;
  color: #fa8c16;
  border: 1px solid #ffbb96;
}

.preview-info {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.node-info {
  font-size: 12px;
}

.info-row {
  margin: 4px 0;
  line-height: 1.5;
}

.info-label {
  color: #888;
}

.info-value {
  color: #333;
}

.node-id {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 3px;
  color: #c41d7f;
}

.summary {
  font-size: 13px;
  margin-bottom: 6px;
}

.summary-item {
  margin-right: 16px;
}

.edge-list {
  font-size: 11px;
  color: #666;
  max-height: 100px;
  overflow-y: auto;
}

.edge-list-item {
  padding: 1px 0;
}

.action-result {
  padding: 6px 10px;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.5;
}

.result-ok {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.result-fail {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.search-results {
  margin-top: 6px;
  max-height: 150px;
  overflow-y: auto;
}

.search-result-item {
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f0f0f0;
}

.search-level {
  color: #999;
  font-size: 11px;
  margin-left: 4px;
}

.search-empty {
  margin-top: 6px;
  font-size: 12px;
  color: #999;
  text-align: center;
  padding: 8px;
}

.dialog-tip {
  font-size: 12px;
  color: #888;
  margin: 0 0 8px;
}

.dialog-field {
  margin-bottom: 8px;
}
</style>
