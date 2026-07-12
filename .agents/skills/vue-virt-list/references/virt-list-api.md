# VirtList API

`VirtList` 是虚拟列表核心组件，支持动态/固定高度、水平滚动、顶部/底部 buffer、悬浮插槽等。

## 属性（Props）

| 参数 | 说明 | 类型 | 默认值 | 必填 |
| --- | --- | --- | --- | --- |
| `list` | 数据数组 | `Array` | - | ✅ |
| `itemKey` | 每项唯一 id（**必须唯一且稳定**，否则滚动异常） | `String \| Number` | - | ✅ |
| `minSize` | 最小尺寸，用于估算可视区渲染个数 | `Number` | `20` | ✅ |
| `itemGap` | 元素间距（元素尺寸已包含 itemGap） | `Number` | `0` | - |
| `fixed` | 是否为固定高度（提升性能；**动态高度模式不要用**） | `Boolean` | `false` | - |
| `buffer` | 统一设置 bufferTop/bufferBottom（滚动白屏时调大） | `Number` | `0` | - |
| `bufferTop` | 顶部额外渲染个数 | `Number` | `0` | - |
| `bufferBottom` | 底部额外渲染个数 | `Number` | `0` | - |
| `horizontal` | 是否水平滚动 | `Boolean` | `false` | - |
| `scrollDistance` | 提前触发 toTop/toBottom 的阈值（px） | `Number` | `0` | - |
| `fixSelection` | 修复滚动丢失 selection 问题（仅 Vue2 生效） | `Boolean` | `false` | - |
| `start` | 起始渲染下标 | `Number` | `0` | - |
| `offset` | 起始渲染顶部高度 | `Number` | `0` | - |
| `listStyle` | 列表容器样式 | `string \| Array \| object` | `''` | - |
| `listClass` | 列表容器类名 | `string \| Array \| object` | `''` | - |
| `itemStyle` | item 容器样式，可传函数 `(item, index) => style` | `string \| Array \| object \| fn` | `''` | - |
| `itemClass` | item 容器类名，可传函数 `(item, index) => class` | `string \| Array \| object \| fn` | `''` | - |
| `renderControl` | 渲染控制器，可强制调整渲染区间 | `(begin, end) => ({ begin, end })` | - | - |
| `headerClass` / `headerStyle` | header 插槽容器样式 | - | - | - |
| `footerClass` / `footerStyle` | footer 插槽容器样式 | - | - | - |
| `stickyHeaderClass` / `stickyHeaderStyle` | 顶部悬浮插槽样式 | - | - | - |
| `stickyFooterClass` / `stickyFooterStyle` | 底部悬浮插槽样式 | - | - | - |

## 插槽（Slots）

| name | 说明 |
| --- | --- |
| `default` | item 内容，作用域参数 `{ itemData, index }` |
| `header` | 顶部插槽 |
| `footer` | 底部插槽 |
| `sticky-header` | 顶部悬浮插槽（滚动时固定在顶部） |
| `sticky-footer` | 底部悬浮插槽（滚动时固定在底部） |
| `empty` | 空数据插槽 |

## 事件（Events）

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| `toTop` | 触顶回调 | 列表第一项 |
| `toBottom` | 触底回调 | 列表最后一项 |
| `scroll` | 滚动回调 | `Event` |
| `itemResize` | item 尺寸变化 | `{ id: string, newSize: number }` |
| `rangeUpdate` | 可视区范围变更 | `{ inViewBegin, inViewEnd }` |

## 暴露方法（通过 ref 调用）

| 方法 | 说明 | 参数 |
| --- | --- | --- |
| `reset()` | 重置列表 | - |
| `getOffset()` | 获取当前滚动高度 | - |
| `scrollToTop()` | 滚动到顶部 | - |
| `scrollToBottom()` | 滚动到底部 | - |
| `scrollToIndex(index)` | 滚动到指定下标 | `index` |
| `scrollIntoView(index)` | 仅在不可见时滚动到指定下标 | `index` |
| `scrollToOffset(px)` | 滚动到指定像素 | `px` |
| `getItemSize(index)` | 获取指定 item 尺寸 | `index` |
| `getItemPosByIndex(index)` | 获取 item 位置 `{ top, current, bottom }` | `index` |
| `forceUpdate()` | 强制更新（数据长度变化后必须调用） | - |
| `deletedList2Top(list)` | 删除顶部 list（分页场景） | `list[]` |
| `addedList2Top(list)` | 顶部追加 list（分页场景） | `list[]` |
| `manualRender(begin, end)` | 手动控制渲染区间 | `(begin, end)` |
| `getReactiveData()` | 返回内部响应式数据 `reactiveData` | - |
| `getSlotSize()` | 获取插槽尺寸 | - |

## 内部响应式数据 `reactiveData`

通过 `ref.getReactiveData()` 或 `ref.reactiveData` 获取（模板中可用 `virtListRef.reactiveData`）。

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `views` | number | 可视区域渲染个数 |
| `offset` | number | 滚动距离 |
| `listTotalSize` | number | 不包含插槽的总高度 |
| `virtualSize` | number | 虚拟占位尺寸（从 0 到 renderBegin 的高度） |
| `inViewBegin` | number | 可视区起始下标 |
| `inViewEnd` | number | 可视区结束下标 |
| `renderBegin` | number | 实际渲染起始下标 |
| `renderEnd` | number | 实际渲染结束下标 |
| `bufferTop` | number | 顶部 buffer 个数 |
| `bufferBottom` | number | 底部 buffer 个数 |

### `slotSize: SlotSize`

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `clientSize` | number | 可视区容器高度 |
| `headerSize` | number | header 插槽高度 |
| `footerSize` | number | footer 插槽高度 |
| `stickyHeaderSize` | number | stickyHeader 插槽高度 |
| `stickyFooterSize` | number | stickyFooter 插槽高度 |

## 关键提示

- 使用 `useVirtList` 组合式函数可获得与组件一致的能力（返回 `props / renderList / clientRefEl / listRefEl / reactiveData / slotSize / 各方法`）。
- 分页加载场景：顶部追加用 `addedList2Top`，顶部删除用 `deletedList2Top`，并配合 `scrollToIndex` 保持位置。
- 动态高度 item 内容变化（非长度变化）需通过 `renderKey` 或 `forceUpdate()` 触发重渲染。
