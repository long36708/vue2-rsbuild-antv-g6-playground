# 实用代码示例

以下示例均自包含，可直接复制到项目中使用（假设已 `npm install longmo-vue-virt-list`）。仅 VirtTree 需要额外引入 `lib/assets/tree.css`。

## VirtList

### 基础列表 + 滚动控制

```vue
<template>
  <div style="height: 500px">
    <VirtList ref="listRef" :list="list" itemKey="id" :minSize="40" :buffer="5">
      <template #default="{ itemData, index }">
        <div class="row">#{{ index }} - {{ itemData.text }}</div>
      </template>
    </VirtList>
    <div>
      <button @click="listRef?.scrollToTop()">顶部</button>
      <button @click="listRef?.scrollToBottom()">底部</button>
      <button @click="listRef?.scrollToIndex(500)">到第500</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { VirtList } from 'longmo-vue-virt-list';

const listRef = ref<typeof VirtList | null>(null);
const list = shallowRef(
  Array.from({ length: 100000 }, (_, i) => ({ id: i, text: `item-${i}` })),
);
</script>
```

### 动态高度 item

```vue
<template>
  <div style="height: 500px">
    <VirtList :list="list" itemKey="id" :minSize="60">
      <template #default="{ itemData }">
        <div class="card" :style="{ padding: itemData.expanded ? '20px' : '8px' }">
          {{ itemData.text }}
        </div>
      </template>
    </VirtList>
  </div>
</template>
```

### 顶部追加（分页/无限滚动）

```ts
// 数据长度变化后（shallowRef）必须 forceUpdate
function prepend(items: any[]) {
  list.value = items.concat(list.value);
  nextTick(() => listRef.value?.addedList2Top(items));
}
function append(items: any[]) {
  list.value = list.value.concat(items);
  nextTick(() => listRef.value?.forceUpdate());
}
```

### 水平滚动

```vue
<VirtList :list="list" itemKey="id" :minSize="120" :horizontal="true" listStyle="display:flex;">
  <template #default="{ itemData }"><div class="col">{{ itemData.text }}</div></template>
</VirtList>
```

### 悬浮表头

```vue
<VirtList :list="list" itemKey="id" :minSize="40">
  <template #sticky-header>
    <div class="th">固定表头</div>
  </template>
  <template #default="{ itemData }"><div class="td">{{ itemData.text }}</div></template>
</VirtList>
```

## VirtTree

### 基础树（懒加载）

```vue
<template>
  <div style="height: 500px">
    <VirtTree
      ref="treeRef"
      :list="list"
      :fieldNames="{ key: 'id' }"
      :minSize="32"
      expandOnClickNode
      @expand="onExpand"
    >
      <template #default="{ node }"><span>{{ node.title }}</span></template>
    </VirtTree>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { VirtTree } from 'longmo-vue-virt-list';
import 'longmo-vue-virt-list/lib/assets/tree.css';

const treeRef = ref<typeof VirtTree | null>(null);
const list = shallowRef([
  { id: 1, title: 'Node-1', isLeaf: false },
  { id: 2, title: 'Node-2', isLeaf: true },
]);

// 展开时按需加载子节点
async function onExpand(keys: (string | number)[], { node }: any) {
  if (node.children?.length || node.isLeaf) return;
  const children = await fetchChildren(node.key);
  // 找到对应节点，追加 children
  updateNodeChildren(list.value, node.key, children);
}

function updateNodeChildren(nodes: any[], key: any, children: any[]) {
  for (const n of nodes) {
    if (n.id === key) { n.children = children; return; }
    if (n.children) updateNodeChildren(n.children, key, children);
  }
}
</script>
```

### 勾选（非受控）

```vue
<VirtTree ref="treeRef" :list="list" checkable @check="onCheck">
  <template #default="{ node }"><span>{{ node.title }}</span></template>
</VirtTree>

<script setup lang="ts">
function onCheck(checkedKeys: (string|number)[], { checkedNodes }: any) {
  console.log('checked', checkedKeys, checkedNodes);
}
// 全选
treeRef.value?.checkAll(true);
</script>
```

### 勾选（Vue3 受控）

```vue
<VirtTree :list="list" checkable v-model:checkedKeys="checkedKeys">
  <template #default="{ node }"><span>{{ node.title }}</span></template>
</VirtTree>

<script setup lang="ts">
import { ref } from 'vue';
const checkedKeys = ref<(string|number)[]>([]);
// 必须用新数组
function addCheck(k: string|number) {
  checkedKeys.value = [...checkedKeys.value, k];
}
</script>
```

### 搜索 / 筛选

```vue
<VirtTree
  :list="list"
  :filterMethod="(node) => node.title.includes(keyword)"
>
  <template #default="{ node }"><span>{{ node.title }}</span></template>
</VirtTree>

<script setup lang="ts">
import { ref } from 'vue';
const keyword = ref('');
</script>
```

### 拖拽

```vue
<VirtTree :list="list" draggable @drop="onDrop">
  <template #default="{ node }"><span>{{ node.title }}</span></template>
</VirtTree>

<script setup lang="ts">
function onDrop({ dragNode, dropNode, dropPosition }: any) {
  // 自行修改 list 数据，移动节点
  moveNode(list.value, dragNode.key, dropNode.key, dropPosition);
}
</script>
```

### 滚动到指定节点

```ts
treeRef.value?.scrollTo({ key: 123, align: 'top' });
```

## VirtGrid

### 响应式列数

```vue
<template>
  <div style="height: 500px">
    <VirtGrid :list="list" :minSize="80" :gridItems="gridItems">
      <template #default="{ itemData, index }">
        <div class="card">#{{ index }} {{ itemData.name }}</div>
      </template>
    </VirtGrid>
    <button @click="gridItems = 4">4列</button>
    <button @click="gridItems = 6">6列</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VirtGrid } from 'longmo-vue-virt-list';

const gridItems = ref(4);
const list = ref(
  Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `item-${i}` })),
);
</script>
```

### 删除 item（shallowRef）

```ts
function remove(id: number) {
  const i = list.value.findIndex((x) => x.id === id);
  if (i > -1) {
    list.value.splice(i, 1);
    gridRef.value?.forceUpdate(); // shallowRef 必须调用
  }
}
```
