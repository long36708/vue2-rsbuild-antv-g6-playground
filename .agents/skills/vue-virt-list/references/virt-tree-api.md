# VirtTree API

`VirtTree` 是虚拟树组件，支持懒加载、勾选（checkbox）、选中、拖拽、筛选、连接线等。它基于 `VirtList` 实现，因此继承 VirtList 的通用属性（如 `minSize`、`itemGap`、`buffer`、`horizontal`、`listStyle` 等）。

> **必须引入样式**：`import 'longmo-vue-virt-list/lib/assets/tree.css'`

## Tree Attributes

| Attribute | 说明 | 类型 | 默认值 | 必填 |
| --- | --- | --- | --- | --- |
| `list` | 树数据 | `TreeNodeData[]` | - | ✅ |
| `minSize` | 最小尺寸（估算可视区个数） | `number` | `32` | ✅ |
| `indent` | 相邻层级节点的水平缩进（px） | `number` | `16` | - |
| `iconSize` | 图标大小 | `number` | `16` | - |
| `itemGap` | 元素间距 | `number` | `0` | - |
| `showLine` | 是否显示层级连接线 | `boolean` | `false` | - |
| `fixed` | 固定高度（提升性能；动态高度不要用） | `boolean` | `true` | - |
| `expand` 组 | | | | |
| `expandedKeys` (`.sync`) | 展开的节点 key 集合 | `TreeNodeKey[]` | `[]` | - |
| `defaultExpandAll` | 是否默认展开全部 | `boolean` | `true` | - |
| `expandOnClickNode` | 点击节点是否展开（仅 selectable/checkOnClickNode 为 false 时生效） | `boolean` | `true` | - |
| `checkable` 组 | | | | |
| `checkable` | 是否显示 checkbox | `boolean` | `false` | - |
| `checkedKeys` (`.sync`) | 勾选的 key 集合 | `TreeNodeKey[]` | `[]` | - |
| `checkOnClickNode` | 点击节点是否勾选 | `boolean` | `false` | - |
| `checkedStrictly` | 父子是否互不关联（严格模式） | `boolean` | `false` | - |
| `selectable` 组 | | | | |
| `selectable` | 是否可选中 | `boolean` | `false` | - |
| `selectedKeys` (`.sync`) | 选中的 key 集合 | `TreeNodeKey[]` | `[]` | - |
| `selectMultiple` | 是否多选 | `boolean` | `false` | - |
| `focus` 组 | | | | |
| `focusedKeys` (`.sync`) | 激活的 key 集合或单个节点 | `TreeNodeKey \| TreeNodeKey[]` | `[]` | - |
| `draggable` 组 | | | | |
| `draggable` | 是否开启拖拽 | `boolean` | `false` | - |
| `dragClass` | 拖拽节点 class | `string` | `''` | - |
| `dragGhostClass` | 拖拽克隆节点 class | `string` | `''` | - |
| `beforeDrag` | 拖拽进入节点前的回调，返回 false 禁止 | `() => boolean` | - | - |
| `dragoverPlacement` | 拖拽区域生效范围 | `number[]` | `[33, 66]` | - |
| `filterMethod` | 筛选方法，返回 true 显示 | `() => boolean` | - | - |
| `fieldNames` | 字段映射配置 | `TreeFieldNames` | - | - |
| 其他属性 | 同 VirtList 属性 | - | - | - |

## 受控 / 非受控模式（重要）

### Vue3

- 受控：`v-model:expandedKeys` / `v-model:checkedKeys` / `v-model:selectedKeys` / `v-model:focusedKeys`
- 更新：`expandedKeys` 等**必须使用新数组**才能触发响应式（不要原地修改）。
- 非受控：不传对应 keys，使用 `expandAll() / expandNode()`、`checkAll() / checkNode()`、`selectAll() / selectNode()` 方法，通过 `@expand` / `@check` / `@select` 事件接收变更。

### Vue2

- 受控：`:expandedKeys.sync` / `:checkedKeys.sync` / `:selectedKeys.sync` / `:focusedKeys.sync`
- 更新：由于 Vue2 响应式特性，需使用原数组方法改变响应式，如 `splice() / pop() / push()` 等。
- 非受控：同 Vue3。

## Tree Methods（通过 ref 调用）

| 方法 | 说明 | 参数 |
| --- | --- | --- |
| `scrollTo` | 滚动到指定节点 | `{ key?, align?: 'view'\|'top', offset? }` |
| `hasSelected(node)` | 节点是否被选中 | `(node: TreeNode) => boolean` |
| `selectAll(selected)` | 设置全部选中状态 | `(selected: boolean)` |
| `selectNode(key, selected)` | 选中指定节点 | `(key, selected)` |
| `hasExpanded(node)` | 节点是否展开 | `(node) => boolean` |
| `toggleExpand(node)` | 切换节点展开 | `(node) => boolean` |
| `expandAll(expanded)` | 设置全部展开状态 | `(expanded: boolean)` |
| `expandNode(key, expanded)` | 展开指定节点 | `(key, expanded)` |
| `hasChecked(node)` | 节点是否勾选 | `(node) => boolean` |
| `hasIndeterminate(node)` | 节点是否半选 | `(node) => boolean` |
| `checkAll(checked)` | 设置全部勾选状态 | `(checked: boolean)` |
| `checkNode(key, checked)` | 勾选指定节点 | `(key, checked)` |

## Tree Events

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| `select` | 点击节点 | `selectedKeys`, `data: { selected?, selectedNodes, node?, e? }` |
| `check` | 点击复选框 | `checkedKeys`, `data: { checked?, checkedNodes, node?, e?, halfCheckedKeys?, halfCheckedNodes? }` |
| `expand` | 展开/折叠 | `expandKeys`, `data: { expanded?, expandNodes, node?, e? }` |
| `drag-start` | 开始拖拽 | `ev: DragEvent, node` |
| `drag-end` | 结束拖拽 | `ev: DragEvent, node` |
| `drag-over` | 拖拽至可释放目标 | `ev: DragEvent, node` |
| `drag-leave` | 离开可释放目标 | `ev: DragEvent, node` |
| `drop` | 在目标上释放 | `data: { e, dragNode, dropNode, dropPosition }` |

> 拖拽后**不直接修改数据**，由业务在 `drop` 事件中自行判定并修改数据，数据变更后通过响应式更新树。

## Tree Slots

| name | 说明 |
| --- | --- |
| `icon` | 图标插槽，作用域 `{ node }` |
| `content` | 节点内容插槽，作用域 `{ node }` |
| `default` | 整个 item 内容，作用域 `{ node, data, expand }` |
| `header` | 顶部插槽，作用域 `{ node, data, expand }` |
| `footer` | 底部插槽，作用域 `{ node, data, expand }` |
| `empty` | 空数据插槽 |

## 类型定义

```ts
type TreeNodeData = Record<string, any>;
type TreeNodeKey = string | number;
type TreeData = TreeNodeData[];

interface TreeNode<T = TreeNodeData> {
  key: TreeNodeKey;
  level: number;
  title?: string;
  isLeaf?: boolean;        // 动态加载时有效，标记叶子节点
  isLast?: boolean;        // 当前层级最后节点
  parent?: TreeNode;
  children?: TreeNode[];
  disableSelect?: boolean;
  disableCheckbox?: boolean;
  searchedIndex?: number;
  data: T;
}

interface TreeFieldNames {
  key?: string;            // 默认 'key'
  title?: string;          // 默认 'title'
  children?: string;       // 默认 'children'
  disableSelect?: string;  // 默认 'disableSelect'
  disableCheckbox?: string;// 默认 'disableCheckbox'
  disableDragIn?: string;  // 默认 'disableDragIn'
  disableDragOut?: string; // 默认 'disableDragOut'
}
```

## 懒加载

- 节点数据中包含 `isLeaf: true` 表示叶子节点（无子节点，不显示展开箭头）。
- 展开非叶子节点时，通过 `@expand` 事件监听，动态加载子节点并更新 `list` 数据（追加 `children`）。
- 配合 `expandedKeys` 受控模式，避免重复加载。

## CSS 变量（自定义主题）

作用于 `.virt-tree-item`：

```css
.virt-tree-item {
  /* 文本 */
  --virt-tree-color-text: #1f2329;
  --virt-tree-color-text-disabled: #a8abb2;
  --virt-tree-color-text-selected: #1456f0;
  /* 节点背景 */
  --virt-tree-color-node-bg: #fff;
  --virt-tree-color-node-bg-hover: #1f232914;
  --virt-tree-color-node-bg-selected: #f0f4ff;
  /* 图标 */
  --virt-tree-color-icon: #2b2f36;
  /* 连接线 */
  --virt-tree-line-color: #cacdd1;
  /* 复选框 */
  --virt-tree-color-checkbox-bg-checked: #1890ff;
  --virt-tree-color-checkbox-border-checked: #1890ff;
  /* 拖拽线 */
  --virt-tree-color-drag-line: #4c88ff;
  /* 图标 margin 与拖拽线左边距 */
  --virt-tree-switcher-icon-margin-right: 4px;
  --virt-tree-drag-line-gap: 4px;
}
```

暗色模式示例：

```css
html.dark .virt-tree-item {
  --virt-tree-color-text: #f9f9f9;
  --virt-tree-color-node-bg: #1b1b1f;
  --virt-tree-color-node-bg-hover: #2e3238;
  --virt-tree-color-node-bg-selected: #152340;
  --virt-tree-line-color: #35393f;
}
```

## 大数据量注意

- 8 × 10w 节点树占用内存约 500MB，勾选约 3s，滚动不卡，但折叠/展开单节点会明显卡顿。
- `defaultExpandAll` 在 30w+ 节点下展开单个节点会卡顿（递归展开 + renderList 计算属性消耗大）。
- 建议：懒加载、默认只展开少量层级、避免一次性展开全部。
