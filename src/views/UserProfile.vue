<template>
  <div class="user-profile-page">
    <h1>用户资料页面</h1>
    
    <div class="user-info">
      <h3>当前用户信息</h3>
      <p><strong>用户ID:</strong> {{ userId }}</p>
      <p><strong>用户名:</strong> {{ username }}</p>
      <p><strong>访问次数:</strong> {{ visitCount }}</p>
      <p><strong>页面创建时间:</strong> {{ createdTime }}</p>
    </div>
    
    <div class="state-info">
      <h3>组件状态</h3>
      <p><strong>当前query参数:</strong> {{ JSON.stringify($route.query) }}</p>
      <p><strong>组件是否被缓存:</strong> {{ isCached ? '是' : '否' }}</p>
    </div>
    
    <div class="actions">
      <el-button @click="incrementVisit">增加访问次数</el-button>
      <el-button type="primary" @click="goToUser(1)">查看用户1</el-button>
      <el-button type="primary" @click="goToUser(2)">查看用户2</el-button>
      <el-button @click="goHome">返回首页</el-button>
    </div>
    
    <div class="lifecycle-log">
      <h3>生命周期日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfilePage',
  data() {
    return {
      visitCount: 0,
      createdTime: new Date().toLocaleTimeString(),
      logs: [],
      isCached: false
    }
  },
  computed: {
    userId() {
      return this.$route.query.id || '未知'
    },
    username() {
      const users = {
        '1': '张三',
        '2': '李四'
      }
      return users[this.userId] || '未知用户'
    }
  },
  methods: {
    incrementVisit() {
      this.visitCount++
      this.addLog(`访问次数增加到: ${this.visitCount}`)
    },
    goToUser(userId) {
      this.$router.push({
        path: '/user-profile',
        query: { 
          id: userId,
          from: 'profile',
          timestamp: Date.now()
        }
      })
    },
    goHome() {
      this.$router.push('/')
    },
    addLog(message) {
      const time = new Date().toLocaleTimeString()
      this.logs.unshift(`[${time}] ${message}`)
      if (this.logs.length > 10) {
        this.logs.pop()
      }
    }
  },
  created() {
    this.addLog('组件 created')
    this.addLog(`用户ID: ${this.userId}`)
  },
  mounted() {
    this.addLog('组件 mounted')
  },
  activated() {
    this.isCached = true
    this.addLog('组件 activated (从缓存中激活)')
    this.addLog(`当前用户ID: ${this.userId}`)
  },
  deactivated() {
    this.addLog('组件 deactivated (进入缓存)')
  },
  // 监听路由变化
  watch: {
    '$route.query.id'(newId, oldId) {
      if (newId !== oldId) {
        this.addLog(`路由参数变化: ${oldId} -> ${newId}`)
        // 这里可以根据新参数更新数据
      }
    },
    '$route'(to, from) {
      if (to.path === from.path && to.query.id !== from.query.id) {
        this.addLog('同路由不同参数跳转')
      }
    }
  }
}
</script>

<style scoped>
.user-profile-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.user-info, .state-info, .lifecycle-log {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.user-info h3, .state-info h3, .lifecycle-log h3 {
  margin-top: 0;
  color: #409eff;
}

.user-info p, .state-info p {
  margin: 8px 0;
}

.actions {
  margin: 20px 0;
}

.el-button {
  margin: 5px;
}

.lifecycle-log {
  max-height: 300px;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  background-color: #fff;
}

.log-item {
  padding: 2px 0;
  font-family: monospace;
  font-size: 12px;
  border-bottom: 1px solid #eee;
}

.log-item:last-child {
  border-bottom: none;
}
</style>