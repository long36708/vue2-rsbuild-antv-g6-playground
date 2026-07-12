# 常见踩坑与解决方案

## 1. 列表不显示 / 空白

**原因**：外层容器没有固定高度，组件无法计算可视区。
**解决**：给包裹元素或组件设置 `height`，例如 `<div style="height: 500px"><VirtList .../></div>`。

## 2. 滚动白屏 / 快速滚动出现空白

**原因**：buffer 不足，快速滚动时新 item 未及渲染。
**解决**：增大 `buffer` 或分别设置 `bufferTop` / `bufferBottom`，如 `:buffer="5"` 或 `:bufferTop="10" :bufferBottom="10"`。

## 3. item 高度跳动 / 滚动条抖动

**原因**：动态高度下 `minSize` 与实际高度偏差大，或 item 内容异步变化导致测量时机不对。
**解决**：
- `minSize` 设为接近平均高度。
- 固定高度场景用 `fixed`。
- item 内容变化后用 `forceUpdate()` 或 `renderKey` 重渲染。
- 监听 `@itemResize` 确认尺寸是否被正确测量。

## 4. 数据更新后视图不刷新

**原因**：使用 `shallowRef` 时，组件无法感知长度变化；或 Vue3 受控数组原地修改。
**解决**：
- `shallowRef` 改数据后调用 `ref.value.forceUpdate()`。
- Vue3 受控 `expandedKeys/checkedKeys/selectedKeys` 必须用**新数组**赋值，不能原地 `push/splice`。
- Vue2 受控则用原数组方法（`push/splice/pop`）以触发响应式。

## 5. `itemKey` 重复或变化导致滚动错乱

**原因**：`itemKey` 非唯一或不稳定（如用数组下标）。
**解决**：使用稳定唯一值（数据库 id）。删除/排序后 key 不得改变。

## 6. Vue2 下滚动丢失 selection（整列表重新挂载）

**原因**：Vue2 的 diff 算法在向下滚动时导致列表整体重新挂载。
**解决**：设置 `fixSelection`（仅 Vue2 生效），`VueList` 的 `fixSelection` prop 修复该问题。

## 7. 百万级数据无法滚动到底

**原因**：浏览器对单个 DOM 元素有最大高度限制，约 38 万行后滚动条到达上限无法继续。
**解决**：官方计划用自绘滚动条解决；当前变通方案：分页加载（顶部追加 `addedList2Top`）、虚拟分页、或限制单屏数据量。

## 8. VirtTree 布局错乱 / 没有样式

**原因**：未引入树的 CSS。
**解决**：`import 'longmo-vue-virt-list/lib/assets/tree.css'`（仅树组件需要，列表/网格不需要）。

## 9. VirtTree 展开/折叠卡顿（大数据量）

**原因**：`defaultExpandAll` 在 30w+ 节点下递归展开 + renderList 计算属性开销巨大。
**解决**：不要默认展开全部；使用懒加载；只展开必要的层级。

## 10. VirtTree 受控模式不更新（Vue3）

**原因**：对 `expandedKeys` 等做原地修改（`push`），Vue3 响应式不触发。
**解决**：赋新数组 `expandedKeys.value = [...expandedKeys.value, key]`。

## 11. VirtTree 受控模式不更新（Vue2）

**原因**：用新数组替换而非原数组方法。
**解决**：使用 `splice/push/pop` 等原数组方法，配合 `.sync` 修饰符。

## 12. 拖拽后数据没变

**原因**：组件拖拽后**不直接修改数据**，只触发 `drop` 事件。
**解决**：在 `@drop` 事件中自行修改 `list` 数据（移动节点），数据变更后通过响应式更新树。

## 13. 水平滚动不生效

**原因**：未设置 `horizontal`，或容器/列表宽度未正确约束。
**解决**：设置 `:horizontal="true"`，并确保列表容器有合适宽度与 `overflow-x`。

## 14. `fixed` 导致高度测量错误

**原因**：动态高度场景误用 `fixed`（跳过测量，按 `minSize` 计算）。
**解决**：动态高度不要用 `fixed`；仅当所有 item 等高时使用。

## 调试技巧汇总

- 用 `ref.reactiveData` 观察 `renderBegin/renderEnd/inViewBegin/inViewEnd`，确认渲染区间。
- 用 `@rangeUpdate` 做无限滚动加载。
- 用 `@itemResize` 排查高度测量问题。
- 用 `getItemPosByIndex(index)` 获取某 item 的 `top/current/bottom` 位置。
