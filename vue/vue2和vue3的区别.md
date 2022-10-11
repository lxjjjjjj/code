[原文链接](https://juejin.cn/post/6946770942085300254)
# 响应式更新的原理
vue2使用Object.defineProperty()实现响应式原理，而vue3使用Proxy()实现。

## 虽然vue2，vue3面对对象嵌套，都需要递归，但vue2是对对象的所有属性进行递归，vue3是按需递归，如果没有使用到内部对象的属性，就不需要递归，性能更好。

虽然vue2中对于收集依赖也有限制，就是Dep.target。但是每个组件中的data对象的不同对象都有一个dep对象，所有收集的effect是收集到这个dep对象下的。

但是vue3建立了一个depsMap对象，然后effect是收集在data每个对象的属性key下的。所以可以做到收集依赖的时候做到按需递归，没有更改的属性key就不递归，性能更好。

vue2
```
export function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  const dep = new Dep()
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    }
  })
}
```
```
function track(target, key) {
    // 对象属性修改了才会执行收集依赖，否则没必要执行。因为表示没有地方用到对象及其属性
    if(!activeEffect) return 
    let depsMap = bucket.get(target)
    if(!depsMap){
        bucket.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if(!deps){
        // 将effect收集到data对象下的每个key下面
        deps.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)
    activeEffect.deps.push(deps)
}
function effect(fn, options = {}) {
    // 在内部创建effectFn的原因是可以统一处理effect的添加
    const effectFn = () => {
        // 在每次effect函数执行之前都要清空effect的deps依赖，
        // deps内也清空effect以便于在effect执行的时候deps重新收集新的effects依赖
        // 减少不必要的更新 比如<div v-if="{{obj.show}}">{{obj.text}}</div>
        // 当obj.show变成false 就无需因为obj.text的更新而重新渲染了
        cleanup(effectFn)
        // 同一时刻用activeEffect做为全局变量存储的副作用函数只有一个，当副作用函数发生嵌套的时候
        // 内层副作用函数的执行会覆盖activeEffect值，不会恢复到原来的值
        // 如果再有响应式数据进行依赖收集
        // 即使这个响应式数据是在外层副作用函数中读取的，他们收集的副作用函数永远是内层副作用函数
        // effect嵌套案例 const data = { foo: 1, bar: 2 }
        // const obj = new Proxy(data, {/**/})
        // effect(function effectFn(){
        //     console.log('effectFn1')
        //     effect(function effectFn2(){
        //         console.log('effectFn2')
        //         temp2 = obj.bar
        //     })
        //     temp1 = obj.foo
        // })
        activeEffect = effectFn
        effectStack.push(effectFn)
        // 处理computed的getter拿到值的功能
        const res = fn()
        effectStack.pop()
        // 最后的effectStack内的元素永远都会是最外层的effect，因为此时最外层的effectFn()还没执行 
        activeEffect = effectStack[effectStack.length - 1]
        return res
    }
    effectFn.options = options
    effectFn.deps = []
    if(!options.lazy){
        effectFn()
    } else {
        return effectFn
    }
}
```
## 对没有的属性的添加、和本来属性的删除动作的监测。
  ownKeys可以拦截对于for...in的遍历使用操作
  has拦截对象的in操作
  proxy的set本身就可以拦截未添加的属性的添加操作
  deleteProperty拦截delete key的操作
## 对数组基于下标的修改、对于 .length 修改的监测。
## 对 Map、Set、WeakMap 和 WeakSet 的支持。

# diff方法优化
## vue3新增了静态标记（patchflag），虚拟节点对比时，就只会对比这些带有静态标记的节点
[PatchFlag类型](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ad833cbf5c724ab69f76154777c09fa0~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
```
<div>
  <div>{msg}</div>
  <div>静态文字</div>
</div>
```
上面的dom结构生成的vnode如下
```
export function render(_ctx, _cache, $props, $setup, $data, $options) {
 return (_openBlock(), _createBlock("div", null, [
  _createVNode("p", null, "'HelloWorld'"),
  _createVNode("p", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)
 
 ]))
}
```
在Vue3.0中，在这个模版编译时，编译器会在动态标签末尾加上 /* Text*/ PatchFlag。也就是在生成VNode的时候，同时打上标记，在这个基础上再进行核心的diff算法并且 PatchFlag 会标识动态的属性类型有哪些，比如这里的TEXT 表示只有节点中的文字是动态的。而patchFlag的类型也很多。其中大致可以分为两类：

1、当 patchFlag 的值「大于」 0 时，代表所对应的元素在 patchVNode 时或 render 时是可以被优化生成或更新的。
2、当 patchFlag 的值「小于」 0 时，代表所对应的元素在 patchVNode 时，是需要被 full diff，即进行递归遍历 VNode tree 的比较更新过程。

Vue3.0对于不参与更新的元素，做静态标记并提示，只会被创建一次，在渲染时直接复用。

vue3对于不参与更新的元素，会做静态提升，只会被创建一次，在渲染时直接复用即可。vue2无论元素是否参与更新，每次都会重新创建然后再渲染

## 双端diff算法和最长递增子序列结合处理
当发生以下情况则跳过比对，变为插入或删除操作：
1、组件的Type(Tagname)不一致，原因是绝大多数情况拥有相同type的两个组件将会生成相似的树形结构，拥有不同type的两个组件将会生成不同的树形结构，所以type不一致可以放弃继续比对。
2、列表组件的Key不一致，旧树中无新Key或反之。毕竟key是元素的身份id，能直接对应上是否是同一个节点。
3、对触发了getter/setter 的组件进行diff，精准减少diff范围

步骤一：从首部比较new vnode 和old vnode,如果碰到不同的节点，跳出循环，否则继续，直到一方遍历完成；
步骤二: 从尾部比较new vnode 和old vnode,如果碰到不同的节点，跳出循环，否则继续，直到一方遍历完成；
步骤三: 节点移动、新增或删除使用最长递增子序列的方法进行处理


一旦StartIdx>EndIdx表明oldCh和newCh至少有一个已经遍历完了，就会结束比较

如果遍历结束i > end1 && i < end2 那么表示仅有节点新增

如果遍历结束i > end1 && i > end2 那么表示仅有节点删除
# 事件侦听器缓存
[原文链接](https://juejin.cn/post/6874853357240975368)
默认情况下onClick会被视为动态绑定，所以每次都会追踪它的变化，但是因为是同一个函数，所以不用追踪变化，直接缓存起来复用即可
```
<div>
  <button @click = 'onClick'>点我</button>
</div>
```
```

export const render = /*#__PURE__*/_withId(function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createBlock("div", null, [
    _createVNode("button", { onClick: _ctx.onClick }, "点我", 8 /* PROPS */, ["onClick"])
    									     // PROPS=1<<3,// 8 //动态属性，但不包含类名和样式
  ]))
})

```
这里有一个8，表示着这个节点有了静态标记属于动态属性，有静态标记就会进行diff算法对比差异，所以会浪费时间
开启事件侦听器缓存之后：
```
export function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createBlock("div", null, [
    _createVNode("button", {
      onClick: _cache[1] || (_cache[1] = (...args) => (_ctx.onClick(...args)))
    }, "点我")
  ]))
}
```
可以发现，开启事件侦听器缓存后，没有静态标记了，这就快了好多嘛
# 按需引入，通过treeSharking 体积比vue2.x更小
所有内部方法都是按需引入，可以更好的treeshaking
# 组合API（类似react hooks），可以将data与对应的逻辑写到一起，更容易理解

之前处理相同data的逻辑分散在各个method中，现在可以将碎片化的代码合并在一个function中执行
# 提供了很灵活的api 比如toRef、shallowRef、readOnly等等，可以灵活控制数据变化是否需要更新ui渲染

# 更好的Ts支持

函数式编程对于ts静态编译更友好

