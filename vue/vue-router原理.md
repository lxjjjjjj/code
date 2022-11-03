在 Web 前端单页应用 SPA(Single Page Application)中，路由描述的是 URL 与 UI 之间的映射关系，这种映射是单向的，即 URL 变化引起 UI 更新（无需刷新页面）。

# 要实现前端路由，需要解决两个核心

* 如何改变 URL 却不引起页面刷新？
* 如何检测 URL 变化了？

# 改变浏览器url的方式

* 通过浏览器前进后退改变 URL
* 通过<a>标签改变 URL
* 通过window.location改变URL

# hash实现
hash 是 URL 中 hash (#) 及后面的那部分，常用作锚点在页面内进行导航，改变 URL 中的 hash 部分不会引起页面刷新。通过 hashchange 事件监听 URL 的变化。
```
<!DOCTYPE html>
<html lang="en">
<body>
<ul>
    <ul>
        <!-- 定义路由 -->
        <li><a href="#/home">home</a></li>
        <li><a href="#/about">about</a></li>

        <!-- 渲染路由对应的 UI -->
        <div id="routeView"></div>
    </ul>
</ul>
</body>
<script>
    let routerView = routeView
    window.addEventListener('hashchange', ()=>{
        let hash = location.hash;
        routerView.innerHTML = hash
    })
    window.addEventListener('DOMContentLoaded', ()=>{
        if(!location.hash){//如果不存在hash值，那么重定向到#/
            location.hash="/"
        }else{//如果存在hash值，那就渲染对应UI
            let hash = location.hash;
            routerView.innerHTML = hash
        }
    })
</script>
</html>
```
# history 实现
history 提供了 pushState 和 replaceState 两个方法，这两个方法改变 URL 的 path 部分不会引起页面刷新
history 提供类似 hashchange 事件的 popstate 事件，但 popstate 事件有些不同：
通过浏览器前进后退改变 URL 时会触发 popstate 事件
通过pushState/replaceState或<a>标签改变 URL 不会触发 popstate 事件。
好在我们可以拦截 pushState/replaceState的调用和<a>标签的点击事件来检测 URL 变化
通过js 调用history的back，go，forward方法课触发该事件
所以监听 URL 变化可以实现，只是没有 hashchange 那么方便。

```
<!DOCTYPE html>
<html lang="en">
<body>
<ul>
    <ul>
        <li><a href='/home'>home</a></li>
        <li><a href='/about'>about</a></li>

        <div id="routeView"></div>
    </ul>
</ul>
</body>
<script>
    let routerView = routeView
    window.addEventListener('DOMContentLoaded', onLoad)
    window.addEventListener('popstate', ()=>{
        routerView.innerHTML = location.pathname
    })
    function onLoad () {
        routerView.innerHTML = location.pathname
        var linkList = document.querySelectorAll('a[href]')
        linkList.forEach(el => el.addEventListener('click', function (e) {
            e.preventDefault()
            history.pushState(null, '', el.getAttribute('href'))
            routerView.innerHTML = location.pathname
        }))
    }

</script>
</html>
```

## 拦截pushState和replaceState事件

```
var _wr = function(type) {
  var orig = history[type];
  return function() {
    var e = new Event(type);
    e.arguments = arguments;
    window.dispatchEvent(e);
    // 注意事件监听在url变更方法调用之前 也就是在事件监听的回调函数中获取的页面链接为跳转前的链接
    var rv = orig.apply(this, arguments);
    return rv;
  };
};
history.pushState = _wr('pushState');
history.replaceState = _wr('replaceState');
window.addEventListener('pushState', function(e) {
  var path = e && e.arguments.length > 2 && e.arguments[2];
  var url = /^http/.test(path) ? path : (location.protocol + '//' + location.host + path);
  console.log('old:'+location.href,'new:'+url);
});
window.addEventListener('replaceState', function(e) {
  var path = e && e.arguments.length > 2 && e.arguments[2];
  var url = /^http/.test(path) ? path : (location.protocol + '//' + location.host + path);
  console.log('old:'+location.href,'new:'+url);
});
```
## 创建自定义事件
```
Events 可以使用 Event 构造函数创建如下：

var event = new Event('build');

// Listen for the event.
elem.addEventListener('build', function (e) { ... }, false);

// Dispatch the event.
elem.dispatchEvent(event);
```
# 选择hash还是history

## hash
* 有 # 号
* 能够兼容到IE8
* 实际的url之前使用哈希字符，这部分url不会发送到服务器，不需要在服务器层面上进行任何处理
* 刷新不会存在 404 问题
* 不需要服务器任何配置
## history
* 没有 # 号
* 只能兼容到IE10
* 每访问一个页面都需要服务器进行路由匹配生成 html 文件再发送响应给浏览器，消耗服务器大量资源
* 浏览器直接访问嵌套路由时，会报 404 问题。
* 需要在服务器配置一个回调路由

## 为什么推荐使用 hash 模式

### 优点
* 兼容角度分析。hash 可以兼容到 IE8，而 history 只能兼容到 IE10。
* 从网络请求的角度分析。使用 hash 模式，地址改变时通过 hashchange 事件，只会读取哈希符号后的内容，并不会发起任何网络请求。
* 服务器配置角度分析。hash 不需要服务器任何配置。

### 不足

1、hash 模式中的 # 也称作锚点，这里的的 # 和 css 中的 # 是一个意思，所以在 hash 模式内，页面定位会失效。
2、hash 不利于 SEO（搜索引擎优化）。
3、白屏时间问题。浏览器需要等待 JavaScript 文件加载完成之后渲染 HTML 文档内容，用户等待时间稍长。
4、hash 的传参是基于 url 的，如果要传递复杂的数据，会有体积的限制

## history
### 优点
history 模式不仅可以在url里放参数，还可以将数据存放在一个特定的对象中。
如果不想要很丑的 hash，我们可以用路由的 history 模式 —— 引用自 vueRouter文档
### 缺点
1、需要服务端知道路由
2、实现路由监听麻烦


hash模式是不需要后端服务配合的。但是history模式下，如果你再跳转路由后再次刷新会得到404的错误，这个错误说白了就是浏览器会把整个地址当成一个可访问的静态资源路径进行访问，然后服务端并没有这个文件～看下面例子更好理解
没刷新时，只是通过pushState改变URL，不刷新页面
http://192.168.30.161:5500/ === http://192.168.30.161:5500/index.html // 默认访问路径下的index.html文件，没毛病
http://192.168.30.161:5500/home === http://192.168.30.161:5500/index.html // 仍然访问路径下的index.html文件，没毛病
...
http://192.168.30.161:5500/mine === http://192.168.30.161:5500/index.html // 所有的路由都是访问路径下的index.html，没毛病
复制代码
一旦在某个路由下刷新页面的时候，想当于去该路径下寻找可访问的静态资源index.html，无果，报错
http://192.168.30.161:5500/mine === http://192.168.30.161:5500/mine/index.html文件，出问题了，服务器上并没有这个资源，404😭
复制代码
所以一般情况下，我们都需要配置下nginx，告诉服务器，当我们访问的路径资源不存在的时候，默认指向静态资源index.html
```
location / {
  try_files $uri $uri/ /index.html;
}
```

# vue-router的实现
[原文链接](https://juejin.cn/post/6844903946343940104#heading-8)
## Vue项目中是怎么引入VueRouter

```
new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
```
* 安装VueRouter，再通过import VueRouter from 'vue-router'引入
* 先 const router = new VueRouter({...}),再把router作为参数的一个属性值，new Vue({router})
* 通过Vue.use(VueRouter) 使得每个组件都可以拥有router实例
* 可以new说明vue-router是个类，vueRouter类将router数组变成对象并且实现路由变化监听功能
使用了vue.use 说明这个类有静态install方法，为什么要有vue.use执行install方法，因为vue.use会给install方法传参数，第一个参数是vue,有了vue，我们可以做到不引入router-link 和 router-view就能使用这两个组件，是因为在vue.use的时候注册了,使用vue.use方法因为参数是vue，所以这样注册是为了给每个vue实例添加$route 和 $router 可以在实例上通过this.$route和this.$router访问,因为只有根组件才有router对象，所以vue-router利用全局Vue.mixin在beforeCreate的时候就初始化好router对象，子组件将层层寻找根节点的router对象挂载到自己本身
* router-view组件的实现是，render函数里的this指向的是一个Proxy代理对象，代理Vue组件，而我们前面讲到每个组件都有一个_root属性指向根组件，根组件上有_router这个路由实例。 所以我们可以从router实例上获得路由表，也可以获得当前路径。 然后再把获得的组件放到h()里进行渲染。
* 我们利用了Vue提供的API：defineReactive，使得this._router.history对象得到监听。 因此当我们第一次渲染router-view这个组件的时候，会获取到this._router.history这个对象，从而就会被监听到获取this._router.history。就会把router-view组件的依赖wacther收集到this._router.history对应的收集器dep中，因此this._router.history每次改变的时候。this._router.history对应的收集器dep就会通知router-view的组件依赖的wacther执行update()，从而使得router-view重新渲染（其实这就是vue响应式的内部原理）

```
import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  _Vue = Vue

  const isDef = v => v !== undefined

  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
  Vue.mixin({
    beforeCreate () {
      // 如果该组件是根组件
      if (isDef(this.$options.router)) {
	      //  设置根组件叫_routerRoot
        this._routerRoot = this
        // 根组件的_router属性为，new Vue传进去的router
        // $options是在mains.js中，new Vue里的参数，在这里我们传入的参数，
        this._router = this.$options.router
        this._router.init(this)
        // 通过defineReactive方法，来把this._router.history.current变成响应式的，这个方法的底层就是object.defineProperty
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 如果该组件不是根组件，那么递归往上找，知道找到根组件的。
        // 因为Vue渲染组件是先渲染根组件，然后渲染根组件的子组件啊，然后再渲染孙子组件。
        // 结果就是每一个组件都有this._routerRoot属性，该属性指向了根组件。
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })
// 把自身$router代理为this._routerRoot（根组件的）的_router
// 根组件的_router,就是new Vue传入的 router
// 这样就实现了，每一个Vue组件都有$router、$route属性
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })
// 同理，这样就是把自身的$route，代理到根组件传入的route
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })
	// 注册 <router-view>组件
  Vue.component('RouterView', View)
	// 注册<router-link>组件
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}

```
### 总结
1.通过minxi混入的方式，如果自身是根组件，就把根组件的_router属性映射为new Vue传入的router实例(this.$options.router)。
2.如果自身不是根组件，那么层层往上找，直到找到根组件，并用_routerRoot标记出根组件
3.为每一个组件代理$router、$route属性，这样每一个组件都可以去到$router、$route
4.注册<router-link>、<router-view>组件