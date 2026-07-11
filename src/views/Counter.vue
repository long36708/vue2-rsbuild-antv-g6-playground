<template>
  <div class="counter-page">
    <h1>计数器页面 (keep-alive测试)</h1>
    <p>当前计数: {{ count }}</p>
    <div class="buttons">
      <el-button type="primary" @click="increment">增加</el-button>
      <el-button @click="decrement">减少</el-button>
      <el-button type="warning" @click="reset">重置</el-button>
    </div>
    
    <div class="navigation-demo">
      <h3>导航测试</h3>
      <el-button @click="goToNoKeepAlive">跳转到无缓存页面</el-button>
      <el-button type="info" @click="goToAboutWithCounter">带计数跳转到关于</el-button>
      <el-button type="success" @click="goHomeAndReset">返回首页并重置</el-button>
    </div>
    
    <p class="tip">
      <small>切换到其他页面再回来，计数器状态会被保留（keep-alive效果）</small>
    </p>
  </div>
</template>

<script>
export default {
  name: 'CounterPage',
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = 0
    },
    goToNoKeepAlive() {
      this.$router.push('/no-keep-alive')
    },
    goToAboutWithCounter() {
      this.$router.push({
        path: '/about',
        query: { counter: this.count }
      })
    },
    goHomeAndReset() {
      this.count = 0
      this.$router.push('/')
    }
  },
  activated() {
    console.log('Counter组件被激活')
  },
  deactivated() {
    console.log('Counter组件被停用')
  }
}
</script>

<style scoped>
.counter-page {
  padding: 20px;
}

.buttons {
  margin: 20px 0;
}

.buttons .el-button {
  margin: 0 5px;
}

.tip {
  color: #909399;
  margin-top: 20px;
}
</style>