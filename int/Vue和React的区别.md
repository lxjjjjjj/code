[原文链接](https://github.com/lihongxun945/myblog/issues/21)
[Lucas HC回答Vue和React的区别](https://www.zhihu.com/question/301860721/answer/724759264)
[为什么vue3不需要时间切片](https://github.com/vuejs/rfcs/issues/89)
# Vue & React单向数据流的实现不同

单向数据流是只能有一个方向修改状态，优点是所有状态可记录，可跟踪，维护性强。Vue在父子组件的单向数据流的实现上和react不同，表现在子组件想要改变父组件渲染模版的数据变化，调用emit传值即可，但是react是通过父组件传给子组件函数，然后子组件调用父组件函数，父组件函数通过回调函数传值实现更改数据。此外Vue在组件内部维护着双向绑定的语法糖实现形式上的双向数据流。双向数据流是数据变化会让页面重新渲染从而更新视图，页面也会通过用户的交互、产生状态、数据的变化，我们编写代码将视图对数据的更新同步到数据。优点是在表单交互较多的场景下，会简化大量业务无关的代码。缺点也是不易维护。

尤雨溪说 双向绑定是对表单来说的，表单的双向绑定，说到底不过是 value 的单向绑定 + onChange 事件侦听的一个语法糖。这个并不是 React 和 Vue 在理念上真正的差别体现。同时，单向数据流不是 Vue 或者 React 的差别，而是 Vue 和 React 的共同默契选择。单向数据流核心是在于避免组件的自身（未来可复用）状态设计，它强调把 state hoist 出来进行集中管理。


### 单向数据流 

单向数据流指只能从一个方向来修改状态

```
<input type="text" value={this.state.value} onChange={this.handleChange} />

handleChange(event) {
  this.setState({value: event.target.value});
}
```

#### 优点

- 所有状态的改变可记录、可跟踪，源头易追溯
- 所有的数据，具有唯一出口和入口，使得数据操作更直观更容易理解，可维护性强

#### 缺点

- 页面渲染完成后，有新数据不能自动更新，需要手动整合新数据和模板重新渲染
- 代码量上升，数据流转过程变长，代码重复性变大
- 由于对应用状态独立管理的严格要求(单一的全局 store，如：Vuex)，在处理局部状态较多的场景时(如用户输入交互较多的“富表单型”应用)，会显得啰嗦及繁琐。

### 双向数据流
数据变化会让页面重新渲染从而更新视图，页面也会通过用户的交互、产生状态、数据的变化，我们编写代码将视图对数据的更新同步到数据。

```
<input v-model="text">

修改text值就会触发响应式数据text的变化，从而会触发其他使用到text数据的变化
```

#### 优点
- 数据模型变化与更新，会自动同步到页面上，用户在页面的数据操作，也会自动同步到数据模型
- 无需进行和单向数据绑定的那些相关操作；
- 在表单交互较多的场景下，会简化大量业务无关的代码。

#### 缺点

- 无法追踪局部状态的变化
- 由于组件数据变化来源入口变得可能不止一个，数据流转方向易紊乱。
- 改变一个状态有可能会触发一连串的状态的变化，最后很难预测最终的状态是什么样的。使得代码变得很难调试

### 父子组件通信

Vue
```
父->子：通过props进行传递数据给子组件 子->父：通过emit向父组件传值
```
React

```
父->子：通过props将数据传递给子组件 子->父：通过父组件向子组件传递函数，然后子组件中调用这些函数，利用回调函数实现数据传递
```
### 兄弟组件通信
Vue
```
在Vue中，可以通过查找父组件下的子组件实例，然后进行组件进行通信。如this.$parent.$children，在$children中，可以通过组件的name找到要通信的组件，进而进行通信。
```
React
```
在React中，需要现将数据传递给父组件，然后父组件再传递给兄弟组件。

```

### v-model实现 之 双向绑定
双向绑定除了数据驱动DOM外，DOM的变化反过来影响数据，是一个双向关系。

#### v-model的编译阶段

[vue v-model](https://ustbhuangyi.github.io/vue-analysis/v2/extend/v-model.html#%E8%A1%A8%E5%8D%95%E5%85%83%E7%B4%A0)
从编译阶段分析，首先是 parse 阶段， v-model 被当做普通的指令解析到 el.directives 中，通过修改 AST 元素，给 el 添加一个 prop，相当于我们在 input 上动态绑定了 value，又给 el 添加了事件处理，相当于在 input 上绑定了 input 事件，然后给元素绑定value和onchange事件。其实转换成模板如下

```
<input
  v-bind:value="message"
  v-on:input="message=$event.target.value">

```
其实就是动态绑定了 input 的 value 指向了 messgae 变量，并且在触发 input 事件的时候去动态把 message 设置为目标值，这样实际上就完成了数据双向绑定了，所以说 v-model 实际上就是语法糖。


# 设计理念不同 Vue推崇可变数据 React推崇不可变数据
React 和 Vue 在理念上的差别，且对后续设计实现产生不可逆影响的是：Vue 进行数据拦截/代理，它对侦测数据的变化更敏感、更精确，也间接对一些后续实现（比如 hooks，function based API）提供了很大的便利。这个我们后面会提到；React 推崇函数式，它直接进行局部重新刷新（或者重新渲染），这样更粗暴，但是更简单，让我们的开发回到了上古时代，就是刷新呗，前端开发非常简单。但是 React 并不知道什么时候“应该去刷新”，触发局部重新变化是由开发者手动调用 setState 完成。

React setState 引起局部重新刷新。为了达到更好的性能，React 暴漏给开发者 shouldComponentUpdate 这个生命周期 hook，来避免不需要的重新渲染（相比之下，Vue 由于采用依赖追踪，默认就是优化状态：你动了多少数据，就触发多少更新，不多也不少，而 React 对数据变化毫无感知，它就提供 React.createElement 调用已生成 virtual dom）。另外 React 为了弥补不必要的更新，会对 setState 的行为进行合并操作。因此 setState 有时候会是异步更新，但并不是总是“异步”

Vue 通过 getter/setter 以及一些函数的劫持，能精确知道数据变化，不需要特别的优化就能达到很好的性能, vue的响应式也导致对于基本类型的监听要换成对象监听。

React 默认是通过比较引用的方式进行的，如果不优化（PureComponent/shouldComponentUpdate）可能导致大量不必要的VDOM的重新渲染
为什么 React 不精确监听数据变化呢？这是因为 Vue 和 React 设计理念上的区别，Vue 使用的是可变数据，而React更强调数据的不可变。所以应该说没有好坏之分，Vue更加简单，而React构建大型应用的时候更加鲁棒。Vue是支持双向绑定的。

Vue只会接管组件自己本身的响应式数据更新并不会接管子组件的响应式更新，在diff的过程中，只会对 component 上声明的 props、listeners等属性进行更新，而不会深入到组件内部进行更新。子节点的触发更新是在子节点mount的时候，通过将props变成响应式数据。达到监听的属性变化而达到自己的更新。因此理论上vue的更新不会像react的更新一样涉及到大量的递归diff计算。那么对于父组件中的slot，vue的更新做法是，slot中的响应式数据msg属性在进行依赖收集的时候，收集到的是父组件的`渲染watcher。含有slot的组件在prepatch的updateChildComponent方法执行的时候检测到组件本身是含有slot的组件，所以在渲染的时候会调用$forthUpdate更新自己本身的渲染。因为收集到的是父组件的渲染watcher，所以会触发父组件的更新，和含有slot组件本身的更新。如果含有slot的组件含有一个包含slot的子组件，那么还会继续递归更新。

##  vue是如何把组件更新限制在组件本身的

[https://juejin.cn/post/6844904113432444942](https://juejin.cn/post/6844904113432444942)

Vue 对于响应式属性的更新，只会精确更新依赖收集的当前组件，而不会递归的去更新子组件，这也是它性能强大的原因之一


```
<template>
   <div>
      {{ msg }}
      <ChildComponent />
   </div>
</template>
我们在触发 this.msg = 'Hello, Changed~'的时候，会触发组件的更新，视图的重新渲染。
但是 <ChildComponent /> 这个组件其实是不会重新渲染的，这是 Vue 刻意而为之的。

```
## React的更新粒度

```
而 React 在类似的场景下是自顶向下的进行递归更新的，也就是说，React 中假如 ChildComponent 里还有十层嵌套子元素，那么所有层次都会递归的重新render（在不进行手动优化的情况下），这是性能上的灾难。（因此，React 创造了Fiber，创造了异步渲染。他们能用收集依赖的这套体系吗？不能，因为他们遵从Immutable的设计思想，永远不在原对象上修改属性，那么基于 Object.defineProperty 或 Proxy 的响应式依赖收集机制就无从下手了（你永远返回一个新的对象，我哪知道你修改了旧对象的哪部分？）由于没有响应式的收集依赖，React 只能递归的把所有子组件都重新 render一遍（除了memo和shouldComponentUpdate这些优化手段），然后再通过 diff算法 决定要更新哪部分的视图，这个递归的过程叫做 reconciler，听起来很酷，但是性能很灾难。
```
## Vue的更新粒度

```
Vue 这种精确的更新是怎么做的呢？其实每个组件都有自己的渲染 watcher，它掌管了当前组件的视图更新，但是并不会掌管 ChildComponent 的更新。
```
## Vue源码中如何实现的
在 patch 的过程中，当组件更新到ChildComponent的时候，会走到 patchVnode。执行 vnode 的 prepatch 钩子。注意，只有 组件vnode 才会有 prepatch 这个生命周期。prepatch生命周期执行updateChildComponent方法。这个方法做的事情就是

- 更新props（后续详细讲）
- 更新绑定事件
- 对于slot做一些更新（后续详细讲）

### 如果有子节点的话，对子节点进行 diff

```
<ul>
  <li>1</li>
  <li>2</li>
  <li>3</li>
<ul>
```
然后到此为止，patchVnode 就结束了，并没有像常规思维中的那样去递归的更新子组件树。这也就说明了，Vue 的组件更新确实是精确到组件本身的。

### 如果是子组件呢？

```
假设列表是这样的：

<ul>
  <component>1</component>
  <component>2</component>
  <component>3</component>
<ul>

那么在diff的过程中，只会对 component 上声明的 props、listeners等属性进行更新，而不会深入到组件内部进行更新。
```
#### 子组件props的更新如何触发重新渲染呢
因为在子组件组件初始化 props的时候，会走到 initProps 方法
```
const props = vm._props = {}

 for (const key in propsOptions) {
    // 经过一系列验证props合法性的流程后
    const value = validateProp(key, propsOptions, propsData, vm)
    // props中的字段也被定义成响应式了
    defineReactive(props, key, value)
}
```
至此为止，是实现了对于 _props 上字段变更的劫持。也就是变成了响应式数据，后面我们做类似于 _props.msg = 'Changed' 的操作时（当然我们不会这样做，Vue内部会做），就会触发视图更新。其实，msg 在传给子组件的时候，会被保存在子组件实例的 _props 上，并且被定义成了响应式属性，而子组件的模板中对于 msg 的访问其实是被代理到 _props.msg 上去的，所以自然也能精确的收集到依赖，只要 ChildComponent 在模板里也读取了这个属性。
这里要注意一个细节，其实父组件发生重渲染的时候，是会重新计算子组件的 props 的，具体是在 updateChildComponent 中的：那么，由于上面注释标明的那段代码，msg 的变化通过 _props 的响应式能力，也让子组件重新渲染了，到目前为止，都只有真的用到了 msg 的组件被重新渲染了


```
  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false)
    // 注意props被指向了 _props
    const props = vm._props
    const propKeys = vm.$options._propKeys || []
    for (let i = 0; i < propKeys.length; i++) {
      const key = propKeys[i]
      const propOptions: any = vm.$options.props // wtf flow?
      // 就是这句话，触发了对于 _props.msg 的依赖更新。
      props[key] = validateProp(key, propOptions, propsData, vm)
    }
    toggleObserving(true)
    // keep a copy of raw propsData
    vm.$options.propsData = propsData
  }
```
### vue.$forthUpdate

vm.$forceUpdate：迫使 Vue 实例重新渲染。注意它仅仅影响实例本身和插入插槽内容的子组件，而不是所有子组件。vm.$forceUpdate 本质上就是触发了渲染watcher的重新执行，和你去修改一个响应式的属性触发更新的原理是一模一样的，它只是帮你调用了 vm._watcher.update()（只是提供给你了一个便捷的api，在设计模式中叫做门面模式）

### vue2.4的slot是如何更新的

父组件parent-comp
```
<div>
  <slot-comp>
     <span>{{ msg }}</span>
  </slot-comp>
</div>
```
子组件 slot-comp

```
<div>
   <slot></slot>
</div>
```
组件中含有 slot的更新 ，是属于比较特殊的场景。这里的 msg 属性在进行依赖收集的时候，收集到的是 parent-comp 的`渲染watcher。那么我们想象 msg 此时更新了，这个组件在更新的时候，遇到了一个子组件 slot-comp，按照 Vue 的精确更新策略来说，子组件是不会重新渲染的。但是在源码内部，它做了一个判断，在执行 slot-comp 的 prepatch 这个hook的时候，会执行 updateChildComponent 逻辑，在这个函数内部会发现它有 slot 元素。


```
prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions
    // 注意 这个child就是 slot-comp 组件的 vm 实例，也就是咱们平常用的 this
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },
在 updateChildComponent 内部
  const hasChildren = !!(
    // 这玩意就是 slot 元素
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    parentVnode.data.scopedSlots || // has new scoped slots
    vm.$scopedSlots !== emptyObject // has old scoped slots
  )
然后下面走一个判断
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }
```
这里调用了 slot-comp 组件vm实例上的 $forceUpdate，那么它所触发的渲染watcher就是属于slot-comp的渲染watcher了。总结来说，这次 msg 的更新不光触发了 parent-comp 的重渲染，也进一步的触发了拥有slot的子组件 slot-comp 的重渲染。
它也只是触发了两层渲染，如果 slot-comp 内部又渲染了其他组件 slot-child，那么此时它是不会进行递归更新的。（只要 slot-child 组件不要再有 slot 了）。

### 父子组件的更新会经历两个 nextTick 吗？
答案是不会：
注意看源码 queueWatcher 里的逻辑，父组件更新的时候全局变量 isFlushing 是 true，所以不会等到下个 tick 执行，而是直接推进队列里，在一个 tick 里一起更新掉了。
父组件更新的 nextTick 中会执行这个，会去循环运行 queue 里的 watcher

```
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  flushing = true
  for (index = 0; index < queue.length; index++) {
     // 更新父组件
     watcher.run()
  }
}

if (!flushing) {
  queue.push(watcher)
} else {
  // if already flushing, splice the watcher based on its id
  // if already past its id, it will be run next immediately.
  let i = queue.length - 1
  while (i > index && queue[i].id > watcher.id) {
    i--
  }
  queue.splice(i + 1, 0, watcher)
}
```

而在父组件更新的过程中又触发了子组件的响应式更新，导致触发了 queueWatcher 的话，由于 isFlushing 是 true，会这样走 else 中的逻辑，由于子组件的 id 是大于父组件的 id 的，所以会在插入在父组件的 watcher 之后，父组件的更新函数执行完毕后，自然就会执行子组件的 watcher 了。这是在同一个 tick 中的。

所以父子组件都需要更新的情况，只是在父组件的watcher更新的那个tick中加入子组件的更新watcher继续直接执行，只是在队列中加入了这个 watcher 直接执行。

### Vue 2.6 的优化

Vue 2.6 把上述对于 slot 的操作又进一步优化了，简单来说，利用

```
<slot-comp>
  <template v-slot:foo>
    {{ msg }}
  </template>
</slot-comp>
```
这种语法生成的插槽，会统一被编译成函数，在子组件的上下文中执行，所以父组件不会再收集到它内部的依赖，如果父组件中没有用到 msg，更新只会影响到子组件本身。而不再是从通过父组件修改 _props 来通知子组件更新了。

### vue2.4的版本的slot更新会出现一个bug

```
let Child = {
  name: "child",
  template:
    '<div><span>{{ localMsg }}</span><button @click="change">click</button></div>',
  data: function() {
    return {
      localMsg: this.msg
    };
  },
  props: {
    msg: String
  },
  methods: {
    change() {
      this.$emit("update:msg", "world");
    }
  }
};

new Vue({
  el: "#app",
  template: '<child :msg.sync="msg"><child>',
  beforeUpdate() {
    alert("update twice");
  },
  data() {
    return {
      msg: "hello"
    };
  },
  components: {
    Child
  }
});

```
具体的表现是点击 click按钮，会 alert 出两次 update twice。 这是由于子组件在执行 data 这个函数初始化组件的数据时，会错误的再收集一遍 Dep.target （也就是渲染watcher）。
由于数据初始化的时机是 beforeCreated -> created 之间，此时由于还没有进入子组件的渲染阶段， Dep.target 还是父组件的渲染watcher。
这就导致重复收集依赖，重复触发同样的更新，具体表现可以看这里：jsfiddle.net/sbmLobvr/9 。
怎么解决的呢？很简单，在执行 data 函数的前后，把 Dep.target 先设置为 null 即可，在 finally 中再恢复，这样响应式数据就没办法收集到依赖了。


```
export function getData (data: Function, vm: Component): any {
  const prevTarget = Dep.target
+ Dep.target = null
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
+ } finally {
+   Dep.target = prevTarget
  }
}
```
## react的Immutable思想

### 不可变（immutable）的用途和意义

不可变（immutable）指的是 在变量赋值或对象创建结束之后就使用者就不能再改变它的值或状态。

不可变数据指的其实就是当你修改一个数据的时候，这个数据会给你返回一个新的引用，而自己的引用保持不变

如果数据变更，节点类型不相同的时候会怎样呢？React 的做法非常简单粗暴，直接将 原 VDOM 树上该节点以及该节点下所有的后代节点 全部删除，然后替换为新 VDOM 树上同一位置的节点，当然这个节点的后代节点也全都跟着过来了。这样的话非常浪费性能，父组件数据一变化，子组件全部都移除，再换新的，所以才有了shouldComponentUpdate这个生命周期。这个函数如果返回false的话子组件就不会更新，但是每次在这个函数里面写对比会很麻烦，所以有了PureComponent和Memo，但是只提供了浅比较，所以这时候不可变数据就派上用场了，每次修改数据都和原数据不相等的话，就可以精确的控制更新。

Facebook早就知道React这一缺陷，所以历时三年打造了一个不可变数据的immutable.js。但是只是为了优化浅对比防止子组件过度刷新的话，引入这么大的一个库就未免有些大材小用了，而且学习成本也是需要考虑在内的，所以要为大家介绍一下今天的主角：轻量、易用、简洁又可以快速上手的immer.js！


# diff算法不同
[diff算法很好的文章](https://juejin.cn/post/6919376064833667080#heading-14)
## vue diff
### Vue2 diff算法

核心思想是双端对比原理，建立新旧列表头尾四个指针，将新旧列表的头尾节点分别对比是否相等，同时新旧节点的头尾节点也做交叉对比。 如果新旧节点的头尾对比相等，那么指针头指针++，尾指针—。 如果新旧列表的头尾节点交叉对比相等的话，那么移动旧列表的节点到新列表的位置即可，同时相等节点的头指针++ ，尾指针—。 非理想情况，如果四次对比都未找到相同节点，就要用新列表的头节点去旧列表中找到相等的节点并移动，新列表头指针++。 如果新列表的节点在旧列表中不存在的话，直接创建一个新节点就好了。 如果遍历到最后oldEndIndex < oldStartIndex 但是新列表中还有剩余节点，那就是要增加的节点 如果遍历到最后newEndIndex < newStartIndex 但是旧列表中还有剩余节点，那就是要删除的节点

### Vue3 diff算法

核心思想是双端对比和最长递增子序列结合的原理。最初先利用双端对比，将新旧头尾相同的节点排除要移动的可能， 考虑边界情况，指针位置 > prevEnd && 指针位置 <= nextEnd ，把新列表中指针位置到nextEnd之间剩下的节点插入进去就可以了 指针位置 > nextEnd && 指针位置 <= prevEnd 把旧列表中j到prevEnd之间的节点删除就可以了。 如果上面三种情况都不符合，那么对于新旧列表中剩余的节点，我们采取最长递增子序列的算法。 建立一个数组存储新列表的节点在旧列表中的位置。在数组中递增的数组下标是不需要移动的， 边界情况，新列表中没有该节点 或者 已经更新了全部的新节点，直接删除旧节点。

## React diff

核心思想就是最长递增子序列的原理，遍历新列表中节点找到其在对应旧列表中的位置，利用一个变量存储上一次查找到新列表和旧列表相同节点的位置，如果下一次循环新节点在旧列表中的位置比上一次标记位置大，就表示这些节点位置是没变的，如果节点位置比上一次记录的位置小的话就表示这个节点是要移动的。那么只需要按照节点在新列表中的位置移动一下就好。如果新节点在旧列表中没有位置的话，就是需要新增的节点，如果旧节点在新列表中没有位置的话就是需要删除的节点。

# 设计理念不同
## react 推崇函数式编程吗，组件使用jsx语法，all in js，将html与css全都融入javaScript中，jsx语法相对来说更加灵活
## vue的整体思想，是拥抱经典的html(结构)+css(表现)+js(行为)的形式，使用template模板，并提供指令供开发者使用，如v-if、v-show、v-for等，开发时有结构、表现、行为分离的感觉

# 使用组合功能的方式

在 Vue 中我们组合不同功能的方式是通过 mixin，而在React中我们通过 HoC (高阶组件）。

React 最早也是使用 mixins 的，不过后来他们觉得这种方式对组件侵入太强会导致很多问题，就弃用了 mixinx 转而使用 HoC，关于mixin究竟哪里不好，可以参考React官方的这篇文章 [Mixins Considered Harmful](https://reactjs.org/blog/2016/07/13/mixins-considered-harmful.html)

而 Vue 一直是使用 mixin 来实现的。

为什么 Vue 不采用 HoC 的方式来实现呢？

高阶组件本质就是高阶函数，React 的组件是一个纯粹的函数，所以高阶函数对React来说非常简单。

但是Vue就不行了，Vue中组件是一个被包装的函数，并不简单的就是我们定义组件的时候传入的对象或者函数。比如我们定义的模板怎么被编译的？比如声明的props怎么接收到的？这些都是vue创建组件实例的时候隐式干的事。由于vue默默帮我们做了这么多事，所以我们自己如果直接把组件的声明包装一下，返回一个高阶组件，那么这个被包装的组件就无法正常工作了。

推荐一篇很棒的文章讲的是vue中如何实现高阶组件 [探索Vue高阶组件](http://ww1.hcysun.me/)

# 模版代码实现的原理
React是在组件JS代码中，通过原生JS实现模板中的常见语法，比如插值，条件，循环等，都是通过JS语法实现的
Vue是在和组件JS代码分离的单独的模板中，通过指令来实现的，比如条件语句就需要 v-if 来实现

对这一点，我个人比较喜欢React的做法，因为他更加纯粹更加原生，而Vue的做法显得有些独特，会把HTML弄得很乱。举个例子，说明React的好处：

react中render函数是支持闭包特性的，所以我们import的组件在render中可以直接调用。但是在Vue中，由于模板中使用的数据都必须挂在 this 上进行一次中转，所以我们import 一个组件完了之后，还需要在 components 中再声明下，这样显然是很奇怪但又不得不这样的做法。

# 各自优势
vue的优势包括：框架内部封装的多，更容易上手，简单的语法及项目创建， 更快的渲染速度和更小的体积

react的优势包括： react更灵活，更接近原生的js、可操控性强，对于能力强的人，更容易造出更个性化的项目


React 设计是改变开发者，提供强大而复杂的机制，开发者按照我的来；Vue 是适应开发者，让开发者怎么爽怎么来。

# React和Vue对于数据绑定和Immutable的区别导致他们hooks的区别
[原文链接](https://juejin.cn/post/6844903877574295560#heading-2)

React 并不知道什么时候“应该去刷新”，触发局部重新变化是由开发者手动调用 setState 完成。React setState 引起局部重新刷新。为了达到更好的性能，React 暴漏给开发者 shouldComponentUpdate 这个生命周期 hook，来避免不需要的重新渲染（相比之下，Vue 由于采用依赖追踪，默认就是优化状态：你动了多少数据，就触发多少更新，不多也不少，而 React 对数据变化毫无感知，它就提供 React.createElement 调用已生成 virtual dom

这个设计上的差别，直接影响了 hooks 的实现和表现。

React hook 底层是基于链表（Array）实现，每次组件被 render 的时候都会顺序执行所有的 hooks，因为底层是链表，每一个 hook 的 next 是指向下一个 hook 的，所以要求开发者不能在不同 hooks 调用中使用判断条件，因为 if 会导致顺序不正确，从而导致报错。

相反，vue hook 只会被注册调用一次，vue 之所以能避开这些麻烦的问题，根本原因在于它对数据的响应是基于响应式的，是对数据进行了代理的。他不需要链表进行 hooks 记录，它对数据直接代理观察。


Vue hook 的 一个例子

```
function useMouse() {
  const x = value(0)
  const y = value(0)
  const update = e => {
    x.value = e.pageX
    y.value = e.pageY
  }
  onMounted(() => {
    window.addEventListener('mousemove', update)
  })
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  })
  return { x, y }
}

// in consuming component
const Component = {
  setup() {
    const { x, y } = useMouse()
    const { z } = useOtherLogic()
    return { x, y, z }
  },
  template: `<div>{{ x }} {{ y }} {{ z }}</div>`
}
```
可以看到，useMouse 将所有与 “处理鼠标位置” 相关的逻辑都封装了进去，乍一看与 React Hooks 很像，但是有两个区别：

useMouse 函数内改变 x、y 后，不会重新触发 setup 执行。
x y 拿到的都是 Wrapper 而不是原始值，且这个值会动态变化。

另一个重要 API 就是 watch，它的作用类似 React Hooks 的 useEffect，但实现原理和调用时机其实完全不一样。
watch 的目的是监听某些变量变化后执行逻辑，比如当 id 变化后重新取数：
const MyComponent = {
  props: {
    id: Number
  },
  setup(props) {
    const data = value(null)
    watch(() => props.id, async (id) => {
      data.value = await fetchData(id)
    })
  }
}
复制代码之所以要 watch，因为在 Vue 中，setup 函数仅执行一次，所以不像 React Function Component，每次组件 props 变化都会重新执行，因此无论是在变量、props 变化时如果想做一些事情，都需要包裹在 watch 中。

后面还有 unwatching、生命周期函数、依赖注入，都是一些语法定义[自定义hooks的api](https://github.com/vuejs/rfcs/blob/function-apis/active-rfcs/0000-function-api.md#dependency-injection)

# Vue 和 React 对于事件处理的不同

从事件 API 上我们就能看出前端框架在设计的一个不同思路： React 设计是改变开发者，提供强大而复杂的机制，开发者按照我的来；Vue 是适应开发者，让开发者怎么爽怎么来。

vue没有事件合成只是单纯的bind绑定当前组件

# 预编译优化

Vue3.0的预编译优化

之所以能够做到预编译优化，是因为 Vue core 可以静态分析 template，在解析模版时，整个 parse 的过程是利用正则表达式顺序解析模板，当解析到开始标签、闭合标签、文本的时候都会分别执行对应的回调函数，来达到构造 AST 树的目的。

React 能否像 Vue 那样进行预编译优化？？？

Vue 需要做数据双向绑定，需要进行数据拦截或代理，那它就需要在预编译阶段静态分析模版，分析出视图依赖了哪些数据，进行响应式处理。而 React 就是局部重新渲染，React 拿到的或者说掌管的，所负责的就是一堆递归 React.createElement 的执行调用，它无法从模版层面进行静态分析。

因此 React JSX 过度的灵活性导致运行时可以用于优化的信息不足。但是，在 React 框架之外，我们作为开发者还是可以通过工程化手段达到类似的目的，因为我们能够接触到 JSX 编译成 React.createElement 的整个过程。开发者在项目中开发 babel 插件，实现 JSX 编译成 React.createElement，那么优化手段就是是从编写 babel 插件开始：



