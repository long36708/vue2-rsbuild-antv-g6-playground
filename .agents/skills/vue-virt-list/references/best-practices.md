# 最佳实践与性能优化

## 核心原则

1. **容器必须有固定高度**：给外层包裹元素或组件设置 `height`（如 `height: 500px`）。没有高度，虚拟滚动无法计算可视区，列表不会渲染。
2. **`itemKey` 唯一且稳定**：它是定位每个 item 的标识。用数据库主键或稳定索引，不要用数组下标（排序/删除后会变）。
3. **大数据用 `shallowRef`**：避免 Vue 对海量数据做深层响应式代理。`import { shallowRef } from 'vue'`。
4. **数据长度变化后调用 `forceUpdate()`**：`shallowRef` 下组件无法感知 `.value = newList` 之外的长度变化，需 `ref.value.forceUpdate()` 触发重算。
5. **渲染层与交互层分离**：item 内部 DOM 尽量极简；复杂交互（弹窗、编辑）放到 item 外部或用 `renderKey` 局部更新。

## 各组件优化策略

### VirtList

- **固定高度场景**：设置 `fixed` 可跳过高度测量，性能最佳。注意：`fixed` 仅适用于所有 item 等高的场景，动态高度不要用。
- **滚动白屏**：增大 `buffer` / `bufferTop` / `bufferBottom`（如 `:buffer="5"`），提前多渲染若干 item。
- **动态高度**：`minSize` 设为接近平均高度的值，组件会自动测量真实高度并缓存（`sizesMap`）。
- **滚动定位**：用 `scrollToIndex` / `scrollIntoView` / `scrollToOffset`，避免手动操作原生 `scrollTop`。
- **分页/无限滚动**：顶部追加用 `addedList2Top`，顶部删除用 `deletedList2Top`，保持滚动位置。

### VirtTree

- **懒加载优先**：不要一次性传入几十万节点。按需加载子节点，配合 `isLeaf` 标记叶子。
- **避免 `defaultExpandAll` 在大数据量下使用**：30w+ 节点展开会卡顿（递归展开 + renderList 计算属性开销）。
- **受控 keys 用新数组（Vue3）**：`expandedKeys = [...expandedKeys, newKey]`，不要 `push`。
- **勾选性能**：8 × 10w 节点勾选约 3s，属正常开销；如卡顿考虑分批或虚拟勾选。
- **样式**：树组件必须 `import 'longmo-vue-virt-list/lib/assets/tree.css'`，否则布局错乱。

### VirtGrid

- **`gridItems` 合理设置**：列数越多，单行越高，`minSize` 应设为单行高度（含 itemGap）。
- **`shallowRef` 删除项后**：调用 `forceUpdate()` 刷新内部 `gridList` 分块。
- **卡片简洁**：网格 item 通常是卡片，保持 DOM 轻量。

## 内存管理

- 组件卸载时，ResizeObserver 由组件内部管理，一般无需手动销毁；但若手动持有 `reactiveData` / 大数据引用，注意释放。
- 超大数据（如 70w+）注意浏览器对单个元素最大高度的限制（见 common-pitfalls.md 百万级上限）。

## 渲染调试

- 通过 `ref.reactiveData` 实时查看 `renderBegin / renderEnd / inViewBegin / inViewEnd`，确认渲染区间符合预期。
- 通过 `@rangeUpdate` 事件监听可视区变化，用于懒加载下一页。
- 通过 `@itemResize` 监听 item 尺寸变化，排查高度跳动问题。
