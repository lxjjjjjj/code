[原文链接](https://juejin.cn/post/6874855535234170887)
# beforeCreate
是new Vue()之后触发的第一个钩子，此时 data、methods、computed以及watch上的数据和方法还未初始化，都不能被访问。在实例初始化之后，数据观测 (data observer) 和 event/watcher 事件配置之前被调用。

创建vue对象中的生命周期的标志属性以及$parent,$root,_watcher,children
创建vue对象的事件监听对象 分为native事件和自定义事件
创建vue内部用来渲染dom的函数和创建dom上$listeners、$attrs的监听

# created
在实例创建完成后被立即调用，此时已完成以下的配置：数据观测 (data observer)，property 和方法的运算，watch/event 事件回调。然而，挂载阶段还没开始，$el property 目前尚不可用，**也就是可以使用数据，更改数据，在这里更改数据不会触发updated函数。**

创建data、provide、inject等的数据初始化以及监听

data 和 methods 都已经被初始化好了，如果要调用 methods 中的方法，或者操作 data 中的数据，最早可以在这个阶段中操作。无法与Dom进行交互，如果非要想，可以通过vm.$nextTick来访问Dom。异步数据的请求适合在 created 的钩子中使用，例如数据初始化。

# beforeMount

发生在挂载之前，在这之前 template 模板已导入渲染函数编译。此时虚拟Dom已经创建完成，即将开始渲染。在这一阶段也可以对数据进行更改，不会触发updated。执行到这个钩子的时候，在内存中已经编译好了模板了，但是还没有挂载到页面中，此时，页面还是旧的。

还没执行render渲染之前触发
# mounted
在挂载完成后发生，此时真实的Dom挂载完毕，数据完成双向绑定，可以访问到Dom节点，使用$refs属性对Dom进行操作。执行到这个钩子的时候，就表示vue实例已经初始化完成了。此时组件脱离了创建阶段，进入到了运行阶段。 如果我们想要通过插件操作页面上的DOM节点，最早可以在和这个阶段中进行。

mounted 不会保证所有的子组件也都一起被挂载。如果你希望等到整个视图都渲染完毕，可以在 mounted 内部使用 vm.$nextTick。
mounted: function () {
  this.$nextTick(function () {
    // Code that will run only after the
    // entire view has been rendered
  })
}

# beforeUpdate
beforeUpdate：发生在更新之前，也就是响应式数据发生更新，虚拟dom重新渲染之前被触发，你可以在当前阶段进行更改数据，不会造成重新渲染,但会再次触发当前钩子函数。

# updated
发生在更新完成之后，此时 Dom 已经更新。现在可以执行依赖于 DOM 的操作。然而在大多数情况下，你应该避免在此期间更改状态。如果要相应状态改变，最好使用计算属性或 watcher 取而代之。最好不要在此期间更改数据，因为这可能会导致无限循环的更新。

updated 不会保证所有的子组件也都一起被重绘。如果你希望等到整个视图都重绘完毕，可以在 updated 里使用 vm.$nextTick。

# beforeDestroy
发生在实例销毁之前，在这期间实例完全可以被使用，我们可以在这时进行善后收尾工作，比如清除计时器。Vue实例从运行阶段进入到了销毁阶段，这个时候上所有的 data 和 methods ， 指令， 过滤器 ……都是处于可用状态。还没有真正被销毁。

# destoryed
发生在实例销毁之后，这个时候只剩下了dom空壳。组件已被拆解，数据绑定被卸除，事件监听器被移除，所有子实例也统统被销毁。在大多数场景中你不应该调用这个方法。最好使用 v-if 和 v-for 指令以数据驱动的方式控制子组件的生命周期。

