# 是什么
<keep-alive> 是 Vue 源码中实现的一个组件，它能够把不活动的组件的实例保存在内存中，而不是直接的销毁，它是一个抽象组件，不会被渲染到真实DOM中，也不会出现在父组件链中

使用
```
<keep-alive include="a">
    <component></component>
</keep-alive>
//name名为a的组件会被缓存起来

<keep-alive exclude="a">
    <component></component>
</keep-alive>
//name名为a的组件将不会被缓存。
```
# 实现
keep-alive作为一个抽象组件，在建立父子关系的时候会利用组件的abstract属性，不将keep-alive渲染在dom上。
keep-alive的render方法和普通的组件render方法不同，通过slot获取到第一个子组件之后，看是否符合缓存策略，如果没有命中那么直接返回vnode，否则走如下的缓存逻辑，如果cache缓存中有vnode那么就直接取缓存的vnode，并且将key删除，将新的key push到数组结尾。如果缓存没有那么就新增cache数据，并且新增key，并且当keys.length大于max的值的时候，就删除数组第一个值。最远没有使用过的值（LRU缓存策略）
```
export default {
  name: 'keep-alive',
  // <keep-alive> 组件的实现也是一个对象，注意它有一个属性 abstract 为 true，是一个抽象组件
  // 为什么页面可以做到不挂载keep-alive组件就是通过这个属性在建立父子关系的时候忽略keep-alive
  // let parent = options.parent
  // if (parent && !options.abstract) {
  //  while (parent.$options.abstract && parent.$parent) {
  //      parent = parent.$parent
  //  }
  //  parent.$children.push(vm)
  //  }
  //  vm.$parent = parent
  abstract: true,

  props: {
    // include 表示只有匹配的组件会被缓存
    include: patternTypes,
    // exclude 表示任何匹配的组件都不会被缓存
    exclude: patternTypes,
    // props 还定义了 max，它表示缓存的大小，因为我们是缓存的 vnode 对象，它也会持有 DOM，当我们缓存很多的时候，会比较占用内存，所以该配置允许我们指定缓存大小。
    max: [String, Number]
  },

  created () {
    // 缓存已经创建过的 vnode
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    // 观测 include 和 exclude 的变化，对缓存做处理
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },
  // 直接实现了 render 函数，而不是我们常规模板的方式，执行 <keep-alive> 组件渲染的时候，就会执行到这个 render 函数
  render () {
    // 首先获取第一个子元素的 vnode 由于我们也是在 <keep-alive> 标签内部写 DOM，所以可以先获取到它的默认插槽，然后再获取到它的第一个子节点。
    // <keep-alive> 只处理第一个子元素，所以一般和它搭配使用的有 component 动态组件或者是 router-view
    const slot = this.$slots.default
    const vnode: VNode = getFirstComponentChild(slot)
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      // 我们平时传的 include 和 exclude 可以是这三种类型的任意一种。并且我们的组件名如果满足了配置 include 且不匹配或者是配置了 exclude 且匹配，那么就直接返回这个组件的 vnode，否则的话走下一步缓存
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      const key: ?string = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // 如果命中缓存，则直接从缓存中拿 vnode 的组件实例，并且重新调整了 key 的顺序放在了最后一个
        remove(keys, key)
        keys.push(key)
      } else { 
        // 否则把 vnode 设置进缓存，最后还有一个逻辑，如果配置了 max 并且缓存的长度超过了 this.max，还要从缓存中删除第一个
        cache[key] = vnode
        keys.push(key)
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
      }

      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
// matches 的逻辑很简单，就是做匹配，分别处理了数组、字符串、正则表达式的情况
function matches (pattern: string | RegExp | Array<string>, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}

function pruneCacheEntry (
  cache: VNodeCache,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const cached = cache[key]
  if (cached && (!current || cached.tag !== current.tag)) {
    // 除了从缓存中删除外，还要判断如果要删除的缓存并的组件 tag 不是当前渲染组件 tag，也执行删除缓存的组件实例的 $destroy 方法。
    cached.componentInstance.$destroy()
  }
  cache[key] = null 
  remove(keys, key)
}
```
# 组件渲染
到此为止，我们只了解了 <keep-alive> 的组件实现，但并不知道它包裹的子组件渲染和普通组件有什么不一样的地方。我们关注 2 个方面，首次渲染和缓存渲染。
```
let A = {
  template: '<div class="a">' +
  '<p>A Comp</p>' +
  '</div>',
  name: 'A'
}

let B = {
  template: '<div class="b">' +
  '<p>B Comp</p>' +
  '</div>',
  name: 'B'
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<keep-alive>' +
  '<component :is="currentComp">' +
  '</component>' +
  '</keep-alive>' +
  '<button @click="change">switch</button>' +
  '</div>',
  data: {
    currentComp: 'A'
  },
  methods: {
    change() {
      this.currentComp = this.currentComp === 'A' ? 'B' : 'A'
    }
  },
  components: {
    A,
    B
  }
})
```
## 首次渲染
我们知道 Vue 的渲染最后都会到 patch 过程，而组件的 patch 过程会执行 createComponent 方法。它的父组件 <keep-alive> 的 render 函数会先执行，那么该 vnode 缓存到内存中，并且设置 vnode.data.keepAlive 为 true

## 缓存渲染
当我们从 B 组件再次点击 switch 切换到 A 组件，就会命中缓存渲染。

我们之前分析过，当数据发送变化，在 patch 的过程中会执行 patchVnode 的逻辑，它会对比新旧 vnode 节点，甚至对比它们的子节点去做更新逻辑，但是对于组件 vnode 而言，是没有 children 的，那么对于 <keep-alive> 组件而言，如何更新它包裹的内容呢？原来 patchVnode 在做各种 diff 之前，会先执行 prepatch 的钩子函数,由于 <keep-alive> 组件本质上支持了 slot，所以它执行 prepatch 的时候，需要对自己的 children，也就是这些 slots 做重新解析，并触发 <keep-alive> 组件实例 $forceUpdate 逻辑，也就是重新执行 <keep-alive> 的 render 方法，这个时候如果它包裹的第一个组件 vnode 命中缓存，则直接返回缓存中的 vnode.componentInstance，在我们的例子中就是缓存的 A 组件，接着又会执行 patch 过程，再次执行到 createComponent 方法,这个时候 isReactivated 为 true（isReactivated属性是通过判断是否有组件实例和组件的keepAlive值是否为true判断），并且在执行 init 钩子函数的时候不会再执行组件的 mount 过程了,能看出在reactivateComponent方法内只会执行实例的activate生命周期

### 总结
keep-alive通过自定义 render 函数并且利用了插槽(slot)，组件包裹的子元素——也就是插槽(slot)是是通过<keep-alive>的prepatch方法中调用$forthUpdate执行render函数，slot组件执行createComponent做更新的，如果是缓存过的组件就不会再执行create和mounted生命周期，只会执行attached生命周期
```
const componentVNodeHooks = {
  prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },
  // ...
}
export function updateChildComponent (
  vm: Component,
  propsData: ?Object,
  listeners: ?Object,
  parentVnode: MountedComponentVNode,
  renderChildren: ?Array<VNode>
) {
  const hasChildren = !!(
    renderChildren ||          
    vm.$options._renderChildren ||
    parentVnode.data.scopedSlots || 
    vm.$scopedSlots !== emptyObject 
  )

  // ...
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context)
    vm.$forceUpdate()
  }
}
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, false /* hydrating */)
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue)
      insert(parentElm, vnode.elm, refElm)
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
      }
      return true
    }
  }
}
function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  let i
  // hack for #4339: a reactivated component with inner transition
  // does not trigger because the inner node's created hooks are not called
  // again. It's not ideal to involve module-specific logic in here but
  // there doesn't seem to be a better way to do it.
  let innerNode = vnode
  while (innerNode.componentInstance) {
    innerNode = innerNode.componentInstance._vnode
    if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
      for (i = 0; i < cbs.activate.length; ++i) {
        cbs.activate[i](emptyNode, innerNode)
      }
      insertedVnodeQueue.push(innerNode)
      break
    }
  }
  // unlike a newly created component,
  // a reactivated keep-alive component doesn't insert itself
  insert(parentElm, vnode.elm, refElm)
}
```