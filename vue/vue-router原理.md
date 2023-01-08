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

一旦在某个路由下刷新页面的时候，想当于去该路径下寻找可访问的静态资源index.html，无果，报错
http://192.168.30.161:5500/mine === http://192.168.30.161:5500/mine/index.html文件，出问题了，服务器上并没有这个资源，404😭

所以一般情况下，我们都需要配置下nginx，告诉服务器，当我们访问的路径资源不存在的时候，默认指向静态资源index.html
```
location / {
  try_files $uri $uri/ /index.html;
}
```

# vue-router的介绍
Vue-Router 的能力十分强大，它支持 hash、history、abstract 3 种路由方式，提供了 <router-link> 和 <router-view> 2 种组件，还提供了简单的路由配置和一系列好用的 API。
# vue-router的使用
```
<div id="app">
  <h1>Hello App!</h1>
  <p>
    <!-- 使用 router-link 组件来导航. -->
    <!-- 通过传入 `to` 属性指定链接. -->
    <!-- <router-link> 默认会被渲染成一个 `<a>` 标签 -->
    <router-link to="/foo">Go to Foo</router-link>
    <router-link to="/bar">Go to Bar</router-link>
  </p>
  <!-- 路由出口 -->
  <!-- 路由匹配到的组件将渲染在这里 -->
  <router-view></router-view>
</div>
```
```
import Vue from 'vue'
import VueRouter from 'vue-router'
import App from './App'

Vue.use(VueRouter)

// 1. 定义（路由）组件。
// 可以从其他文件 import 进来
const Foo = { template: '<div>foo</div>' }
const Bar = { template: '<div>bar</div>' }

// 2. 定义路由
// 每个路由应该映射一个组件。 其中"component" 可以是
// 通过 Vue.extend() 创建的组件构造器，
// 或者，只是一个组件配置对象。
// 我们晚点再讨论嵌套路由。
const routes = [
  { path: '/foo', component: Foo },
  { path: '/bar', component: Bar }
]

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
  routes // （缩写）相当于 routes: routes
})

// 4. 创建和挂载根实例。
// 记得要通过 router 配置参数注入路由，
// 从而让整个应用都有路由功能
const app = new Vue({
  el: '#app',
  render(h) {
    return h(App)
  },
  router
})
```
# vue-router的实现
[原文链接](https://juejin.cn/post/6844903946343940104#heading-8)
# Vue项目中是怎么引入VueRouter
Vue 从它的设计上就是一个渐进式 JavaScript 框架，它本身的核心是解决视图渲染的问题，其它的能力就通过插件的方式来解决。Vue-Router 就是官方维护的路由插件，在介绍它的注册实现之前，我们先来分析一下 Vue 通用的插件注册原理。
```
new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
```
* 安装 VueRouter，再通过 import VueRouter from 'vue-router' 引入
* 先 const router = new VueRouter({...}),再把router作为参数的一个属性值，new Vue({router})
* 通过 Vue.use(VueRouter) 使得每个组件都可以拥有router实例
* 可以new说明vue-router是个类，vueRouter 类将 router 数组变成对象并且实现路由变化监听功能
使用了vue.use 说明这个类有静态 install 方法，为什么要有 vue.use 执行 install 方法，因为vue.use会给install方法传参数，第一个参数是vue,有了vue，我们可以做到不引入 router-link 和 router-view 就能使用这两个组件，是因为在vue.use的时候注册了,使用vue.use方法因为参数是vue，所以这样注册是为了给每个vue实例添加$route 和 $router 可以在实例上通过this.$route和this.$router访问,因为只有根组件才有router对象，所以vue-router利用全局Vue.mixin在beforeCreate的时候就初始化好router对象，子组件将层层寻找根节点的router对象挂载到自己本身
* router-view组件的实现是，render函数里的this指向的是一个Proxy代理对象，代理Vue组件，而我们前面讲到每个组件都有一个_root属性指向根组件，根组件上有_router这个路由实例。 所以我们可以从router实例上获得路由表，也可以获得当前路径。 然后再把获得的组件放到h()里进行渲染。
* 我们利用了Vue提供的API：defineReactive，使得this._router.history对象得到监听。 因此当我们第一次渲染router-view这个组件的时候，会获取到this._router.history这个对象，从而就会被监听到获取this._router.history。就会把router-view组件的依赖wacther收集到this._router.history对应的收集器dep中，因此this._router.history每次改变的时候。this._router.history对应的收集器dep就会通知router-view的组件依赖的wacther执行update()，从而使得router-view重新渲染（其实这就是vue响应式的内部原理）

## vue-use
Vue.use 接受一个 plugin 参数，并且维护了一个 _installedPlugins 数组，它存储所有注册过的 plugin；接着又会判断 plugin 有没有定义 install 方法，如果有的话则调用该方法，并且该方法执行的第一个参数是 Vue；最后把 plugin 存储到 installedPlugins 中。

可以看到 Vue 提供的插件注册机制很简单，每个插件都需要实现一个静态的 install 方法，当我们执行 Vue.use 注册插件的时候，就会执行这个 install 方法，并且在这个 install 方法的第一个参数我们可以拿到 Vue 对象，这样的好处就是作为插件的编写方不需要再额外去import Vue 了。
```
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    const args = toArray(arguments, 1)
    args.unshift(this)
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
```
## vue-router
Vue-Router 的入口文件是 src/index.js，其中定义了 VueRouter 类，也实现了 install 的静态方法：VueRouter.install = install，它的定义在 src/install.js 中。
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
# vue-router使用问题
[原文链接](https://juejin.cn/post/6844903961745440775)
## route和router有什么区别？

route是“路由信息对象”，包括path，params，hash，query，fullPath，matched，name等路由信息参数。 而router是“路由实例对象”，包括了路由的跳转方法，钩子函数等。

## 路由之间是怎么跳转的？有哪些方式？

声明式  通过使用内置组件<router-link :to="/home">来跳转
编程式  通过调用router实例的push方法router.push({ path: '/home' })或replace方法router.replace({ path: '/home' })

## 如果vue-router使用history模式，部署时要注意什么？

要注意404的问题，因为在history模式下，只是动态的通过js操作window.history来改变浏览器地址栏里的路径，并没有发起http请求，当直接在浏览器里输入这个地址的时候，就一定要对服务器发起http请求，但是这个目标在服务器上又不存在，所以会返回404。
所以要在Ngnix中将所有请求都转发到index.html上就可以了。
```
location / {
    try_files  $uri $uri/ @router index index.html;
}
location @router {
    rewrite ^.*$ /index.html last;
}
```
## 怎么实现路由懒加载呢？

```
function load(component) {
    //return resolve => require([`views/${component}`], resolve);
    return () => import(`views/${component}`);
}

const routes = [
    {
        path: '/home',
        name: 'home',
        component: load('home'),
        meta: {
            title: '首页'
        },
    },
]
```
## 怎样动态加载路由？
使用Router的实例方法addRoutes来实现动态加载路由，一般用来实现菜单权限。
使用时要注意，静态路由文件中不能有404路由，而要通过addRoutes一起动态添加进去。
```
const routes = [
    {
        path: '/overview',
        name: 'overview',
        component: () => import('@/views/account/overview/index'),
        meta: {
            title: '账户概览',
            pid: 869,
            nid: 877
        },
    },
    {
        path: '*',
        redirect: {
            path: '/'
        }
    }
]
vm.$router.options.routes.push(...routes);
vm.$router.addRoutes(routes);
```
## 在vue组件中怎么获取到当前的路由信息？
```
通过this.$route来获取
```
## 路由组件和路由为什么解耦，怎么解耦？
因为在组件中使用 $route 会使之与其对应路由形成高度耦合，从而使组件只能在某些特定的 URL 上使用，限制了其灵活性，所有要解耦。

耦合如以下代码所示。Home组件只有在http://localhost:8036/home/123URL上才能使用。
```
const Home = {
    template: '<div>User {{ $route.params.id }}</div>'
}
const router = new VueRouter({
    routes: [
        { path: '/home/:id', component: Home }
    ]
})
```
使用 props 来解耦

props为true，route.params将会被设置为组件属性。
props为对象，则按原样设置为组件属性。
props为函数，http://localhost:8036/home?id=123,会把123传给组件Home的props的id。
```
我们可以将下面的代码

const User = {
  template: '<div>User {{ $route.params.id }}</div>'
}
const routes = [{ path: '/user/:id', component: User }]
替换成

const User = {
  // 请确保添加一个与路由参数完全相同的 prop 名
  props: ['id'],
  template: '<div>User {{ id }}</div>'
}
const routes = [{ path: '/user/:id', component: User, props: true }]
```
布尔模式 当 props 设置为 true 时，route.params 将被设置为组件的 props。

命名视图#

对于有命名视图的路由，你必须为每个命名视图定义 props 配置：

const routes = [
  {
    path: '/user/:id',
    components: { default: User, sidebar: Sidebar },
    props: { default: true, sidebar: false }
  }
]

对象模式#

当 props 是一个对象时，它将原样设置为组件 props。当 props 是静态的时候很有用。

const routes = [
  {
    path: '/promotion/from-newsletter',
    component: Promotion,
    props: { newsletterPopup: false }
  }
]

函数模式#

你可以创建一个返回 props 的函数。这允许你将参数转换为其他类型，将静态值与基于路由的值相结合等等。

const routes = [
  {
    path: '/search',
    component: SearchUser,
    props: route => ({ query: route.query.q })
  }
]
URL /search?q=vue 将传递 {query: 'vue'} 作为 props 传给 SearchUser 组件。

请尽可能保持 props 函数为无状态的，因为它只会在路由发生变化时起作用。如果你需要状态来定义 props，请使用包装组件，这样 vue 才可以对状态变化做出反应。

## 命名视图
有时候想同时 (同级) 展示多个视图，而不是嵌套展示，例如创建一个布局，有 sidebar (侧导航) 和 main (主内容) 两个视图，这个时候命名视图就派上用场了。你可以在界面中拥有多个单独命名的视图，而不是只有一个单独的出口。如果 router-view 没有设置名字，那么默认为 default。

<router-view class="view left-sidebar" name="LeftSidebar"></router-view>
<router-view class="view main-content"></router-view>
<router-view class="view right-sidebar" name="RightSidebar"></router-view>
一个视图使用一个组件渲染，因此对于同个路由，多个视图就需要多个组件。确保正确使用 components 配置 (带上 s)：

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      components: {
        default: Home,
        // LeftSidebar: LeftSidebar 的缩写
        LeftSidebar,
        // 它们与 `<router-view>` 上的 `name` 属性匹配
        RightSidebar,
      },
    },
  ],
})
以上案例相关的可运行代码请移步这里.

嵌套命名视图#
我们也有可能使用命名视图创建嵌套视图的复杂布局。这时你也需要命名用到的嵌套 router-view 组件。我们以一个设置面板为例：

/settings/emails                                       /settings/profile
+-----------------------------------+                  +------------------------------+
| UserSettings                      |                  | UserSettings                 |
| +-----+-------------------------+ |                  | +-----+--------------------+ |
| | Nav | UserEmailsSubscriptions | |  +------------>  | | Nav | UserProfile        | |
| |     +-------------------------+ |                  | |     +--------------------+ |
| |     |                         | |                  | |     | UserProfilePreview | |
| +-----+-------------------------+ |                  | +-----+--------------------+ |
+-----------------------------------+                  +------------------------------+
Nav 只是一个常规组件。
UserSettings 是一个视图组件。
UserEmailsSubscriptions、UserProfile、UserProfilePreview 是嵌套的视图组件。
注意：我们先忘记 HTML/CSS 具体的布局的样子，只专注在用到的组件上。

UserSettings 组件的 <template> 部分应该是类似下面的这段代码:

<!-- UserSettings.vue -->
<div>
  <h1>User Settings</h1>
  <NavBar />
  <router-view />
  <router-view name="helper" />
</div>
那么你就可以通过这个路由配置来实现上面的布局：
```
{
  path: '/settings',
  // 你也可以在顶级路由就配置命名视图
  component: UserSettings,
  children: [{
    path: 'emails',
    component: UserEmailsSubscriptions
  }, {
    path: 'profile',
    components: {
      default: UserProfile,
      helper: UserProfilePreview
    }
  }]
}
```

## 如何获取路由传过来的参数？

路由有三种传参方式，获取方式各不相同。

meta：路由元信息，写在routes配置文件中。{
    path: '/home',
    name: 'home',
    component: load('home'),
    meta: {
        title: '首页'
    },
},
获取方式this.$route.meta.title获取

query：this.$route.push({
    path:'/home',
    query:{
        userId:123
    }
})
浏览器地址：http://localhost:8036/home?userId=123
获取方式：this.$route.query.userId
params：这种方式比较麻烦。

首先要在地址上做配置{
    path: '/home/:userId',
    name: 'home',
    component: load('home'),
    meta: {
        title: '首页'
    },
},

访问传参const userId = '123'
this.$router.push({ name: 'home', params: { userId } })
注意用params传参，只能用命名的路由（用name访问），如果用path，params不起作用。
this.$router.push({ path: '/home', params: { userId }})不生效。
浏览器地址：http://localhost:8036/home/123
获取方式：this.$route.params.userId

## 不同的历史模式
hash/history 浏览器     abstract node情况

## 在什么场景下会用到嵌套路由？
做个管理系统，顶部栏和左侧菜单栏是全局通用的，那就应该放在父路由，而右下的页面内容部分放在子路由。

切换路由后，新页面要滚动到顶部或保持原先的滚动位置怎么做呢？

滚动顶部const router = new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { x: 0, y: 0 };
        }
    }
});

滚动原先位置
## 怎么在组件中监听路由参数的变化？

有两种方法可以监听路由参数的变化，但是只能用在包含<router-view />的组件内。

第一种watch: {
    '$route'(to, from) {
        //这里监听
    },
},

第二种beforeRouteUpdate (to, from, next) {
    //这里监听
},
## 说说你对router-link的了解

<router-link>是Vue-Router的内置组件，在具有路由功能的应用中作为声明式的导航使用。
<router-link>有8个props，其作用是：

to：必填，表示目标路由的链接。当被点击后，内部会立刻把to的值传到router.push()，所以这个值可以是一个字符串或者是描述目标位置的对象。<router-link to="home">Home</router-link>
<router-link :to="'home'">Home</router-link>
<router-link :to="{ path: 'home' }">Home</router-link>
<router-link :to="{ name: 'user', params: { userId: 123 }}">User</router-link>
<router-link :to="{ path: 'user', query: { userId: 123 }}">User</router-link>

注意path存在时params不起作用，只能用query

replace：默认值为false，若设置的话，当点击时，会调用router.replace()而不是router.push()，于是导航后不会留下 history 记录。
append：设置 append 属性后，则在当前 (相对) 路径前添加基路径。
tag：让<router-link>渲染成tag设置的标签，如tag:'li,渲染结果为<li>foo</li>。
active-class：默认值为router-link-active,设置链接激活时使用的 CSS 类名。默认值可以通过路由的构造选项 linkActiveClass 来全局配置。
exact-active-class：默认值为router-link-exact-active,设置链接被精确匹配的时候应该激活的 class。默认值可以通过路由构造函数选项 linkExactActiveClass 进行全局配置的。
exact：是否精确匹配，默认为false。<!-- 这个链接只会在地址为 / 的时候被激活 -->
<router-link to="/" exact></router-link>

event：声明可以用来触发导航的事件。可以是一个字符串或是一个包含字符串的数组，默认是click。
## 在beforeRouteEnter导航守卫中可以用this吗？

不可以，因为守卫在导航确认前被调用,因此即将登场的新组件还没被创建。
可以通过传一个回调给next来访问组件实例。在导航被确认的时候执行回调，并且把组件实例作为回调方法的参数。
beforeRouteEnter(to, from, next) {
    next(vm => {
        console.log(vm)
    })
}
## 在组件内使用的导航守卫有哪些？怎么使用？
beforeRouteLeave：在失活的组件里调用离开守卫。
beforeRouteUpdate：在重用的组件里调用,比如包含<router-view />的组件。
beforeRouteEnter：在进入对应路由的组件创建前调用。

beforeRouteLeave(to, from, next) {
    //...
},
beforeRouteUpdate(to, from, next) {
    //...
},
beforeRouteEnter(to, from, next) {
    //...
},
## 讲一下导航守卫的三个参数的含义？

to：即将要进入的目标 路由对象。
from：当前导航正要离开的路由对象。
next：函数，必须调用，不然路由跳转不过去。

next()：进入下一个路由。
next(false)：中断当前的导航。
next('/')或next({ path: '/' }) : 跳转到其他路由，当前导航被中断，进行新的一个导航。

## 讲一下完整的导航守卫流程？

导航被触发。
在失活的组件里调用离开守卫beforeRouteLeave(to,from,next)。
调用全局的beforeEach( (to,from,next) =>{} )守卫。
在重用的组件里调用 beforeRouteUpdate(to,from,next) 守卫。
在路由配置里调用beforeEnter(to,from,next)路由独享的守卫。
解析异步路由组件。
在被激活的组件里调用beforeRouteEnter(to,from,next)。
在所有组件内守卫和异步路由组件被解析之后调用全局的beforeResolve( (to,from,next) =>{} )解析守卫。
导航被确认。
调用全局的afterEach( (to,from) =>{} )钩子。
触发 DOM 更新。
用创建好的实例调用beforeRouteEnter守卫中传给 next 的回调函数beforeRouteEnter(to, from, next) {
    next(vm => {
        //通过vm访问组件实例
    })
},
## 切换路由时，需要保存草稿的功能，怎么实现呢？

<keep-alive :include="include">
    <router-view></router-view>
 </keep-alive>
其中include可以是个数组，数组内容为路由的name选项的值。

## 怎么配置404页面？

const router = new VueRouter({
    routes: [
        {
            path: '*', redirect: {path: '/'}
        }
    ]
})
## 怎么重定向页面？

第一种方法：
const router = new VueRouter({
    routes: [
        { path: '/a', redirect: '/b' }
    ]
})
第二种方法:
const router = new VueRouter({
    routes: [
        { path: '/a', redirect: { name: 'foo' } }
    ]
})
第三种方法：
const router = new VueRouter({
    routes: [
        { 
            path: '/a', 
            redirect: to =>{
                const { hash, params, query } = to
                if (query.to === 'foo') {
                    return { path: '/foo', query: null }
                }else{
                   return '/b' 
                }
            }
            
        }
    ]
})

## 什么是路由独享的守卫，怎么使用？
是beforeEnter守卫
```
const router = new VueRouter({
    routes: [
        {
            path: '/foo',
            component: Foo,
            beforeEnter: (to, from, next) => {
            // ...
            }
        }
    ]
})
```
## 全局导航守卫有哪些？怎么使用？

router.beforeEach：全局前置守卫。
router.beforeResolve：全局解析守卫。
router.afterEach：全局后置钩子。
```
import VueRouter from 'vue-router';
const router = new VueRouter({
    mode: 'history',
    base: '/',
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { x: 0, y: 0 };
        }
    }
})
router.beforeEach((to, from, next) => {
    //...
    next();
})
router.beforeResolve((to, from, next) => {
    //...
    next();
})
router.afterEach((to, from) => {
    //...
});
```

# VueRouter 对象
VueRouter 的实现是一个类，我们先对它做一个简单地分析，它的定义在 src/index.js 中。
判断是什么路由类型并且初始化setuplisteners history监听popstate事件 hash监听hashchange事件，还有初始化跳转路由，会有match方法匹配路由，为了可以嵌套路由还有内部设置一个统一通过history.transitionTo跳转路由。在router-link组件内也是找到组件的router对象进行跳转的。router-view 利用router的matched数组来取到匹配的component
```
const matched = route.matched[depth]
const component = matched && matched.components[name]
```
```
export default class VueRouter {
  static install: () => void;
  static version: string;

  app: any;
  apps: Array<any>;
  ready: boolean;
  readyCbs: Array<Function>;
  options: RouterOptions;
  mode: string;
  history: HashHistory | HTML5History | AbstractHistory;
  matcher: Matcher;
  fallback: boolean;
  beforeHooks: Array<?NavigationGuard>;
  resolveHooks: Array<?NavigationGuard>;
  afterHooks: Array<?AfterNavigationHook>;

  constructor (options: RouterOptions = {}) {
    this.app = null
    this.apps = []
    this.options = options
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    this.matcher = createMatcher(options.routes || [], this)

    let mode = options.mode || 'hash'
    this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
    if (this.fallback) {
      mode = 'hash'
    }
    if (!inBrowser) {
      mode = 'abstract'
    }
    this.mode = mode

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base)
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`)
        }
    }
  }

  match (
    raw: RawLocation,
    current?: Route,
    redirectedFrom?: Location
  ): Route {
    return this.matcher.match(raw, current, redirectedFrom)
  }

  get currentRoute (): ?Route {
    return this.history && this.history.current
  }

  init (app: any) {
    process.env.NODE_ENV !== 'production' && assert(
      install.installed,
      `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
      `before creating root instance.`
    )

    this.apps.push(app)

    if (this.app) {
      return
    }

    this.app = app

    const history = this.history

    if (history instanceof HTML5History) {
      history.transitionTo(history.getCurrentLocation())
    } else if (history instanceof HashHistory) {
      const setupHashListener = () => {
        history.setupListeners()
      }
      history.transitionTo(
        history.getCurrentLocation(),
        setupHashListener,
        setupHashListener
      )
    }

    history.listen(route => {
      this.apps.forEach((app) => {
        app._route = route
      })
    })
  }

  beforeEach (fn: Function): Function {
    return registerHook(this.beforeHooks, fn)
  }

  beforeResolve (fn: Function): Function {
    return registerHook(this.resolveHooks, fn)
  }

  afterEach (fn: Function): Function {
    return registerHook(this.afterHooks, fn)
  }

  onReady (cb: Function, errorCb?: Function) {
    this.history.onReady(cb, errorCb)
  }

  onError (errorCb: Function) {
    this.history.onError(errorCb)
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.history.push(location, onComplete, onAbort)
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.history.replace(location, onComplete, onAbort)
  }

  go (n: number) {
    this.history.go(n)
  }

  back () {
    this.go(-1)
  }

  forward () {
    this.go(1)
  }

  getMatchedComponents (to?: RawLocation | Route): Array<any> {
    const route: any = to
      ? to.matched
        ? to
        : this.resolve(to).route
      : this.currentRoute
    if (!route) {
      return []
    }
    return [].concat.apply([], route.matched.map(m => {
      return Object.keys(m.components).map(key => {
        return m.components[key]
      })
    }))
  }

  resolve (
    to: RawLocation,
    current?: Route,
    append?: boolean
  ): {
    location: Location,
    route: Route,
    href: string,
    normalizedTo: Location,
    resolved: Route
  } {
    const location = normalizeLocation(
      to,
      current || this.history.current,
      append,
      this
    )
    const route = this.match(location, current)
    const fullPath = route.redirectedFrom || route.fullPath
    const base = this.history.base
    const href = createHref(base, fullPath, this.mode)
    return {
      location,
      route,
      href,
      normalizedTo: location,
      resolved: route
    }
  }

  addRoutes (routes: Array<RouteConfig>) {
    this.matcher.addRoutes(routes)
    if (this.history.current !== START) {
      this.history.transitionTo(this.history.getCurrentLocation())
    }
  }
}
```

```
transitionTo (
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ) {
    let route
    // catch redirect option https://github.com/vuejs/vue-router/issues/3201
    try {
      route = this.router.match(location, this.current)
    } catch (e) {
      this.errorCbs.forEach(cb => {
        cb(e)
      })
      // Exception should still be thrown
      throw e
    }
    const prev = this.current
    this.confirmTransition(
      route,
      () => {
        this.updateRoute(route)
        onComplete && onComplete(route)
        this.ensureURL()
        this.router.afterHooks.forEach(hook => {
          hook && hook(route, prev)
        })

        // fire ready cbs once
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },
      err => {
        if (onAbort) {
          onAbort(err)
        }
        if (err && !this.ready) {
          // Initial redirection should not mark the history as ready yet
          // because it's triggered by the redirection instead
          // https://github.com/vuejs/vue-router/issues/3225
          // https://github.com/vuejs/vue-router/issues/3331
          if (!isNavigationFailure(err, NavigationFailureType.redirected) || prev !== START) {
            this.ready = true
            this.readyErrorCbs.forEach(cb => {
              cb(err)
            })
          }
        }
      }
    )
  }

```
```
setupListeners () {
  if (this.listeners.length > 0) {
    return
  }

  const router = this.router
  const expectScroll = router.options.scrollBehavior
  const supportsScroll = supportsPushState && expectScroll

  if (supportsScroll) {
    this.listeners.push(setupScroll())
  }

  const handleRoutingEvent = () => {
    const current = this.current

    // Avoiding first `popstate` event dispatched in some browsers but first
    // history route not updated since async guard at the same time.
    const location = getLocation(this.base)
    if (this.current === START && location === this._startLocation) {
      return
    }

    this.transitionTo(location, route => {
      if (supportsScroll) {
        handleScroll(router, route, current, true)
      }
    })
  }
  window.addEventListener('popstate', handleRoutingEvent)
  this.listeners.push(() => {
    window.removeEventListener('popstate', handleRoutingEvent)
  })
}
```
# 总结
1.通过minxi混入的方式，如果自身是根组件，就把根组件的_router属性映射为new Vue传入的router实例(this.$options.router)。
2.如果自身不是根组件，那么层层往上找，直到找到根组件，并用_routerRoot标记出根组件
3.为每一个组件代理$router、$route属性，这样每一个组件都可以去到$router、$route
4.注册<router-link>、<router-view>组件