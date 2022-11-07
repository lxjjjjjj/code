[原文链接](https://juejin.cn/post/6993115621160386590)
混入(mixin) 的时机, 什么时候 混入(mixin) ？
混入(mixin) 对于不同情况的策略：混入(mixin) 的策略是什么？

函数叠加混入（data、provide）
数组叠加混入（hook、watch）
原型链叠加混入（components，filters，directives）
对象覆盖混入（props，methods，computed，inject ）
替换覆盖混入（el，template，propData）

## 基础全局 options 是什么
基础 options 就是：components、directives、filters 三兄弟，这三兄弟在初始化全局 API 的时候就设置在 Vue.options 上。所以这三个是最先存在全局 options。
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bdcaf0b06cf24ed483e4b4523cb50d39~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

## 什么时候混入？
### 全局 mixin 和 基础全局 options 混入
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0428d57e16247339027049f156bca0b~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

[源码流程](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b15018ba860d41ada2f66ba9164a5e39~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

不过全局混入，需要注意的是，混入的操作应该是在初始化实例之前，而不是之后，这样混入 (mixin) 才能合并上你的自定义 options。

### 自定义 options 和 基础全局 options 混入
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c2708daafb7a4fa8b1cc540b2fb280bd~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

[混入流程](https://juejin.cn/post/6993115621160386590)

每一个组件在初始化的时候都会生成一个 vm (组件实例)。在创建组件实例之前，全局注册的 options，其实会被传递引用到每个组件中，目的是将和 全局 options 和 组件 options 合并起来，组件便能访问到全局选项。所以的时机就是创建好组件实例之前。
对于全局注册的 options ，Vue 背后偷偷给组件都合并一个全局选项的引用。但是为保证全局 options 不被污染，又不可能每个组件都深度克隆一份全局选项导致开销过大，所以会根据不同的选项，做不同的处理。下面我们就来看看混入合并的策略是什么？

## 混入 (mixin) 的策略是什么？
在这之前，回到上面的两种混入，我们发现混入合并最后都调用了 mergeOptions 这个方法。这个方法就是混入的重点。

本文带大家一起探索了 Vue mixin 的策略，在不同场景有不同的混入策略，涉及到 data、provide、钩子函数、watch、component、directives、filters、props、computed、methods、inject、el、template、propData 。从混入的方式来说，我们可以总结为 5 个大的方向：

### 函数叠加混入（data、provide）
两个 data 函数合并成一个函数返回，data 函数执行返回的数据对象也进行合并。函数合并为一个函数返回数据合并，优先级高的被应用。
组件 data > 组件 mixin data > 组件 mixin -mixin data > ... > 全局 mixin data。
### 数组叠加混入（hook、watch）
watch 的混入策略和 hook 的混入策略思想是一致的，都是按照
[
    全局 mixin watch，
    ... ,
    组件 mixin-mixin watch，
    组件 mixin watch，
    组件 watch
]
这个顺序混入合并 watch, 最后执行的时候顺序执行（注意：虽然混入测试和 hook 一样，但是底层实现还是不一样的，这里就不贴源码了）。

### 原型链叠加混入（components，filters，directives）
```
// 中转函数
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    return extend(res, childVal)
  } else {
    return res
  }
}

// 为 component、directives、filters 绑定回调
ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

//
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
```
### 对象覆盖混入（props，methods，computed，inject ）
简单的对象合并，key 值相同，优先级高的覆盖优先级低的。组件 对象 > 组件 mixin 对象 > 组件 mixin -mixin 对象 > ... > 全局 mixin 对象。

### 替换覆盖混入（el，template，propData）


