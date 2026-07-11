<template>
  <div class="no-keep-alive-page">
    <h1>无Keep-Alive页面</h1>
    <p>当前计数: {{ count }}</p>
    <div class="buttons">
      <el-button type="danger" @click="increment">增加</el-button>
      <el-button @click="decrement">减少</el-button>
    </div>
    <p class="tip">
      <small>这个页面不会被keep-alive缓存，切换页面再回来状态会重置</small>
    </p>
  </div>
</template>

<script>
export default {
  name: 'NoKeepAlivePage',
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
    }
  },
  created() {
    console.log('NoKeepAlive组件被创建')
  },
  mounted() {
    console.log('NoKeepAlive组件被挂载')
  },
  destroyed() {
    console.log('NoKeepAlive组件被销毁')
  }
}
</script>

<style scoped>
.no-keep-alive-page {
  padding: 20px;
}

.buttons {
  margin: 20px 0;
}

.buttons .el-button {
  margin: 0 5px;
}

.tip {
  color: #f56c6c;
  margin-top: 20px;
}
</style>