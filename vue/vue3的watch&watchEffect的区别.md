# wacth 和 watchEffect 的区别

你可以认为他们是同一个功能的两种不同形态，底层的实现是一样的。
watch- 显式指定依赖源，依赖源更新时执行回调函数
watchEffect - 自动收集依赖源，依赖源更新时重新执行自身

watch和watchEffect的底层都是effect收集依赖的副作用函数

[watch & watchEffect](https://juejin.cn/post/7109009230132150280)
### watch

```
watch(
  () => { /* 依赖源收集函数 */ },
  () => { /* 依赖源改变时的回调函数 */ }
)
这里的依赖源函数只会执行一次，回调函数会在每次依赖源改变的时候触发，但是并不对回调函数进行依赖收集。也就是说，依赖源和回调函数之间并不一定要有直接关系。
```
### WatchEffect

```
watchEffect 相当于将 watch 的依赖源和回调函数合并，当任何你有用到的响应式依赖更新时，该回调函数便会重新执行。不同于 watch，watchEffect 的回调函数会被立即执行（即 { immediate: true }）
watchEffect(
  () => { /* 依赖源同时是回调函数 */ }
)
```
以下两种行为基本等价
```
watchEffect(
  () => console.log(counter.value)
)

watch(
  () => counter.value,
  () => console.log(counter.value),
  { immediate: true }
)
```
与 watch 不同的一点是，在 watchEffect 中依赖源会被重复执行，动态新增加的依赖也会被收集，例如
```
const counter = ref(0)
const enabled = ref(false)

watchEffect(() => {
  if (enabled.value)
    console.log(counter.value)
})

// (以下忽略 nextTick)

// watchEffect 会被立即执行，因为 “enabled“ 为 false, 此时仅收集到 “enabled“ 依赖
counter.value += 1 // 无反应

enabled.value = true // Effect 触发，控制台出 "1"
counter.value += 1 // “counter“ 被作为新的依赖被收集，控制台出 "2"

enabled.value = false // 函数被重新执行，无输出
counter.value += 1 // 函数被重新执行，无输出 (虽然 counter 已经没有用了，但是作为依赖还是会触发函数）
```
watch 和 watchEffect 都能监听响应式数据的变化，不同的是它们监听数据变化的方式不同。
watch 会明确监听某一个响应数据，而 watchEffect 则是隐式的监听回调函数中响应数据。
watch 在响应数据初始化时是不会执行回调函数的，watchEffect 在响应数据初始化时就会立即执行回调函数。

