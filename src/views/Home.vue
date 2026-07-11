<script>
export default {
  name: 'HomePage',
  methods: {
    goBack() {
      this.$router.go(-1)
    },
  },
}
</script>

<template>
  <div class="home-page">
    <h1>首页</h1>
    <p>这是首页内容</p>

    <div class="navigation-demo">
      <h3>页面跳转演示</h3>
      <div class="jump-section">
        <h4>原型验证 - 多父节点标签树（DAG + 环检测）</h4>
        <el-button type="primary" @click="$router.push('/prototype/dag-tag-tree')">
          打开原型页面
        </el-button>
        <p class="tip-text">
          <small>使用 antv/g6 可视化多父节点标签树，验证添加边时的环检测逻辑</small>
        </p>
      </div>
      <div class="jump-section">
        <h4>性能测试 - 植物分类树（万级节点渲染压测）</h4>
        <el-button type="primary" @click="$router.push('/prototype/tree-performance')">
          打开性能测试页
        </el-button>
        <p class="tip-text">
          <small>以植物分类学为示例，测试 1w 树节点的数据生成与渲染性能</small>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  padding: 20px;
}

.navigation-demo {
  margin-top: 30px;
  text-align: left;
}

.jump-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.jump-section h4 {
  margin-bottom: 10px;
  color: #409eff;
}

.el-button {
  margin: 5px;
}
</style>
