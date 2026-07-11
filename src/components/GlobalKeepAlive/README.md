# GlobalKeepAlive 组件使用文档

## 概述

GlobalKeepAlive 是一个自定义的 Vue 2.x keep-alive 组件，它提供了比原生 keep-alive 更强大的缓存管理能力，支持全局缓存访问、精确缓存控制和灵活的过滤机制。

## 特性

- ✅ 全局缓存管理，支持跨组件共享
- ✅ 精确的缓存控制（增删查改）
- ✅ 灵活的过滤机制（函数、正则表达式）
- ✅ 自定义缓存键策略
- ✅ 缓存容量控制
- ✅ 完全兼容 Vue 的 activated/deactivated 生命周期钩子

## 基本用法

### 导入组件

```javascript
import GlobalKeepAlive from './components/GlobalKeepAlive';

// 或者创建命名实例
import { createGlobalKeepAlive } from './components/GlobalKeepAlive';
const MyKeepAlive = createGlobalKeepAlive('MyCache');
```

### 简单使用

```vue
<template>
  <div>
    <GlobalKeepAlive>
      <router-view />
    </GlobalKeepAlive>
  </div>
</template>

<script>
import GlobalKeepAlive from '@/components/GlobalKeepAlive';

export default {
  components: {
    GlobalKeepAlive
  }
}
</script>
```

## API 参考

### Props

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| cacheKey | String | undefined | 手动指定缓存键值 |
| cacheFilter | Function/RegExp | undefined | 缓存过滤器，决定哪些组件应该被缓存 |

### 实例方法

通过 `ref` 可以访问组件实例，并调用缓存方法：

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| keys() | 无 | Iterator<string> | 获取所有缓存键 |
| put(key, vnode) | key: string, vnode: VNode | 无 | 添加或更新缓存项 |
| remove(key) | key: string | 无 | 删除指定缓存项 |
| clear(keep) | keep: number (可选) | 无 | 清除缓存，可保留指定数量 |

### 全局缓存访问

通过 `_globalCache` 属性可以直接访问缓存实例：

```javascript
this.$refs.keepAlive._globalCache.keys();
this.$refs.keepAlive._globalCache.remove('ComponentName#123');
```

## 高级用法

### 1. 缓存过滤

#### 使用函数过滤器

```vue
<template>
  <GlobalKeepAlive :cacheFilter="shouldCache">
    <router-view />
  </GlobalKeepAlive>
</template>

<script>
export default {
  methods: {
    shouldCache(name, options) {
      // 只缓存名称以 'User' 开头的组件
      if (name && name.startsWith('User')) {
        return true;
      }
      
      // 根据组件选项进行复杂判断
      if (options && options.keepAlive === true) {
        return true;
      }
      
      return false;
    }
  }
}
</script>
```

#### 使用正则表达式过滤器

```vue
<template>
  <!-- 缓存所有名称以 'Page' 结尾的组件 -->
  <GlobalKeepAlive :cacheFilter="/Page$/">
    <router-view />
  </GlobalKeepAlive>
</template>
```

#### 实现类似原生 keep-alive 的 include/exclude

```vue
<template>
  <GlobalKeepAlive :cacheFilter="filterComponents">
    <router-view />
  </GlobalKeepAlive>
</template>

<script>
export default {
  data() {
    return {
      includeList: ['HomePage', 'UserPage', 'SettingsPage'],
      excludeList: ['AdminPage']
    }
  },
  methods: {
    filterComponents(name) {
      // 先检查排除列表
      if (this.excludeList.includes(name)) {
        return false;
      }
      
      // 再检查包含列表
      return this.includeList.includes(name);
    }
  }
}
</script>
```

### 2. 自定义缓存键

```vue
<template>
  <!-- 使用动态缓存键，可用于版本控制或用户隔离 -->
  <GlobalKeepAlive :cacheKey="dynamicCacheKey">
    <router-view />
  </GlobalKeepAlive>
</template>

<script>
export default {
  computed: {
    dynamicCacheKey() {
      // 可以基于用户ID、版本号等生成缓存键
      return `user_${this.$store.state.user.id}_v1.0`;
    }
  }
}
</script>
```

### 3. 手动缓存管理

```vue
<template>
  <div>
    <GlobalKeepAlive ref="keepAlive">
      <router-view />
    </GlobalKeepAlive>
    
    <div class="cache-controls">
      <button @click="clearAllCache">清除所有缓存</button>
      <button @click="clearOldCache">保留最近5个缓存</button>
      <button @click="removeCache('UserProfilePage')">移除特定缓存</button>
      <button @click="listCache">列出所有缓存</button>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    clearAllCache() {
      this.$refs.keepAlive._globalCache.clear();
    },
    
    clearOldCache() {
      this.$refs.keepAlive._globalCache.clear(5); // 保留最近5个
    },
    
    removeCache(componentName) {
      // 默认缓存键格式是 `${componentName}#${cid}`
      // 这里我们假设只有一个匹配
      const cacheKeys = Array.from(this.$refs.keepAlive._globalCache.keys());
      const matchedKeys = cacheKeys.filter(key => key.startsWith(componentName));
      
      matchedKeys.forEach(key => {
        this.$refs.keepAlive._globalCache.remove(key);
      });
    },
    
    listCache() {
      const keys = Array.from(this.$refs.keepAlive._globalCache.keys());
      console.log('当前缓存组件:', keys);
      alert(`当前缓存组件: ${keys.join(', ')}`);
    }
  }
}
</script>
```

### 4. 跨组件共享缓存

```javascript
// 创建全局缓存实例
import { createGlobalKeepAlive } from './components/GlobalKeepAlive';

export const sharedCache = createGlobalKeepAlive('Shared');

// 在多个组件中使用相同的缓存实例
// ComponentA.vue
import { sharedCache } from './cache-instance';
export default {
  components: {
    SharedKeepAlive: sharedCache
  }
}

// ComponentB.vue
import { sharedCache } from './cache-instance';
export default {
  components: {
    SharedKeepAlive: sharedCache
  },
  methods: {
    clearSharedCache() {
      // 在B组件中清除A组件缓存的项
      this.$refs.sharedKeepAlive._globalCache.clear();
    }
  }
}
```

### 5. 与路由结合使用

```vue
<template>
  <GlobalKeepAlive 
    ref="keepAlive"
    :cacheFilter="routeBasedFilter">
    <router-view />
  </GlobalKeepAlive>
</template>

<script>
export default {
  methods: {
    routeBasedFilter(name) {
      // 根据当前路由决定是否缓存
      if (this.$route.meta.keepAlive === false) {
        return false;
      }
      
      // 根据路由参数决定缓存策略
      if (this.$route.query.nocache) {
        return false;
      }
      
      return true;
    }
  },
  watch: {
    '$route'(to, from) {
      // 特定路由变化时清除缓存
      if (from.path === '/login' && to.path === '/dashboard') {
        this.$refs.keepAlive._globalCache.clear();
      }
    }
  }
}
</script>
```

## 实际应用示例

### 标签页缓存控制

```vue
<template>
  <div>
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane 
        v-for="tab in tabs" 
        :key="tab.name"
        :label="tab.label" 
        :name="tab.name">
      </el-tab-pane>
    </el-tabs>
    
    <GlobalKeepAlive 
      ref="keepAlive"
      :cacheFilter="(name) => name.startsWith(currentTabComponent)">
      <component :is="currentTabComponent" />
    </GlobalKeepAlive>
  </div>
</template>

<script>
export default {
  data() {
    return {
      activeTab: 'home',
      tabs: [
        { name: 'home', label: '首页', component: 'HomeComponent' },
        { name: 'user', label: '用户', component: 'UserComponent' },
        { name: 'settings', label: '设置', component: 'SettingsComponent' }
      ]
    }
  },
  computed: {
    currentTabComponent() {
      const tab = this.tabs.find(t => t.name === this.activeTab);
      return tab ? tab.component : null;
    }
  },
  methods: {
    handleTabClick(tab) {
      this.activeTab = tab.name;
    },
    
    // 关闭标签时清除对应缓存
    closeTab(tabName) {
      const tab = this.tabs.find(t => t.name === tabName);
      if (tab) {
        // 清除该标签对应的组件缓存
        this.$refs.keepAlive._globalCache.remove(tab.component);
      }
    }
  }
}
</script>
```

## 最佳实践

1. **合理使用缓存键**：对于复杂应用，考虑使用有意义的缓存键，便于管理和调试
2. **避免内存泄漏**：及时清理不需要的缓存，特别是在单页应用中
3. **缓存容量控制**：定期调用 `clear()` 方法限制缓存大小
4. **结合路由元信息**：使用 `meta.keepAlive` 控制页面级缓存
5. **开发环境调试**：在开发阶段可以添加日志，监控缓存行为

## 注意事项

1. 缓存键默认格式为 `${组件名}#${组件构造器ID}`，这确保了即使同名组件也能正确区分
2. 组件必须定义 `name` 选项才能被正确缓存
3. 缓存的组件会保持在内存中，过多缓存可能导致内存问题
4. 在组件 `destroyed` 钩子中，不需要手动清理缓存，组件销毁时会自动处理
5. 与 Vue 原生 keep-alive 不同，此组件不自动实现 LRU 算法，需要手动管理缓存容量

## 兼容性

- Vue 2.x
- 支持所有现代浏览器
- 可与 Vue Router 无缝集成

## 常见问题

### Q: 如何实现类似原生 keep-alive 的 max 属性？

A: 可以手动调用 `clear()` 方法：
```javascript
// 在组件渲染后或路由变化后调用
this.$nextTick(() => {
  this.$refs.keepAlive._globalCache.clear(10); // 保留10个
});
```

### Q: 为什么组件没有被缓存？

A: 请检查：
1. 组件是否定义了 `name` 属性
2. `cacheFilter` 函数是否返回 `true`
3. 是否正确使用了 `cacheKey`（如果设置了）

### Q: 如何在缓存更新时触发特定操作？

A: 可以通过重写 `put` 方法实现：
```javascript
// 创建自定义缓存实例
const cache = new KeepAliveCache();
const originalPut = cache.put.bind(cache);
cache.put = function(key, vnode) {
  const isNew = !this.cache.has(key);
  originalPut(key, vnode);
  
  if (isNew) {
    console.log(`新组件被缓存: ${key}`);
  } else {
    console.log(`组件缓存被更新: ${key}`);
  }
};
```