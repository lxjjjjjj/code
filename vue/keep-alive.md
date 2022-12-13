# 总结
keep-alive属于vue的内置组件，会有单独的abstract标识，这个标识不会让内置组件真实的出现在组件链中，在keep-alive组件内部执行render方法，如果不会缓存，则取slot的第一个组件，如果命中缓存，那么返回缓存中的vnode，每一次渲染都会更新组件在缓存的位置，在设置了缓存组件长度的情况下，如果缓存个数超过限制就会删除缓存数组中靠后的一个key值。对于使用了keep-alive包裹的组件首次渲染时并不会与其他组件有任何区别，因为会标识渲染的子组件的keepAlive为true，但是此时vnode.componentInstance时undefined所以不满足，所以会挂载组件，如果是第二次挂载，在 patch 的过程中会执行 patchVnode 的逻辑，它会对比新旧 vnode 节点，甚至对比它们的子节点去做更新逻辑，但是对于keep-alive组件 vnode 而言，是没有 children 的，那么对于 <keep-alive> 组件而言，如何更新它包裹的内容呢？原来 patchVnode 在做各种 diff 之前，有keepAlive=true的组件会先执行 prepatch 的钩子函数，对于keep-alive组件来说，检测到有slots组件会执行forthUpdate也就是重新执行render，取缓存中的vnode渲染。并且更新vnode的keepAlive属性为true，在组件的update的时候命中prepatch然后更新子组件。并且有keepAlive是true的组件不会在destory生命周期被销毁。

如果是缓存过的组件就不会再执行create和mounted生命周期，只会执行attached生命周期。
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
# 内置组件keep-alive的代码实现
```
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created () {
    this.cache = Object.create(null)
    this.keys = []
  },

  destroyed () {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted () {
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  render () {
    const slot = this.$slots.default
    const vnode: VNode = getFirstComponentChild(slot)
    const componentOptions: ?VNodeComponentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name: ?string = getComponentName(componentOptions)
      const { include, exclude } = this
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode // 不在include里在exclude里 返回slot的第一个元素
      }

      const { cache, keys } = this

      // same constructor may get registered as different local components
      // so cid alone is not enough (#3269)

      const key: ?string = vnode.key == null
        ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
        : vnode.key
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance
        // make current key freshest
        remove(keys, key)
        keys.push(key)
      } else {
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
```
# 实现
keep-alive作为一个抽象组件，在建立父子关系的时候会利用组件的abstract属性，不将keep-alive渲染在dom上。

可以看到 <keep-alive> 组件的实现也是一个对象，注意它有一个属性 abstract 为 true，是一个抽象组件，Vue 的文档没有提这个概念，实际上它在组件实例建立父子关系的时候会被忽略，发生在 initLifecycle 的过程中：

```
// locate first non-abstract parent
let parent = options.parent
if (parent && !options.abstract) {
  while (parent.$options.abstract && parent.$parent) {
    parent = parent.$parent
  }
  parent.$children.push(vm)
}
vm.$parent = parent
```

keep-alive的render方法和普通的组件render方法不同，通过slot获取到第一个子组件之后，看是否符合缓存策略，如果没有命中那么直接返回vnode，否则走如下的缓存逻辑，如果cache缓存中有vnode那么就直接取缓存的vnode，并且将key删除，将新的key push到数组结尾。如果缓存没有那么就新增cache数据，并且新增key，并且当keys.length大于max的值的时候，就删除数组第一个值。最远没有使用过的值（LRU缓存策略）

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
```
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
```
createComponent 定义了 isReactivated 的变量，它是根据 vnode.componentInstance 以及 vnode.data.keepAlive 的判断，第一次渲染的时候，vnode.componentInstance 为 undefined，vnode.data.keepAlive 为 true，因为它的父组件 <keep-alive> 的 render 函数会先执行，那么该 vnode 缓存到内存中，并且设置 vnode.data.keepAlive 为 true，因此 isReactivated 为 false，那么走正常的 init 的钩子函数执行组件的 mount。当 vnode 已经执行完 patch 后，执行 initComponent 函数：
```
function initComponent (vnode, insertedVnodeQueue) {
  if (isDef(vnode.data.pendingInsert)) {
    insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
    vnode.data.pendingInsert = null
  }
  vnode.elm = vnode.componentInstance.$el
  if (isPatchable(vnode)) {
    invokeCreateHooks(vnode, insertedVnodeQueue)
    setScope(vnode)
  } else {
    // empty component root.
    // skip all element-related modules except for ref (#3455)
    registerRef(vnode)
    // make sure to invoke the insert hook
    insertedVnodeQueue.push(vnode)
  }
}
```
对于首次渲染而言，除了在 <keep-alive> 中建立缓存，和普通组件渲染没什么区别。

所以对我们的例子，初始化渲染 A 组件以及第一次点击 switch 渲染 B 组件，都是首次渲染。

## 缓存渲染
当我们从 B 组件再次点击 switch 切换到 A 组件，就会命中缓存渲染。

我们之前分析过，当数据发送变化，在 patch 的过程中会执行 patchVnode 的逻辑，它会对比新旧 vnode 节点，甚至对比它们的子节点去做更新逻辑，但是对于组件 vnode 而言，是没有 children 的，那么对于 <keep-alive> 组件而言，如何更新它包裹的内容呢？

原来 patchVnode 在做各种 diff 之前，会先执行 prepatch 的钩子函数，它的定义在 src/core/vdom/create-component 中：判断如果是keep-alive组件会执行prepatch更新，调用updateChildrenComponents方法，触发 <keep-alive> 组件实例 $forceUpdate 逻辑，也就是重新执行 <keep-alive> 的 render 方法。计算是否缓存过组件。

```
var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },

    prepatch: function prepatch (oldVnode, vnode) {
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },

    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },

    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {
          componentInstance.$destroy();
        } else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };
  function deactivateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return
      }
    }
    if (!vm._inactive) {
      vm._inactive = true;
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      callHook(vm, 'deactivated');
    }
  }
```
prepatch 核心逻辑就是执行 updateChildComponent 方法，它的定义在 src/core/instance/lifecycle.js 中：
```
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
```
updateChildComponent 方法主要是去更新组件实例的一些属性，这里我们重点关注一下 slot 部分，由于 <keep-alive> 组件本质上支持了 slot，所以它执行 prepatch 的时候，需要对自己的 children，也就是这些 slots 做重新解析，并触发 <keep-alive> 组件实例 $forceUpdate 逻辑，也就是重新执行 <keep-alive> 的 render 方法，这个时候如果它包裹的第一个组件 vnode 命中缓存，则直接返回缓存中的 vnode.componentInstance，在我们的例子中就是缓存的 A 组件，接着又会执行 patch 过程，再次执行到 createComponent 方法，我们再回顾一下：
```
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
```
这个时候 isReactivated 为 true，并且在执行 init 钩子函数的时候不会再执行组件的 mount 过程了，相关逻辑在 src/core/vdom/create-component.js 中：
```
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },
  // ...
}
```
这也就是被 <keep-alive> 包裹的组件在有缓存的时候就不会在执行组件的 created、mounted 等钩子函数的原因了。回到 createComponent 方法，在 isReactivated 为 true 的情况下会执行 reactivateComponent 方法：
```
var emptyNode = new VNode('', {}, []);
function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i;
      // hack for #4339: a reactivated component with inner transition
      // does not trigger because the inner node's created hooks are not called
      // again. It's not ideal to involve module-specific logic in here but
      // there doesn't seem to be a better way to do it.
      var innerNode = vnode;
      while (innerNode.componentInstance) {
        innerNode = innerNode.componentInstance._vnode;
        if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
          for (i = 0; i < cbs.activate.length; ++i) {
            cbs.activate[i](emptyNode, innerNode);
          }
          insertedVnodeQueue.push(innerNode);
          break
        }
      }
      // unlike a newly created component,
      // a reactivated keep-alive component doesn't insert itself
      insert(parentElm, vnode.elm, refElm);
    }
```
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