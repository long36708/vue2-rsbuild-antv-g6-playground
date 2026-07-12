---
name: vue-virt-list
description: 指导用户或 AI 快速上手 vue-virt-list（longmo-vue-virt-list）虚拟滚动组件库。当用户需要了解其安装方式、API、最佳实践、常见踩坑，或要编写基于 VirtList / VirtTree / VirtGrid / RealList / VirtListTransfer 的虚拟列表/树/网格代码时使用本 skill。即使用户没有组件库源码，本 skill 也提供完整的 API 说明、可直接复制的示例与模板。
---

# vue-virt-list 使用指南

`vue-virt-list`（npm 包名 `longmo-vue-virt-list`）是一个轻量、支持 Vue2.x 与 Vue3.x 的虚拟滚动组件库，可处理海量数据并保持高性能。底层通过 `vue-demi` 同时兼容 Vue2/3。

## 何时使用本 skill

- 需要渲染**长列表 / 大数据量**（上千至数十万条）且要保持滚动流畅。
- 需要使用虚拟树（VirtTree）、虚拟网格（VirtGrid）、真实列表（RealList）或带穿梭框的列表（VirtListTransfer）。
- 遇到滚动白屏、item 高度跳动、数据更新后视图不刷新、Vue2 下 selection 丢失等问题。
- 想了解组件属性、插槽、事件、暴露方法，或寻找可直接复用的代码模板。

## 组件选择速查

| 组件 | 用途 | 关键 prop |
| --- | --- | --- |
| `VirtList` | 虚拟列表（行/列），支持动态高度、水平滚动 | `list`、`itemKey`、`minSize` |
| `VirtGrid` | 虚拟网格（每行 N 列），基于 VirtList 封装 | `list`、`minSize`、`gridItems` |
| `VirtTree` | 虚拟树，支持懒加载、勾选、拖拽、筛选 | `list`、`minSize`、`fieldNames` |
| `RealList` | 真实（非虚拟）列表，用于小数据或需要完整 DOM 的场景 | `list`、`itemKey` |
| `VirtListTransfer` | 带穿梭框的双列表 | 见组件源码/类型 |

> 所有虚拟组件**必须**给外层容器或组件本身设置一个固定高度（如 `height: 500px`），否则无法计算可视区域。

## 快速开始

### 安装

```bash
# Vue3 项目
npm install longmo-vue-virt-list

# Vue2 项目还需安装 composition-api（可选依赖）
npm install longmo-vue-virt-list @vue/composition-api
```

### 最小可用示例（VirtList）

```vue
<template>
  <div style="height: 500px">
    <VirtList :list="list" itemKey="id" :minSize="40">
      <template #default="{ itemData, index }">
        <div class="row">#{{ index }} - {{ itemData.text }}</div>
      </template>
    </VirtList>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { VirtList } from 'longmo-vue-virt-list';

const list = shallowRef(
  Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `item-${i}` })),
);
</script>
```

### 最小可用示例（VirtTree）

```vue
<template>
  <div style="height: 500px">
    <VirtTree :list="list" :fieldNames="{ key: 'id' }" expandOnClickNode>
      <template #default="{ node }">
        <span>{{ node.title }}</span>
      </template>
    </VirtTree>
  </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { VirtTree } from 'longmo-vue-virt-list';
import 'longmo-vue-virt-list/lib/assets/tree.css'; // 树组件必须引入样式

const list = shallowRef([
  { id: 1, title: 'Node-1', children: [{ id: 11, title: 'Node-1-1' }] },
]);
</script>
```

> 注意：只有 `VirtTree` 需要额外引入 `lib/assets/tree.css`；`VirtList` / `VirtGrid` 自带内联样式，无需引入 CSS 文件。

## 核心概念（必读）

1. **`itemKey` 必须唯一且稳定**：它是虚拟计算定位每个 item 的标识。重复或不稳定会导致滚动错乱、白屏。
2. **`minSize` 是性能基准**：组件用它估算可视区能渲染多少 item。动态高度场景下设一个接近平均值的数值即可；固定高度场景设 `fixed` 可进一步提升性能（但动态高度下**不要**用 `fixed`）。
3. **数据用 `shallowRef` 而非 `ref`**：海量数据下避免深层响应式代理带来的性能损耗。数据长度变化后需调用组件实例的 `forceUpdate()`。
4. **虚拟滚动原理**：组件只渲染可视区 + buffer 区的 item，通过 `virtualSize`（顶部占位）把列表撑开以实现正确滚动条。内部 `reactiveData` 暴露了 `inViewBegin/inViewEnd/renderBegin/renderEnd` 等实时信息。

## 参考文档

按需读取以下文件（均在 `references/` 目录）：

- `references/virt-list-api.md` — VirtList 完整属性、插槽、事件、暴露方法、reactiveData 结构。
- `references/virt-tree-api.md` — VirtTree 属性（含受控/非受控模式、Vue2/3 差异）、方法、事件、插槽、CSS 变量、TreeNode/TreeFieldNames 类型。
- `references/virt-grid-api.md` — VirtGrid 属性与方法（基于 VirtList）。
- `references/best-practices.md` — 性能优化与最佳实践（shallowRef、forceUpdate、渲染层与交互层分离、buffer 调优等）。
- `references/common-pitfalls.md` — 14+ 常见踩坑与解决方案（白屏、高度跳动、视图不刷新、Vue2 selection、百万级上限等）。
- `references/examples.md` — 20+ 实用代码示例，覆盖各组件常见场景。

## 可直接复制的模板

`assets/templates/` 下提供完整可运行的单文件组件：

- `basic-virt-list.vue` — 基础虚拟列表（滚动控制、增删、事件）。
- `lazy-tree.vue` — 懒加载树（搜索、勾选、展开、动态加载子节点）。
- `grid-layout.vue` — 响应式列数的虚拟网格。

## 使用建议

- 第一次使用：先读 `references/virt-list-api.md` 了解通用属性，再按场景读 tree/grid 文档。
- 写代码前：直接复制 `assets/templates/` 对应模板，替换数据源即可。
- 性能问题：先看 `references/best-practices.md`，再对照 `references/common-pitfalls.md` 排查。
- Vue2 项目：特别注意受控属性用 `.sync`、响应式数组更新方式、以及 `fixSelection` 的启用（详见 references/virt-tree-api.md 与 common-pitfalls.md）。
