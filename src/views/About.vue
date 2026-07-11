<template>
  <div class="about-page">
    <h1>关于我们</h1>
    <p>这是关于页面内容</p>
    
    <div class="route-info">
      <h3>路由信息</h3>
      <p><strong>当前路径:</strong> {{ $route.path }}</p>
      <p><strong>查询参数:</strong> {{ JSON.stringify($route.query) }}</p>
      <p><strong>路由名称:</strong> {{ $route.name }}</p>
    </div>
    
    <div class="navigation-actions">
      <h3>导航操作</h3>
      <el-button @click="goHome">返回首页</el-button>
      <el-button type="primary" @click="goForward">前进</el-button>
      <el-button type="warning" @click="pushHistory">添加历史记录</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutPage',
  mounted() {
    console.log('About页面路由信息:', this.$route)
  },
  methods: {
    goHome() {
      this.$router.push('/')
    },
    goForward() {
      this.$router.go(1)
    },
    pushHistory() {
      this.$router.push({
        path: '/about',
        query: { 
          ...this.$route.query,
          timestamp: Date.now()
        }
      })
    }
  }
}
</script>

<style scoped>
.about-page {
  padding: 20px;
}

.route-info {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: left;
}

.route-info p {
  margin: 8px 0;
  font-family: monospace;
}

.navigation-actions {
  margin-top: 20px;
}

.el-button {
  margin: 5px;
}
</style>