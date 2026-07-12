# VirtGrid API

`VirtGrid` 是虚拟网格组件，内部基于 `VirtList` 实现：它把 `list` 按 `gridItems` 每行列数切分为「行」数据，每行渲染多个 item。因此继承 VirtList 的通用属性（`minSize`、`itemGap`、`buffer`、`horizontal`、`listStyle` 等）。

## 属性（Props）

| 参数 | 说明 | 类型 | 默认值 | 必填 |
| --- | --- | --- | --- | --- |
| `list` | 数据数组 | `Array` | - | ✅ |
| `minSize` | 最小尺寸（估算可视区行数） | `Number` | `20` | ✅ |
| `gridItems` | 每行展示的列数 | `Number` | `2` | - |
| 其他属性 | 同 VirtList 属性 | - | - | - |

> `itemKey` 仍由内部从原 `list` 的每项读取（保持唯一）。`gridItems` 改变时组件会自动滚动到相近位置（`scrollToLastIndex`）。

## 暴露方法（通过 ref 调用）

| 方法 | 说明 | 参数 |
| --- | --- | --- |
| `scrollToTop()` | 滚动到顶部 | - |
| `scrollToBottom()` | 滚动到底部 | - |
| `scrollToIndex(index)` | 滚动到指定**原始下标**（内部换算为行） | `index` |
| `scrollIntoView(index)` | 仅不可见时滚动到指定原始下标 | `index` |
| `scrollToOffset(px)` | 滚动到指定像素 | `px` |
| `forceUpdate()` | 强制更新 | - |

## 插槽（Slots）

| name | 说明 |
| --- | --- |
| `default` | item 内容，作用域 `{ itemData, index, rowIndex }`（`index` 为原始下标，`rowIndex` 为行下标） |
| `header` | 顶部插槽 |
| `footer` | 底部插槽 |
| `sticky-header` | 顶部悬浮插槽 |
| `sticky-footer` | 底部悬浮插槽 |
| `empty` | 空数据插槽 |

## 事件（Events）

同 VirtList：`scroll` / `toTop` / `toBottom` / `itemResize` / `rangeUpdate`。

## 使用要点

- 数据用 `ref` 或 `shallowRef` 均可；若用 `shallowRef` 且长度变化，需调用 `forceUpdate()`。
- 删除某项后（尤其 `shallowRef`），调用 `virtGridRef.value?.forceUpdate()` 刷新内部 `gridList`。
- `gridItems` 动态改变会触发重新分块并尽量保持滚动位置。
- 性能：item 内容尽量简洁；复杂卡片建议把交互层与渲染层分离（见 best-practices.md）。

## 最小示例

```vue
<template>
  <div style="height: 500px">
    <VirtGrid :list="list" :minSize="70" :gridItems="4">
      <template #default="{ itemData, index }">
        <div class="card">#{{ index }} {{ itemData.name }}</div>
      </template>
    </VirtGrid>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VirtGrid } from 'longmo-vue-virt-list';

const list = ref(
  Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `item-${i}` })),
);
</script>
```
