<template>
  <div class="grid-demo">
    <!-- 列数切换 -->
    <div class="toolbar">
      <span>列数：</span>
      <button
        v-for="n in [2, 3, 4, 6]"
        :key="n"
        :class="{ active: gridItems === n }"
        @click="gridItems = n"
      >
        {{ n }}
      </button>
      <span class="stat">总数：{{ list.length }}</span>
    </div>

    <!-- 必须给容器固定高度 -->
    <div class="grid-wrap" style="height: 500px">
      <VirtGrid
        ref="gridRef"
        :list="list"
        :minSize="90"
        :gridItems="gridItems"
        @toTop="onToTop"
      >
        <template #default="{ itemData, index }">
          <div class="card">
            <div class="avatar">{{ itemData.name.charAt(0) }}</div>
            <div class="meta">
              <div class="name">#{{ index }} {{ itemData.name }}</div>
              <div class="desc">{{ itemData.desc }}</div>
            </div>
            <button class="del" @click="removeItem(itemData.id)">×</button>
          </div>
        </template>
        <template #empty>
          <div class="empty">暂无数据</div>
        </template>
      </VirtGrid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VirtGrid } from 'longmo-vue-virt-list';

type Item = { id: number; name: string; desc: string };

const gridRef = ref<typeof VirtGrid | null>(null);
const gridItems = ref(4);
const list = ref<Item[]>(
  Array.from({ length: 5000 }, (_, i) => ({
    id: i,
    name: `item-${i}`,
    desc: `描述信息 ${i}`,
  })),
);

function removeItem(id: number) {
  const i = list.value.findIndex((x) => x.id === id);
  if (i > -1) {
    list.value.splice(i, 1);
    // 若 list 为 shallowRef，需调用 forceUpdate()
    gridRef.value?.forceUpdate();
  }
}

function onToTop() {
  console.log('grid 触顶');
}
</script>

<style scoped>
.grid-demo {
  font-family: system-ui, sans-serif;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
}
.toolbar button {
  padding: 4px 12px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
}
.toolbar button.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}
.stat {
  margin-left: auto;
  color: #888;
  font-size: 13px;
}
.grid-wrap {
  border: 1px solid #eee;
  overflow-x: auto;
}
.card {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 80px;
  margin: 4px;
  padding: 0 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.meta {
  flex: 1;
}
.name {
  font-weight: 500;
}
.desc {
  color: #999;
  font-size: 12px;
}
.del {
  color: #f56c6c;
  font-size: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
}
.empty {
  padding: 16px;
  text-align: center;
  color: #999;
}
</style>
