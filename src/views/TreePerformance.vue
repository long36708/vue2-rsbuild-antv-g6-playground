<script>
import { Renderer as WebGLRenderer } from '@antv/g-webgl'
import { Graph } from '@antv/g6'
import { createPlantTree, createPlantDag, getLevelColor, PLANT_LEVEL_NAMES } from '@/prototype/plantTree'
import {
  registerGpuLayouts,
  initWasmLayouts,
  isWasmMultiThread,
  getWasmInitError,
} from '@/g6-layouts'

// GPU 布局同步注册，import 时即可完成
registerGpuLayouts()

export default {
  name: 'TreePerformance',
  data() {
    return {
      // 配置
      nodeCount: 2000,
      customCount: 2000,
      layoutType: 'compact-box',
      rankdir: 'TB',
      showLabel: false,
      nodeSize: 6,
      defaultCollapsed: true,
      dataType: 'tree', // 'tree' | 'dag'
      // 状态
      loading: false,
      // WASM 状态
      wasmStatus: 'pending', // 'pending' | 'ready' | 'error'
      wasmMultiThread: false,
      wasmError: null,
      // 指标
      stats: {
        nodeCount: 0,
        edgeCount: 0,
        genTime: 0, // 数据生成耗时(ms)
        renderTime: 0, // 布局 + 首次渲染耗时(ms)
      },
      fps: 0,
    }
  },
  created() {
    // 非响应式内部状态：G6 实例、FPS 计时器等不能被 Vue 响应式劫持，
    // 否则 Vue 会对 Graph 实例递归添加 getter/setter，导致 G6 渲染异常甚至页面崩溃。
    this.graph = null
    this.graphSig = ''
    this.fpsRaf = null
    this.fpsFrames = 0
    this.fpsLast = 0
  },
  computed: {
    countOptions() {
      return [1000, 5000, 10000, 20000, 50000]
    },
    legendLevels() {
      return PLANT_LEVEL_NAMES.map((name, i) => ({
        name,
        color: getLevelColor(i),
      }))
    },
    /** WASM 布局是否可用 */
    wasmAvailable() {
      return this.wasmStatus === 'ready'
    },
    /** 当前是否为 DAG 模式 */
    isDag() {
      return this.dataType === 'dag'
    },
    /** 树形布局列表（仅 tree 模式可用） */
    treeLayoutTypes() {
      return ['compact-box', 'dendrogram', 'mindmap', 'indented']
    },
    /** 当前布局是否为 WASM 布局 */
    isWasmLayout() {
      return ['fruchterman-wasm', 'force-atlas2-wasm', 'dagre-wasm'].includes(this.layoutType)
    },
  },
  mounted() {
    this.initWasm()
    this.$nextTick(() => {
      this.regenerate()
    })
  },
  beforeDestroy() {
    this.stopFps()
    if (this.graph) {
      this.graph.destroy()
      this.graph = null
    }
  },
  methods: {
    /** 异步初始化 WASM threads，完成后注册 WASM 布局 */
    async initWasm() {
      this.wasmStatus = 'pending'
      const ok = await initWasmLayouts()
      if (ok) {
        this.wasmStatus = 'ready'
        this.wasmMultiThread = isWasmMultiThread()
      } else {
        this.wasmStatus = 'error'
        this.wasmError = getWasmInitError()
      }
    },
    /** 当前配置签名，用于判断是否需要重建 Graph 实例 */
    configSignature() {
      return [
        this.dataType,
        this.layoutType,
        this.rankdir,
        this.showLabel,
        this.nodeSize,
        this.defaultCollapsed,
      ].join('|')
    },
    /** 切换数据类型时自动调整布局 */
    onDataTypeChange() {
      if (this.dataType === 'dag') {
        // DAG 不支持树形布局，自动切换到 dagre
        if (this.treeLayoutTypes.includes(this.layoutType)) {
          this.layoutType = 'dagre'
        }
      }
    },
    ensureGraph() {
      const sig = this.configSignature()
      if (this.graph && this.graphSig === sig)
        return

      if (this.graph) {
        this.graph.destroy()
        this.graph = null
      }

      const container = this.$refs.graphContainer
      if (!container)
        return

      // 捕获为本地变量，避免将 Vue 响应式数据直接传入 G6 配置
      const nodeSize = this.nodeSize
      const showLabel = this.showLabel
      const isDag = this.isDag

      // collapse-expand 仅在树形模式下启用（DAG 无树结构，不支持折叠）
      const behaviors = ['drag-canvas', 'zoom-canvas']
      if (!isDag) {
        behaviors.push({
          type: 'collapse-expand',
          trigger: 'click',
          animation: false,
          align: true,
        })
      }

      this.graph = new Graph({
        container,
        width: container.offsetWidth || 800,
        height: container.offsetHeight || 600,
        autoFit: 'view',
        data: { nodes: [], edges: [] },
        // WebGL 渲染器，GPU 加速万级节点绘制
        renderer: () => new WebGLRenderer(),
        node: {
          style: {
            size: nodeSize,
            fill: d => d.data?.color || '#5B8FF9',
            stroke: '#ffffff',
            lineWidth: 0.5,
            labelText: showLabel ? d => d.data?.label || d.id : '',
            labelFontSize: 10,
            labelFill: '#666',
            labelPlacement: 'right',
          },
        },
        edge: {
          style: {
            stroke: '#e0e0e0',
            lineWidth: 0.5,
            // DAG 是有向图，显示箭头
            endArrow: isDag,
          },
        },
        layout: this.layoutConfig(),
        behaviors,
        animation: false,
      })

      this.graphSig = sig
    },
    /** 根据当前布局类型生成对应的 layout 配置 */
    layoutConfig() {
      const base = { type: this.layoutType }
      // 捕获为本地变量，避免闭包捕获 this 导致 Vue 响应式依赖追踪
      const nodeSize = this.nodeSize
      const rankdir = this.rankdir
      if (['compact-box', 'dendrogram', 'mindmap', 'indented'].includes(this.layoutType)) {
        // 树形布局：O(n) 紧凑排布，靠 getVGap/getHGap 控制间距，避免坐标过宽
        Object.assign(base, {
          direction: rankdir === 'LR' ? 'LR' : 'TB',
          getHeight: () => nodeSize,
          getWidth: () => nodeSize,
          getVGap: () => 4,
          getHGap: () => 4,
        })
      }
      else if (this.layoutType === 'dagre') {
        // 注意：dagre 会把同层节点排成一行，1w 叶子会撑出极宽坐标，布局慢且易卡顿
        Object.assign(base, {
          rankdir,
          nodesep: 30,
          ranksep: 40,
        })
      }
      else if (this.layoutType === 'force') {
        Object.assign(base, {
          linkDistance: 30,
          nodeStrength: -30,
          preventOverlap: true,
        })
      }
      else if (this.layoutType === 'fruchterman-gpu') {
        // GPU Fruchterman：WebGPU 加速，适合万级节点的力导向布局
        Object.assign(base, {
          maxIteration: 1000,
          gravity: 10,
          speed: 5,
        })
      }
      else if (this.layoutType === 'gforce-gpu') {
        // GPU GForce：WebGPU 加速的快速力导向布局
        Object.assign(base, {
          maxIteration: 500,
          linkDistance: 30,
          nodeStrength: 1000,
          edgeStrength: 200,
          gravity: 10,
        })
      }
      else if (this.layoutType === 'fruchterman-wasm') {
        // WASM Fruchterman：Rust+WASM 加速，threads 由 wrapper 自动注入
        Object.assign(base, {
          maxIteration: 1000,
          gravity: 10,
          speed: 5,
          minMovement: 0.4,
        })
      }
      else if (this.layoutType === 'force-atlas2-wasm') {
        // WASM ForceAtlas2：收敛性和紧凑度更好
        Object.assign(base, {
          maxIteration: 500,
          kr: 5,
          kg: 1,
          ks: 0.1,
          preventOverlap: true,
        })
      }
      else if (this.layoutType === 'dagre-wasm') {
        // WASM Dagre：Rust 实现的分层布局，比 JS dagre 更快
        // WASM dagre 使用小写 rankdir
        Object.assign(base, {
          rankdir: rankdir === 'LR' ? 'lr' : 'tb',
          nodesep: 30,
          ranksep: 40,
        })
      }
      return base
    },
    async regenerate() {
      // 若选择了 WASM 布局但尚未就绪，等待初始化完成
      if (this.isWasmLayout && this.wasmStatus === 'pending') {
        this.loading = true
        await this.initWasm()
        if (this.wasmStatus !== 'ready') {
          this.loading = false
          this.$message.error('WASM 布局初始化失败，请改用其他布局')
          return
        }
      }

      this.loading = true
      // 让浏览器先绘制 loading 态，再执行阻塞主线程的布局计算
      await this.$nextTick()
      await new Promise(r => setTimeout(r, 30))

      const count = this.customCount && this.nodeCount === 'custom'
        ? Number(this.customCount) || 10000
        : Number(this.nodeCount) || 10000

      // 1) 数据生成
      const t0 = performance.now()
      const data = this.isDag ? createPlantDag(count) : createPlantTree(count)
      // 默认折叠：仅树形模式下，将 level 1（门）节点设为 collapsed，仅显示根 + 一级子节点
      if (this.defaultCollapsed && !this.isDag) {
        data.nodes.forEach((node) => {
          if (node.data?.level === 1) {
            node.style = { ...(node.style || {}), collapsed: true }
          }
        })
      }
      const t1 = performance.now()

      // 2) 建图 + 布局 + 渲染
      this.ensureGraph()
      if (!this.graph) {
        this.loading = false
        return
      }
      this.graph.setData(data)
      const t2 = performance.now()
      await this.graph.render()
      const t3 = performance.now()

      this.stats = {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
        genTime: +(t1 - t0).toFixed(1),
        renderTime: +(t3 - t2).toFixed(1),
      }

      this.startFps()
      this.loading = false
      this.$message.success(
        `渲染完成：${this.stats.nodeCount} 个节点，${this.stats.edgeCount} 条边，耗时 ${this.stats.renderTime} ms`,
      )
    },
    /** 仅重新布局（复用数据，测量布局耗时） */
    async reLayout() {
      if (!this.graph) {
        this.regenerate()
        return
      }
      this.loading = true
      await this.$nextTick()
      await new Promise(r => setTimeout(r, 30))
      const t0 = performance.now()
      await this.graph.render()
      const t1 = performance.now()
      this.stats = {
        ...this.stats,
        renderTime: +(t1 - t0).toFixed(1),
      }
      this.startFps()
      this.loading = false
      this.$message.success(`重新布局完成，耗时 ${this.stats.renderTime} ms`)
    },
    clearGraph() {
      this.stopFps()
      if (this.graph) {
        this.graph.setData({ nodes: [], edges: [] })
        this.graph.render()
      }
      this.stats = { nodeCount: 0, edgeCount: 0, genTime: 0, renderTime: 0 }
      this.fps = 0
    },
    /** 展开全部节点（仅树形模式） */
    async expandAll() {
      if (!this.graph || this.isDag) return
      this.loading = true
      await this.$nextTick()
      await new Promise(r => setTimeout(r, 30))
      const allNodes = this.graph.getNodeData()
      this.graph.updateNodeData(
        allNodes.map(n => ({ id: n.id, style: { collapsed: false } })),
      )
      const t0 = performance.now()
      await this.graph.render()
      const t1 = performance.now()
      this.stats = { ...this.stats, renderTime: +(t1 - t0).toFixed(1) }
      this.loading = false
      this.$message.success(`已展开全部节点，耗时 ${this.stats.renderTime} ms`)
    },
    /** 折叠到一级节点（仅树形模式） */
    async collapseAll() {
      if (!this.graph || this.isDag) return
      this.loading = true
      await this.$nextTick()
      await new Promise(r => setTimeout(r, 30))
      const allNodes = this.graph.getNodeData()
      // level 1 设为 collapsed，其余设为展开
      this.graph.updateNodeData(
        allNodes.map(n => ({
          id: n.id,
          style: { collapsed: n.data?.level === 1 },
        })),
      )
      const t0 = performance.now()
      await this.graph.render()
      const t1 = performance.now()
      this.stats = { ...this.stats, renderTime: +(t1 - t0).toFixed(1) }
      this.loading = false
      this.$message.success(`已折叠到一级节点，耗时 ${this.stats.renderTime} ms`)
    },
    startFps() {
      this.stopFps()
      this.fpsFrames = 0
      this.fpsLast = performance.now()
      const loop = () => {
        this.fpsFrames++
        const now = performance.now()
        const elapsed = now - this.fpsLast
        if (elapsed >= 1000) {
          this.fps = Math.round((this.fpsFrames * 1000) / elapsed)
          this.fpsFrames = 0
          this.fpsLast = now
        }
        this.fpsRaf = requestAnimationFrame(loop)
      }
      this.fpsRaf = requestAnimationFrame(loop)
    },
    stopFps() {
      if (this.fpsRaf) {
        cancelAnimationFrame(this.fpsRaf)
        this.fpsRaf = null
      }
    },
    onCountChange(val) {
      if (val !== 'custom')
        this.nodeCount = Number(val)
    },
  },
}
</script>

<template>
  <div class="tree-performance">
    <div class="perf-header">
      <h2>植物分类树 · 渲染性能测试</h2>
      <p class="perf-desc">
        以植物分类学为示例，压测 G6 在万级节点下的数据生成、布局与渲染性能。
        支持「树形（单父节点）」和「DAG（多父节点）」两种数据结构。默认测试 <b>1w（10000）</b> 节点。
      </p>
    </div>

    <div class="perf-body">
      <!-- 左侧：g6 图画布 -->
      <div class="graph-area">
        <div ref="graphContainer" class="graph-container">
          <div v-if="loading" class="graph-loading">
            正在生成并布局 {{ nodeCount === 'custom' ? customCount : nodeCount }} 个节点，请稍候…
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="control-panel">
        <!-- 规模 -->
        <div class="panel-section">
          <h4>节点规模</h4>
          <div class="form-row" style="margin-bottom: 8px">
            <span class="row-label">数据类型</span>
            <el-radio-group v-model="dataType" size="mini" @change="onDataTypeChange">
              <el-radio-button label="tree">树形（单父）</el-radio-button>
              <el-radio-button label="dag">DAG（多父）</el-radio-button>
            </el-radio-group>
          </div>
          <el-select
            v-model="nodeCount"
            size="small"
            style="width: 100%"
            @change="onCountChange"
          >
            <el-option
              v-for="opt in countOptions"
              :key="opt"
              :label="`${opt.toLocaleString()} 节点`"
              :value="opt"
            ></el-option>
            <el-option label="自定义" value="custom"></el-option>
          </el-select>
          <el-input
            v-if="nodeCount === 'custom'"
            v-model="customCount"
            type="number"
            size="small"
            placeholder="输入节点数"
            style="margin-top: 8px"
          ></el-input>
        </div>

        <!-- 布局 -->
        <div class="panel-section">
          <h4>布局与样式</h4>
          <div class="form-row">
            <span class="row-label">布局</span>
            <el-select v-model="layoutType" size="small" style="flex: 1">
              <el-option label="CompactBox（树形·快）" value="compact-box" :disabled="isDag"></el-option>
              <el-option label="Dendrogram（树形）" value="dendrogram" :disabled="isDag"></el-option>
              <el-option label="Mindmap（树形）" value="mindmap" :disabled="isDag"></el-option>
              <el-option label="Indented（树形）" value="indented" :disabled="isDag"></el-option>
              <el-option label="Dagre（分层·慢）" value="dagre"></el-option>
              <el-option label="Force（力导向·极慢）" value="force"></el-option>
              <el-option label="Fruchterman GPU（力导向·GPU）" value="fruchterman-gpu"></el-option>
              <el-option label="GForce GPU（力导向·GPU）" value="gforce-gpu"></el-option>
              <el-option
                label="Fruchterman WASM（力导向·WASM）"
                value="fruchterman-wasm"
                :disabled="!wasmAvailable"
              ></el-option>
              <el-option
                label="ForceAtlas2 WASM（力导向·WASM）"
                value="force-atlas2-wasm"
                :disabled="!wasmAvailable"
              ></el-option>
              <el-option
                label="Dagre WASM（分层·WASM）"
                value="dagre-wasm"
                :disabled="!wasmAvailable"
              ></el-option>
            </el-select>
          </div>
          <div class="form-row" style="margin-top: 8px">
            <span class="row-label">方向</span>
            <el-select v-model="rankdir" size="small" style="flex: 1">
              <el-option label="从上到下 (TB)" value="TB"></el-option>
              <el-option label="从左到右 (LR)" value="LR"></el-option>
            </el-select>
          </div>
          <div class="form-row" style="margin-top: 8px">
            <span class="row-label">显示标签</span>
            <el-switch v-model="showLabel"></el-switch>
          </div>
          <div class="form-row" style="margin-top: 8px">
            <span class="row-label">节点大小</span>
            <el-input-number
              v-model="nodeSize"
              :min="2"
              :max="40"
              :step="2"
              size="small"
              controls-position="right"
              style="flex: 1"
            ></el-input-number>
          </div>
          <div class="form-row" style="margin-top: 8px">
            <span class="row-label">默认折叠</span>
            <el-switch v-model="defaultCollapsed" :disabled="isDag"></el-switch>
            <span class="fold-hint">仅树形可用</span>
          </div>
          <p class="tip-text">
            修改布局/方向/标签/节点大小会重建画布；万级节点下建议关闭标签、减小节点以提速。
          </p>
        </div>

        <!-- WASM 状态 -->
        <div class="panel-section">
          <h4>加速引擎状态</h4>
          <div class="engine-status">
            <div class="engine-row">
              <span class="engine-label">GPU 布局</span>
              <span class="engine-badge engine-ready">已就绪</span>
            </div>
            <div class="engine-row">
              <span class="engine-label">WASM 布局</span>
              <span v-if="wasmStatus === 'pending'" class="engine-badge engine-pending">初始化中…</span>
              <span v-else-if="wasmStatus === 'ready'" class="engine-badge engine-ready">
                已就绪{{ wasmMultiThread ? '（多线程）' : '（单线程）' }}
              </span>
              <span v-else class="engine-badge engine-error">不可用</span>
            </div>
          </div>
          <p v-if="wasmStatus === 'error'" class="tip-text" style="color: #f5222d">
            WASM 初始化失败：{{ wasmError?.message || '未知错误' }}。
            请确保浏览器支持 WebAssembly，且开发服务器已配置 COOP/COEP 头。
          </p>
          <p v-else-if="wasmStatus === 'ready' && !wasmMultiThread" class="tip-text">
            当前为单线程模式。多线程需浏览器支持 SharedArrayBuffer 并配置 COOP/COEP 跨域隔离头。
          </p>
        </div>

        <!-- 操作 -->
        <div class="panel-section">
          <h4>操作</h4>
          <div class="form-row">
            <el-button type="primary" size="small" :loading="loading" @click="regenerate">
              生成并渲染
            </el-button>
            <el-button size="small" :loading="loading" @click="reLayout">
              仅重新布局
            </el-button>
            <el-button size="small" @click="clearGraph">
              清空
            </el-button>
          </div>
          <div class="form-row" style="margin-top: 8px">
            <el-button size="small" :loading="loading" :disabled="isDag" @click="expandAll">
              全部展开
            </el-button>
            <el-button size="small" :loading="loading" :disabled="isDag" @click="collapseAll">
              折叠到一级
            </el-button>
          </div>
          <p class="tip-text">
            <template v-if="isDag">DAG 模式：节点可拥有多个父节点，不支持折叠/展开。</template>
            <template v-else>点击节点可展开/折叠其子树；默认仅显示根节点与一级（门）节点。</template>
          </p>
        </div>

        <!-- 指标 -->
        <div class="panel-section">
          <h4>性能指标</h4>
          <div class="metric-grid">
            <div class="metric">
              <span class="metric-label">节点数</span>
              <span class="metric-value">{{ stats.nodeCount.toLocaleString() }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">边数</span>
              <span class="metric-value">{{ stats.edgeCount.toLocaleString() }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">数据生成</span>
              <span class="metric-value">{{ stats.genTime }} ms</span>
            </div>
            <div class="metric">
              <span class="metric-label">布局+渲染</span>
              <span class="metric-value">{{ stats.renderTime }} ms</span>
            </div>
            <div class="metric metric-fps">
              <span class="metric-label">实时 FPS</span>
              <span class="metric-value" :class="{ 'fps-good': fps >= 30, 'fps-bad': fps > 0 && fps < 15 }">{{ fps || '-' }}</span>
            </div>
          </div>
          <p class="tip-text">
            拖动/缩放画布时观察 FPS；若布局耗时过长，可尝试减小规模或切换布局方向。
          </p>
        </div>

        <!-- 图例 -->
        <div class="panel-section">
          <h4>层级图例</h4>
          <div class="legend">
            <div
              v-for="item in legendLevels"
              :key="item.name"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: item.color }"></span>
              <span class="legend-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree-performance {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.perf-header {
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
  flex-shrink: 0;
}

.perf-header h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

.perf-desc {
  margin: 0;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

.perf-desc b {
  color: #1890ff;
}

.perf-body {
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

.graph-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 6px;
  font-size: 13px;
  z-index: 10;
}

.control-panel {
  width: 340px;
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
}

.row-label {
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  width: 56px;
}

.fold-hint {
  font-size: 11px;
  color: #999;
  margin-left: 4px;
}

.tip-text {
  margin: 8px 0 0;
  font-size: 11px;
  color: #999;
  line-height: 1.5;
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.metric-label {
  font-size: 11px;
  color: #999;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.metric-fps {
  grid-column: span 2;
}

.fps-good {
  color: #52c41a;
}

.fps-bad {
  color: #f5222d;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #555;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.engine-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.engine-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.engine-label {
  font-size: 12px;
  color: #555;
}

.engine-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.engine-ready {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.engine-pending {
  background: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.engine-error {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}
</style>
