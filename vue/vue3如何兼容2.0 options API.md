[原文链接](https://juejin.cn/post/7057808594778980382)

# options 和 composition 共存
```
<body>
  <div id="app">
    <p>{{ msg }}</p>
    <p>{{ msg }}</p>
  </div>
  <script>
    const app = Vue.createApp({
      data() {
        return {
          msg: "I'm from data"
        }
      },
      setup(props, { emit, slots, attrs }) {
        const msg = Vue.ref("I'm from setup")
        return {  
          msg
        }
      }
    })
    app.mount('#app')
  </script>
</body>

```
可以看到data和setup中的数据都被渲染到了页面上，证明Options API和Composition API中的数据可以共存
此时看到渲染的是setup中的数据，因此可以判定：如果存在数据冲突，setup的优先级比较高

在前文 Vue3.0源码学习——Composition API 中学习了 Compostion API 执行的过程，兼容Vue2 Options API 也是在这个过程中做的


回顾一下流程

组件实例初始化执行 setupComponent
执行 setupStatefulComponent 返回 setup选项返回值



着重看一下 setupStatefulComponent 函数，位置 packages\runtime-core\src\component.ts
在第 1. create public instance / render proxy 这步对 instance.ctx 做了一层代理，在 new Proxy 的第二个参数传入的 PublicInstanceProxyHandlers 既是对数据的拦截操作
```
function setupStatefulComponent(
  instance: ComponentInternalInstance,
  isSSR: boolean
) {
  const Component = instance.type as ComponentOptions
  ...
  // 0. create render proxy property access cache
  instance.accessCache = Object.create(null)
  // 1. create public instance / render proxy
  // 创建公共实例/渲染函数的代理
  // also mark it raw so it's never observed
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers))
  ...
  // 2. call setup()
  const { setup } = Component
  // 如果用户设置了setup函数
  if (setup) {
    // 创建setup函数的上下文对象
    const setupContext = (instance.setupContext =
      setup.length > 1 ? createSetupContext(instance) : null)
    
    // 设置当前组件的实例，就可以通过 Vue.getCurrentInstance 拿到实例
    setCurrentInstance(instance)
    // 暂停跟踪，提高性能
    pauseTracking()
    // 通过 callWithErrorHandling 调用setup(), 可以捕获异常
    const setupResult = callWithErrorHandling(
      setup,
      instance,
      ErrorCodes.SETUP_FUNCTION,
      // 这里就是setup()的参数 props, ctx上下文
      [__DEV__ ? shallowReadonly(instance.props) : instance.props, setupContext]
    )
    resetTracking()
    unsetCurrentInstance()

    if (isPromise(setupResult)) {
      ...
    } else {
      // 如果setup()返回的不是一个Promise,则执行结果处理函数
      handleSetupResult(instance, setupResult, isSSR)
    }
  } else {
    ...
  }
}

```
PublicInstanceProxyHandlers，位置 packages\runtime-core\src\componentPublicInstance.ts，摘选主要部分并做了注释
```
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: ComponentRenderContext, key: string) {
    // ctx 实例上下文
    // setupState setup函数返回值
    // data data函数的返回值
    const { ctx, setupState, data, props, accessCache, type, appContext } =
      instance

    ...

    // data / props / ctx
    // This getter gets called for every property access on the render context
    // during render and is a major hotspot. The most expensive part of this
    // is the multiple hasOwn() calls. It's much faster to do a simple property
    // access on a plain object, so we use an accessCache object (with null
    // prototype) to memoize what access type a key corresponds to.
    let normalizedProps
    if (key[0] !== '$') { // key值不以$开头，是用户设置属性
      const n = accessCache![key]
      
      if (n !== undefined) { // 有缓存情况
        switch (n) {
          // 首先从setupState中获取
          case AccessTypes.SETUP:
            return setupState[key]
          // 其次从data返回值中获取
          case AccessTypes.DATA:
            return data[key]
          // 再次是组件上下文
          case AccessTypes.CONTEXT:
            return ctx[key]
          // 最后从组件属性中获取
          case AccessTypes.PROPS:
            return props![key]
          // default: just fallthrough
        }
      } else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) { // 没缓存优先setupState
        accessCache![key] = AccessTypes.SETUP // 加入缓存
        return setupState[key]
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) { // 没缓存第二顺位data
        accessCache![key] = AccessTypes.DATA
        return data[key]
      } else if (
        // only cache other properties when instance has declared (thus stable)
        // props
        (normalizedProps = instance.propsOptions[0]) &&
        hasOwn(normalizedProps, key)
      ) {
        accessCache![key] = AccessTypes.PROPS
        return props![key]
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache![key] = AccessTypes.CONTEXT
        return ctx[key]
      } else if (!__FEATURE_OPTIONS_API__ || shouldCacheAccess) {
        accessCache![key] = AccessTypes.OTHER
      }
    }

    ...
  },

  ...
}
```
# 小结

源码对对组件实例上下文 instance.ctx 做代理，在 PublicInstanceProxyHandlers 的proxy get 拦截中，优先从 setupState 中获取也就是 setup的返回值，其次 data，最后 props


