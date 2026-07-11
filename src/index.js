import ElementUI from 'element-ui'
import contentmenu from 'v-contextmenu'
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'element-ui/lib/theme-chalk/index.css'
import 'v-contextmenu/dist/index.css'

Vue.use(ElementUI)
Vue.use(contentmenu)

new Vue({
  router,
  render: h => h(App),
}).$mount('#root')
