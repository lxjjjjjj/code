1、掌握Promise的基本使用
2、掌握Promise的基本原理
3、在项目中能灵活运用Promise解决一些问题
[原文链接]（https://juejin.cn/post/7033395086696136711）
# 接口请求超时
顾名思义，就是给定一个时间，如果接口请求超过这个时间的话就报错

实现思路就是：接口请求和延时函数赛跑，并使用一个Promise包着，由于Promise的状态是不可逆的，所以如果接口请求先跑完则说明未超时且Promise的状态是fulfilled，反之，延时函数先跑完则说明超时了且Promise的状态是rejetced，最后根据Promise的状态来判断有无超时

```
/**
 * 模拟延时
 * @param {number} delay 延迟时间
 * @returns {Promise<any>}
 */
function sleep(delay) {
  return new Promise((_, reject) => {
    setTimeout(() => reject('超时喽'), delay)
  })
}

/**
 * 模拟请求
 */
function request() {
  // 假设请求需要 1s
  return new Promise(resolve => {
    setTimeout(() => resolve('成功喽'), 1000)
  })
}

/**
 * 判断是否超时
 * @param {() => Promise<any>} requestFn 请求函数
 * @param {number} delay 延迟时长
 * @returns {Promise<any>}
 */
function timeoutPromise(requestFn, delay) {
  return new Promise((resolve, reject) => {
    const promises = [requestFn(), sleep(delay)]
    for (const promise of promises) {
      // 超时则执行失败，不超时则执行成功
      promise.then(res => resolve(res), err => reject(err))
    }
  })
}
function timeoutPromise(requestFn, delay) {
   // 如果先返回的是延迟Promise则说明超时了
   return Promise.race([requestFn(), sleep(delay)])
}
```
测试 
```
// 超时
timeoutPromise(request, 500).catch(err => console.log(err)) // 超时喽

// 不超时
timeoutPromise(request, 2000).then(res => console.log(res)) // 成功喽
```
# 转盘抽奖
我们平时在转盘抽奖时，一般都是开始转动的同时也发起接口请求，所以有两种可能

1、转盘转完，接口还没请求回来，这是不正常的

主要问题就是，怎么判断接口请求时间是否超过转盘转完所需时间，咱们其实可以用到上一个知识点接口请求超时，都是一样的道理。如果转盘转完所需时间是2500ms，那咱们可以限定接口请求需要提前1000ms请求回来，也就是接口请求的超时时间为2500ms - 1000ms = 1500ms
```
/**
 * 模拟延时
 * @param {number} delay 延迟时间
 * @returns {Promise<any>}
 */
function sleep(delay) {
  return new Promise((_, reject) => {
    setTimeout(() => reject('超时喽'), delay)
  })
}

/**
 * 模拟请求
 */
function request() {
  return new Promise(resolve => {
    setTimeout(() => resolve('成功喽'), 1000)
  })
}

/**
 * 判断是否超时
 * @param {() => Promise<any>} requestFn 请求函数
 * @param {number} delay 延迟时长
 * @returns {Promise<any>}
 */
function timeoutPromise(requestFn, delay) {
   return Promise.race([requestFn(), sleep(delay)])
}
```
2、转盘转完前，接口就请求完毕，这是正常的，但是需要保证请求回调跟转盘转完回调同时执行

咱们确保了接口请求可以在转盘转完之前请求回来，但是还有一个问题，就是需要保证请求回调跟转盘转完回调同时执行，因为虽然接口请求请求回来的时候，转盘还在转着，咱们需要等转盘转完时，再一起执行这两个回调。听到这个描述，相信很多同学就会想到Promise.all这个方法。

```
// ...上面代码

/**
 * 模拟转盘旋转到停止的延时
 * @param {number} delay 延迟时间
 * @returns {Promise<any>}
 */
 function turntableSleep(delay) {
  return new Promise(resolve => {
    setTimeout(() => resolve('停止转动喽'), delay)
  })
}

/**
 * 判断是否超时
 * @param {() => Promise<any>} requestFn 请求函数
 * @param {number} turntableDelay 转盘转多久
 * @param {number} delay 请求超时时长
 * @returns {Promise<any>}
 */

function zhuanpanPromise(requsetFn, turntableDelay, delay) {
  return Promise.all([timeoutPromise(requsetFn, delay), turntableSleep(turntableDelay)])
}

// 不超时，且先于转盘停止前请求回数据
zhuanpanPromise(request, 2500, 1500).then(res => console.log(res), err => console.log(err))
```
# 控制并发的Promise的调度器
想象一下，有一天你突然一次性发了10个请求，但是这样的话并发量是很大的，能不能控制一下，就是一次只发2个请求，某一个请求完了，就让第3个补上，又请求完了，让第4个补上，以此类推，让最高并发量变成可控的
```
addTask(1000,"1");
addTask(500,"2");
addTask(300,"3");
addTask(400,"4");
的输出顺序是：2 3 1 4

整个的完整执行流程：

一开始1、2两个任务开始执行
500ms时，2任务执行完毕，输出2，任务3开始执行
800ms时，3任务执行完毕，输出3，任务4开始执行
1000ms时，1任务执行完毕，输出1，此时只剩下4任务在执行
1200ms时，4任务执行完毕，输出4

```

实现

```
class Scheduler {
  constructor(limit) {
    this.queue = []
    this.limit = limit
    this.count = 0
  }
  

  add(time, order) {
    const promiseCreator = () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log(order)
          resolve()
        }, time)
      })
    }
    this.queue.push(promiseCreator)
  }

  taskStart() {
    for(let i = 0; i < this.limit; i++) {
      this.request()
    }
  }

  request() {
    if (!this.queue.length || this.count >= this.limit) return
    this.count++
    this.queue.shift()().then(() => {
      this.count--
      this.request()
    })
  }
}
```
测试
```
// 测试
const scheduler = new Scheduler(2);
const addTask = (time, order) => {
  scheduler.add(time, order);
};
addTask(1000, "1");
addTask(500, "2");
addTask(300, "3");
addTask(400, "4");
scheduler.taskStart();
```
# 取消重复请求
举个例子，咱们在做表单提交时，为了防止多次重复的提交，肯定会给按钮的点击事件加上防抖措施，这确实是有效地避免了多次点击造成的重复请求，但是其实还是有弊端的
众所周知，为了用户更好地体验，防抖的延时是不能太长的，一般在我的项目中都是300ms，但是这只能管到请求时间 < 300ms的接口请求，如果有一个接口请求需要2000ms，那么此时防抖也做不到完全限制重复请求，所以咱们需要额外做一下取消重复请求的处理

实现思路：简单说就是，利用Promise.race方法，给每一次请求的身边安装一颗雷，如果第一次请求后，又接了第二次重复请求，那么就执行第一次请求身边的雷，把第一次请求给炸掉，以此类推。
```
class CancelablePromise {
  constructor() {
    this.pendingPromise = null
    this.reject = null
  }

  request(requestFn) {
    if (this.pendingPromise) {
      this.cancel('取消重复请求')
    }

    const promise = new Promise((_, reject) => (this.reject = reject))
    this.pendingPromise = Promise.race([requestFn(), promise])
    return this.pendingPromise
  }

  cancel(reason) {
    this.reject(reason)
    this.pendingPromise = null
  }
}

function request(delay) {
  return () => 
    new Promise(resolve => {
      setTimeout(() => {
        resolve('最后赢家是我')
      }, delay)
    })
}
```
测试
```
const cancelPromise = new CancelablePromise()

// 模拟频繁请求5次
for (let i = 0; i < 5; i++) {
  cancelPromise
    .request(request(2000))
    .then((res) => console.log(res)) // 最后一个 最后赢家是我
    .catch((err) => console.error(err)); // 前四个 取消重复请求
}
```

# 全局请求loading
比如一个页面中，或者多个组件中都需要请求并且展示loading状态，此时我们不想要每个页面或者组件都写一遍loading，那我们可以统一管理loading，loading有两种情况

1、全局只要有一个接口还在请求中，就展示loading
2、全局所有接口都不在请求中，就隐藏loading

那我们怎么才能知道全局接口的请求状态呢？其实咱们可以利用Promise，只要某个接口请求Promise的状态不是pending那就说明他请求完成了，无论请求成功或者失败，既然是无论成功失败，那咱们就会想到Promise.prototype.finally这个方法

```
class PromiseManager {
  constructor() {
    this.pendingPromise = new Set()
    this.loading = false
  }

  generateKey() {
    return `${new Date().getTime()}-${parseInt(Math.random() * 1000)}`
  }

  push(...requestFns) {
    for (const requestFn of requestFns) {
      const key = this.generateKey()
      this.pendingPromise.add(key)
      requestFn().finally(() => {
        this.pendingPromise.delete(key)
        this.loading = this.pendingPromise.size !== 0
      })
    }
  }
}
```
```
// 模拟请求
function request(delay) {
  return () => {
    return new Promise(resolve => {
      setTimeout(() => resolve('成功喽'), delay)
    })
  }
}

const manager = new PromiseManager()

manager.push(request(1000), request(2000), request(800), request(2000), request(1500))

const timer = setInterval(() => {
   // 轮询查看loading状态
   console.log(manager.loading)
}, 300)
```