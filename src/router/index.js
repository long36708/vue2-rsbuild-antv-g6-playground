import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/counter',
    name: 'Counter',
    component: () => import('../views/Counter.vue')
  },
  {
    path: '/no-keep-alive',
    name: 'NoKeepAlive',
    component: () => import('../views/NoKeepAlive.vue')
  },
  {
    path: '/user-profile',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue')
  }
];

const router = new VueRouter({
  mode: 'history',
  routes
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log(`导航守卫: 从 ${from.path} 到 ${to.path}`)
  
  // 示例：可以在这里添加权限验证
  if (to.path === '/no-keep-alive') {
    console.log('进入无缓存页面')
  }
  
  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  console.log(`导航完成: 当前在 ${to.path}`)
})

export default router;