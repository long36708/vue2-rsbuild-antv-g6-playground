<template>
  <div class="tree-demo">
    <!-- 工具栏：搜索 / 全选 / 展开全部 -->
    <div class="toolbar">
      <input v-model="keyword" placeholder="搜索节点..." />
      <button @click="treeRef?.checkAll(true)">全选</button>
      <button @click="treeRef?.checkAll(false)">清空</button>
      <button @click="treeRef?.expandAll(true)">展开全部</button>
      <button @click="treeRef?.expandAll(false)">折叠全部</button>
      <span class="stat">已选：{{ checkedKeys.length }}</span>
    </div>

    <!-- 必须给容器固定高度；树组件必须引入 tree.css -->
    <div class="tree-wrap" style="height: 500px">
      <VirtTree
        ref="treeRef"
        :list="list"
        :fieldNames="{ key: 'id', title: 'title', children: 'children' }"
        :minSize="32"
        checkable
        expandOnClickNode
        :filterMethod="filterNode"
        v-model:checkedKeys="checkedKeys"
        v-model:expandedKeys="expandedKeys"
        @expand="onExpand"
        @check="onCheck"
      >
        <template #default="{ node }">
          <span class="node-title">{{ node.title }}</span>
        </template>
        <template #empty>
          <div class="empty">暂无数据</div>
        </template>
      </VirtTree>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import { VirtTree } from 'longmo-vue-virt-list';
import 'longmo-vue-virt-list/lib/assets/tree.css';

type TreeNode = {
  id: number | string;
  title: string;
  isLeaf?: boolean;
  children?: TreeNode[];
};

const treeRef = ref<typeof VirtTree | null>(null);
const list = shallowRef<TreeNode[]>([]);
const keyword = ref('');
const checkedKeys = ref<(string | number)[]>([]);
const expandedKeys = ref<(string | number)[]>([]);

let seq = 0;
// 模拟初始两层数据
list.value = Array.from({ length: 20 }, (_, i) => ({
  id: `n-${i}`,
  title: `Node-${i}`,
  isLeaf: false,
}));

// 模拟异步加载子节点
function fetchChildren(parentKey: string | number): Promise<TreeNode[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const children = Array.from({ length: 5 }, (_, j) => {
        const id = `${parentKey}-${j}`;
        seq++;
        return {
          id,
          title: `Child-${parentKey}-${j}`,
          // 随机标记部分叶子，演示懒加载终止
          isLeaf: j % 2 === 0,
        };
      });
      resolve(children);
    }, 300);
  });
}

async function onExpand(_keys: (string | number)[], { node }: any) {
  if (node.isLeaf || (node.children && node.children.length)) return;
  const children = await fetchChildren(node.key);
  appendChildren(list.value, node.key, children);
}

function appendChildren(nodes: TreeNode[], key: string | number, children: TreeNode[]) {
  for (const n of nodes) {
    if (n.id === key) {
      n.children = children;
      return;
    }
    if (n.children) appendChildren(n.children, key, children);
  }
}

function filterNode(node: any) {
  if (!keyword.value) return true;
  return node.title.includes(keyword.value);
}

function onCheck(keys: (string | number)[]) {
  console.log('checked', keys);
}
</script>

<style scoped>
.tree-demo {
  font-family: system-ui, sans-serif;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
}
.toolbar input {
  padding: 4px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.toolbar button {
  padding: 4px 10px;
  cursor: pointer;
}
.stat {
  margin-left: auto;
  color: #888;
  font-size: 13px;
}
.tree-wrap {
  border: 1px solid #eee;
  overflow: hidden;
}
.node-title {
  padding: 0 4px;
}
.empty {
  padding: 16px;
  text-align: center;
  color: #999;
}
</style>
