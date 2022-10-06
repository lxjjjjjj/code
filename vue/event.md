```
let Child = {
  template: '<button @click="clickHandler($event)">' +
  'click me' +
  '</button>',
  methods: {
    clickHandler(e) {
      console.log('Button clicked!', e)
      this.$emit('select')
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child @select="selectHandler" @click.native.prevent="clickHandler"></child>' +
  '</div>',
  methods: {
    clickHandler() {
      console.log('Child clicked!')
    },
    selectHandler() {
      console.log('Child select!')
    }
  },
  components: {
    Child
  }
})
```
Vue 支持 2 种事件类型，原生 DOM 事件和自定义事件，它们主要的区别在于添加和删除事件的方式不一样，并且自定义事件的派发是往当前实例上派发，但是可以利用在父组件环境定义回调函数来实现父子组件的通讯。另外要注意一点，只有组件节点才可以添加自定义事件，并且添加原生 DOM 事件需要使用 native 修饰符；而普通元素使用 .native 修饰符是没有作用的，也只能添加原生 DOM 事件。原生DOM事件和自定义事件在编译过程中就会被区分出来，之后进入组件渲染阶段，原生DOM事件是发生在组件渲染内部，但是自定义事件是发生在子组件内部，并且原生DOM事件的add和remove是通过addEventListener和removeEventListener实现，但是自定义事件是通过事件中心的通信实现绑定和执行一次等功能

# 实现
在编译模版的过程中，在对标签属性的处理过程中，判断如果是指令，首先通过 parseModifiers 解析出修饰符，然后判断如果是事件的指令，则执行 addHandler(el, name, value, modifiers, false, warn) 方法，addHandler 函数看起来长，实际上就做了 3 件事情，首先根据 modifier 修饰符对事件名 name 做处理，接着根据 modifier.native 判断是一个纯原生事件还是普通事件，分别对应 el.nativeEvents 和 el.events，最后按照 name 对事件做归类，并把回调函数的字符串保留到对应的事件中。

在我们的例子中，父组件的 child 节点生成的 el.events 和 el.nativeEvents 如下
```
el.events = {
  select: {
    value: 'selectHandler'
  }
}

el.nativeEvents = {
  click: {
    value: 'clickHandler',
    modifiers: {
      prevent: true
    }
  }
}
```
子组件的 button 节点生成的 el.events 如下：
```
el.events = {
  click: {
    value: 'clickHandler($event)'
  }
}
```

然后在 codegen 的阶段，会在 genData 函数中根据 AST 元素节点上的 events 和 nativeEvents 生成 data 数据，它的定义在 src/compiler/codegen/index.js 中：
```
export function genData (el: ASTElement, state: CodegenState): string {
  let data = '{'
  // ...
  if (el.events) {
    data += `${genHandlers(el.events, false, state.warn)},`
  }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true, state.warn)},`
  }
  // ...
  return data
}
```
genHandlers 方法遍历事件对象 events，对同一个事件名称的事件调用 genHandler(name, events[name]) 方法，它的内容看起来多，但实际上逻辑很简单，首先先判断如果 handler 是一个数组，就遍历它然后递归调用 genHandler 方法并拼接结果，然后判断 hanlder.value 是一个函数的调用路径还是一个函数表达式， 接着对 modifiers 做判断，对于没有 modifiers 的情况，就根据 handler.value 不同情况处理，要么直接返回，要么返回一个函数包裹的表达式；对于有 modifiers 的情况，则对各种不同的 modifer 情况做不同处理，添加相应的代码串。

那么对于我们的例子而言，父组件生成的 data 串为：
```
{
  on: {"select": selectHandler},
  nativeOn: {"click": function($event) {
      $event.preventDefault();
      return clickHandler($event)
    }
  }
}
```
子组件生成的 data 串为：
```
{
  on: {"click": function($event) {
      clickHandler($event)
    }
  }
}
```

### 对于原生DOM事件
updateListeners 的逻辑很简单，遍历 on 去添加事件监听，遍历 oldOn 去移除事件监听，关于监听和移除事件的方法都是外部传入的，因为它既处理原生 DOM 事件的添加删除，也处理自定义事件的添加删除。add 和 remove 的逻辑很简单，就是实际上调用原生 addEventListener 和 removeEventListener，并根据参数传递一些配置，注意这里的 hanlder 会用 withMacroTask(hanlder) 包裹一下，它的定义在 src/core/util/next-tick.js，实际上就是强制在 DOM 事件的回调函数执行期间如果修改了数据，那么这些数据更改推入的队列会被当做 macroTask 在 nextTick 后执行。

### 对于自定义事件
在 render 阶段，如果是一个组件节点，则通过 createComponent 创建一个组件 vnode，我们再来回顾这个方法，定义在 src/core/vdom/create-component.js 中：
```
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  // ...
  const listeners = data.on
  
  data.on = data.nativeOn
  
  // ...
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  return vnode
}
```
我们只关注事件相关的逻辑，可以看到，它把 data.on 赋值给了 listeners，把 data.nativeOn 赋值给了 data.on，这样所有的原生 DOM 事件处理跟我们刚才介绍的一样，它是在当前组件环境中处理的。而对于自定义事件，我们把 listeners 作为 vnode 的 componentOptions 传入，它是在子组件初始化阶段中处理的，所以它的处理环境是子组件。然后在子组件的初始化的时候，拿到了父组件传入的 listeners，然后在执行 initEvents 的过程中，会处理这个 listeners，定义在 src/core/instance/events.js 中：updateListeners 我们之前介绍过，所以对于自定义事件和原生 DOM 事件处理的差异就在事件添加和删除的实现上，来看一下自定义事件 add 和 remove 的实现：实际上是利用 Vue 定义的事件中心，简单分析一下它的实现：非常经典的事件中心的实现，把所有的事件用 vm._events 存储起来，当执行 vm.$on(event,fn) 的时候，按事件的名称 event 把回调函数 fn 存储起来 vm._events[event].push(fn)。当执行 vm.$emit(event) 的时候，根据事件名 event 找到所有的回调函数 let cbs = vm._events[event]，然后遍历执行所有的回调函数。当执行 vm.$off(event,fn) 的时候会移除指定事件名 event 和指定的 fn 当执行 vm.$once(event,fn) 的时候，内部就是执行 vm.$on，并且当回调函数执行一次后再通过 vm.$off 移除事件的回调，这样就确保了回调函数只执行一次。
```
export function initEvents (vm: Component) {
  vm._events = Object.create(null)
  vm._hasHookEvent = false
  // init parent attached events
  const listeners = vm.$options._parentListeners
  if (listeners) {
    updateComponentListeners(vm, listeners)
  }
}

let target: any
export function updateComponentListeners (
  vm: Component,
  listeners: Object,
  oldListeners: ?Object
) {
  target = vm
  updateListeners(listeners, oldListeners || {}, add, remove, vm)
  target = undefined
}
function add (event, fn, once) {
  if (once) {
    target.$once(event, fn)
  } else {
    target.$on(event, fn)
  }
}

function remove (event, fn) {
  target.$off(event, fn)
}
```
```
export function eventsMixin (Vue: Class<Component>) {
  const hookRE = /^hook:/
  Vue.prototype.$on = function (event: string | Array<string>, fn: Function): Component {
    const vm: Component = this
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$on(event[i], fn)
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn)
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true
      }
    }
    return vm
  }

  Vue.prototype.$once = function (event: string, fn: Function): Component {
    const vm: Component = this
    function on () {
      vm.$off(event, on)
      fn.apply(vm, arguments)
    }
    on.fn = fn
    vm.$on(event, on)
    return vm
  }

  Vue.prototype.$off = function (event?: string | Array<string>, fn?: Function): Component {
    const vm: Component = this
    // all
    if (!arguments.length) {
      vm._events = Object.create(null)
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        this.$off(event[i], fn)
      }
      return vm
    }
    // specific event
    const cbs = vm._events[event]
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null
      return vm
    }
    if (fn) {
      // specific handler
      let cb
      let i = cbs.length
      while (i--) {
        cb = cbs[i]
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i, 1)
          break
        }
      }
    }
    return vm
  }

  Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase()
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._events[event]
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs
      const args = toArray(arguments, 1)
      for (let i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args)
        } catch (e) {
          handleError(e, vm, `event handler for "${event}"`)
        }
      }
    }
    return vm
  }
}
```