<template>
  <div class="basic-demo">
    <!-- 操作区 -->
    <div class="toolbar">
      <button @click="addItems">追加 1000 条</button>
      <button @click="scrollToTop">回到顶部</button>
      <button @click="scrollToBottom">去底部</button>
      <button @click="scrollToIndex(500)">到第 500 条</button>
      <span class="stat">总数：{{ list.length }}</span>
      <span class="stat">渲染：{{ reactiveData?.renderBegin }} ~ {{ reactiveData?.renderEnd }}</span>
    </div>

    <!-- 必须给容器固定高度 -->
    <div class="list-wrap" style="height: 500px">
      <VirtList
        ref="listRef"
        :list="list"
        itemKey="id"
        :minSize="40"
        :buffer="5"
        @toTop="onToTop"
        @toBottom="onToBottom"
        @rangeUpdate="onRangeUpdate"
      >
        <template #default="{ itemData, index }">
          <div class="row">
            <span class="idx">#{{ index }}</span>
            <span class="text">{{ itemData.text }}</span>
            <button class="del" @click="removeItem(itemData.id)">删除</button>
          </div>
        </template>
        <template #empty>
          <div class="empty">暂无数据</div>
        </template>
      </VirtList>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, nextTick, computed } from 'vue';
import { VirtList } from 'longmo-vue-virt-list';

const listRef = ref<typeof VirtList | null>(null);
// 大数据用 shallowRef 避免深层响应式开销
const list = shallowRef<{ id: number; text: string }[]>([]);

let seq = 0;
function makeItems(n: number) {
  const arr: { id: number; text: string }[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({ id: seq, text: `item-${seq}` });
    seq++;
  }
  return arr;
}

// 初始数据
list.value = makeItems(10000);

const reactiveData = computed(() => listRef.value?.reactiveData);

function addItems() {
  list.value = list.value.concat(makeItems(1000));
  nextTick(() => listRef.value?.forceUpdate());
}

function removeItem(id: number) {
  const i = list.value.findIndex((x) => x.id === id);
  if (i > -1) {
    list.value.splice(i, 1);
    nextTick(() => listRef.value?.forceUpdate()); // shallowRef 必须调用
  }
}

function scrollToTop() {
  listRef.value?.scrollToTop();
}
function scrollToBottom() {
  listRef.value?.scrollToBottom();
}
function scrollToIndex(i: number) {
  listRef.value?.scrollToIndex(i);
}
function onToTop() {
  console.log('触顶');
}
function onToBottom() {
  console.log('触底');
}
function onRangeUpdate(begin: number, end: number) {
  console.log('可视区', begin, end);
}
</script>

<style scoped>
.basic-demo {
  font-family: system-ui, sans-serif;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
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
.list-wrap {
  border: 1px solid #eee;
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid #f0f0f0;
}
.idx {
  color: #999;
  width: 48px;
}
.text {
  flex: 1;
}
.del {
  color: #f56c6c;
}
.empty {
  padding: 16px;
  text-align: center;
  color: #999;
}
</style>
