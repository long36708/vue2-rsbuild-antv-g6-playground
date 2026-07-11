<template>
  <div id="app">
    <div class="nav">
      <router-link to="/">首页</router-link> |
      <router-link to="/about">关于</router-link> |
      <router-link to="/counter">计数器(keep-alive)</router-link> |
      <router-link to="/no-keep-alive">无Keep-Alive</router-link> |
      <router-link to="/user-profile?id=1">用户资料(keep-alive)</router-link>
    </div>
    <keep-alive include="CounterPage,UserProfilePage">
      <router-view/>
    </keep-alive>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.nav {
  padding: 30px;
}

.nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

.nav a.router-link-exact-active {
  color: #42b983;
}
</style>
