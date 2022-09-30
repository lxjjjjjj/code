# Vue.use方法
```
如果插件是一个对象，必须提供 install 方法。
如果插件是一个函数，它会被作为 install 方法。

install 方法调用时，会将 Vue 作为参数传入。Vue.use(plugin)调用之后，插件的install方法就会默认接受到一个参数，这个参数就是Vue。

Vue.use的方法需要在调用 new Vue() 之前被调用。当 install 方法被同一个插件多次调用，插件将只会被安装一次。
```
# 注册方法的使用
```
Vue.use(ElementUi);
Vue.use(Vuex);
Vue.use(Router);
这样就算是完成了对三个插件的安装，我们就可以在组件中调用 this.$router、this.$route、this.$store、this.$alert()
```
# Vue.use的实现
Vue.use方法主要做了如下的事：

* 检查插件是否安装，如果安装了就不再安装
* 如果没有没有安装，那么调用插件的install方法，并传入Vue实例
```
export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    // 获取已经安装的插件
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 看看插件是否已经安装，如果安装了直接返回
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }
    // toArray(arguments, 1)实现的功能就是，获取Vue.use(plugin,xx,xx)中的其他参数。
    // 比如 Vue.use(plugin,{size:'mini', theme:'black'})，就会回去到plugin意外的参数
    const args = toArray(arguments, 1)
    // 在参数中第一位插入Vue，从而保证第一个参数是Vue实例
    args.unshift(this)
    // 插件要么是一个函数，要么是一个对象(对象包含install方法)
    if (typeof plugin.install === 'function') {
      // 调用插件的install方法，并传入Vue实例
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    // 在已经安装的插件数组中，放进去
    installedPlugins.push(plugin)
    return this
  }
}
```

## ELEMENT中的Vue.use的使用
```
const install = function(Vue, opts = {}) {
  locale.use(opts.locale);
  locale.i18n(opts.i18n);
  // components是ElementUI的组件数组，里面有Dialog、Input之类的组件
  // 往Vue上面挂载组件
  components.forEach(component => {
    Vue.component(component.name, component);
  });

  // 自定义一些参数
  Vue.prototype.$ELEMENT = {
    size: opts.size || '',
    zIndex: opts.zIndex || 2000
  };
  // 在Vue原型上注册一些方法，这就是为什么我们可以直接使用this.$alert、this.$loading的原因，值就是这么来的。
  Vue.prototype.$loading = Loading.service;
  Vue.prototype.$msgbox = MessageBox;
  Vue.prototype.$alert = MessageBox.alert;
  Vue.prototype.$confirm = MessageBox.confirm;
  Vue.prototype.$prompt = MessageBox.prompt;
  Vue.prototype.$notify = Notification;
  Vue.prototype.$message = Message;

};
```

