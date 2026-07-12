import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/prototype/dag-tag-tree',
    name: 'TagDagPrototype',
    component: () => import('../views/TagDagPrototype.vue'),
  },
  {
    path: '/prototype/tree-performance',
    name: 'TreePerformance',
    component: () => import('../views/TreePerformance.vue'),
  },
  {
    path: '/prototype/dag-tag-tree-1k',
    name: 'TagDagPrototype1k',
    component: () => import('../views/TagDagPrototype1k.vue'),
  },
  {
    path: '/prototype/node-selector',
    name: 'NodeSelectorPrototype',
    component: () => import('../views/NodeSelectorPrototype.vue'),
  },
]

const router = new VueRouter({
  mode: 'history',
  routes,
})

// 全局前置守卫
router.beforeEach((_to, _from, next) => {
  // 示例：可以在这里添加权限验证
  next()
})

export default router
