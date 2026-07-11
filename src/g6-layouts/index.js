/**
 * G6 v5 自定义布局注册模块
 *
 * 将 @antv/layout-gpu 和 @antv/layout-wasm 的布局算法注册到 G6 v5，
 * 通过 register('layout', type, Ctor) 注册后即可在 Graph 配置中使用。
 *
 * - GPU 布局：无需异步初始化，直接注册（依赖 WebGPU 支持）
 * - WASM 布局：需先调用 initWasmLayouts() 初始化 threads，再注册
 *
 * WASM 布局使用 wrapper 类从模块级变量注入 threads，
 * 避免 Comlink proxy 对象经过 G6 的 deepMix 被意外克隆。
 */

import { register } from '@antv/g6'
import {
  FruchtermanLayout as GPUFruchtermanLayout,
  GForceLayout as GPUGForceLayout,
} from '@antv/layout-gpu'
import {
  FruchtermanLayout as WASMFruchtermanLayout,
  ForceAtlas2Layout as WASMForceAtlas2Layout,
  AntVDagreLayout as WASMDagreLayout,
  initThreads,
  supportsThreads,
} from '@antv/layout-wasm'

// ─── GPU 布局注册（同步，无需初始化） ───────────────────────────

let gpuRegistered = false

export function registerGpuLayouts() {
  if (gpuRegistered) return
  register('layout', 'fruchterman-gpu', GPUFruchtermanLayout)
  register('layout', 'gforce-gpu', GPUGForceLayout)
  gpuRegistered = true
}

// ─── WASM 布局注册（异步，需先初始化 threads） ──────────────────

let _wasmThreads = null
let _wasmMultiThread = false
let _wasmInitPromise = null
let _wasmInitError = null
let wasmRegistered = false

/**
 * 模块级 threads 注入：wrapper 类在 execute/assign 时自动注入 threads，
 * 避免将 Comlink proxy 传入 G6 的 deepMix。
 */
class WasmFruchtermanWrapper extends WASMFruchtermanLayout {
  execute(graph, options) {
    return super.execute(graph, { ...options, threads: _wasmThreads })
  }
  assign(graph, options) {
    return super.assign(graph, { ...options, threads: _wasmThreads })
  }
}

class WasmForceAtlas2Wrapper extends WASMForceAtlas2Layout {
  execute(graph, options) {
    return super.execute(graph, { ...options, threads: _wasmThreads })
  }
  assign(graph, options) {
    return super.assign(graph, { ...options, threads: _wasmThreads })
  }
}

class WasmDagreWrapper extends WASMDagreLayout {
  execute(graph, options) {
    return super.execute(graph, { ...options, threads: _wasmThreads })
  }
  assign(graph, options) {
    return super.assign(graph, { ...options, threads: _wasmThreads })
  }
}

/**
 * 初始化 WASM threads 并注册 WASM 布局。
 * 多线程需要浏览器支持 SharedArrayBuffer（需 COOP/COEP 头），
 * 不支持时自动降级为单线程。
 *
 * @returns {Promise<boolean>} 是否初始化成功
 */
export async function initWasmLayouts() {
  if (_wasmInitPromise) return _wasmInitPromise

  _wasmInitPromise = (async () => {
    try {
      _wasmMultiThread = await supportsThreads()
      _wasmThreads = await initThreads(_wasmMultiThread)

      register('layout', 'fruchterman-wasm', WasmFruchtermanWrapper)
      register('layout', 'force-atlas2-wasm', WasmForceAtlas2Wrapper)
      register('layout', 'dagre-wasm', WasmDagreWrapper)
      wasmRegistered = true

      return true
    } catch (err) {
      _wasmInitError = err
      console.error('[g6-layouts] WASM 初始化失败:', err)
      return false
    }
  })()

  return _wasmInitPromise
}

// ─── 状态查询 ─────────────────────────────────────────

export function isWasmReady() {
  return wasmRegistered && _wasmThreads !== null
}

export function isWasmMultiThread() {
  return _wasmMultiThread
}

export function getWasmInitError() {
  return _wasmInitError
}

// ─── 统一初始化入口 ───────────────────────────────────

/**
 * 注册所有自定义布局：GPU 同步注册，WASM 异步初始化。
 * 在应用启动时调用即可。
 */
export async function setupCustomLayouts() {
  registerGpuLayouts()
  await initWasmLayouts()
}
