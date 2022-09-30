[nextTick](https://juejin.cn/post/6974224013501399048)

nextTick为什么要优先使用微任务实现？
1）vue nextTick的源码实现，异步优先级判断，总结就是Promise > MutationObserver > setImmediate > setTimeout 
2）优先使用Promise，因为根据 event loop 与浏览器更新渲染时机，宏任务 →  微任务  →  渲染更新，使用微任务，本次event loop轮询就可以获取到更新的dom
3）如果使用宏任务，要到下一次event loop中，才能获取到更新的dom

# 大概实现
```
let pending = false
const tasks = []
const flushCallbacks = () => {
  pending = false
  tasks.forEach(task => task())
  tasks.length = 0
}
 
const p = Promise.resolve()
const timerFunc = () => {
  p.then(flushCallbacks)
}
 
function nextTick(task) {
  tasks.push(task)
  if (!pending) {
    pending = true
    timerFunc()
  }
}
```
在 flushCallbacks 中，我们看到了一个技巧，正常我们自己的简单实现中，是直接便利 callbacks 然后执行的，而 Vue 中则不是，他是复制了一份新的，然后循环执行的。
这么做的原因，其实是考虑了一种特殊情况，如果某一个 callback 执行的时候，又一次调用了 nextTick，进而更新了 callbacks，那这个时候的执行就不是我们所期望的了。所以需要先拷贝一份原有的，即使在 cb 中更新了 callbacks 也不影响我们的循环和执行，符合预期。


## vue的异步更新dom
Vue 在更新 DOM 时是异步执行的。只要侦听到数据变化，Vue 将开启一个队列，并缓冲在同一事件循环中发生的所有数据变更。如果同一个 watcher 被多次触发，只会被推入到队列中一次。这种在缓冲时去除重复数据对于避免不必要的计算和 DOM 操作是非常重要的。然后，在下一个的事件循环“tick”中，Vue 刷新队列并执行实际 (已去重的) 工作。Vue 在内部对异步队列尝试使用原生的 Promise.then、MutationObserver 和 setImmediate，如果执行环境不支持，则会采用 setTimeout(fn, 0) 代替。例如，当你设置 vm.someData = 'new value'，该组件不会立即重新渲染。当刷新队列时，组件会在下一个事件循环“tick”中更新。多数情况我们不需要关心这个过程，但是如果你想基于更新后的 DOM 状态来做点什么，这就可能会有些棘手。虽然 Vue.js 通常鼓励开发人员使用“数据驱动”的方式思考，避免直接接触 DOM，但是有时我们必须要这么做。为了在数据变化之后等待 Vue 完成更新 DOM，可以在数据变化之后立即使用 Vue.nextTick(callback)。这样回调函数将在 DOM 更新完成后被调用。

### watcher queue

```
const queue = []
const idsMap = {}
let waiting = false
let flushing = false
let curIndex = 0
export default function queueWatcher(watcher) {
  if (!idsMap[watcher.id]) {
    idsMap[watcher.id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      let i = queue.length - 1
      while (i > curIndex && watcher.id < queue[i].id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    if (!waiting) {
      waiting = true
      Promise.resolve().then(() => {
        flushQueue()
      }).catch(e => {
        console.error(e)
      })
    }
  }
}

function flushQueue() {
  flushing = true
  queue.sort((a, b) => {
    if (a.id > b.id) {
      return 1
    } else {
      return -1
    }
  })
  for (curIndex = 0; curIndex < queue.length; curIndex++) {
    const watcher = queue[curIndex]
    idsMap[watcher.id] = null
    // 如果已经销毁，就不再执行
    watcher.destroyed || watcher.run()
  }
  resetQueue()
}

function resetQueue() {
  flushing = waiting = false
  curIndex = queue.length = 0
}

```