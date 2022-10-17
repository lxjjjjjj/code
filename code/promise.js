// ### 在javascript中通过queueMicrotask使用微任务

// 很有意思的两个使用例子

// [mdn](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)

// ### 微任务和javascript运行时环境

// [mdn](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth)

// 为了运行 JavaScript 代码，运行时引擎维护一组代理来执行 JavaScript 代码。每个代理由一组执行上下文、执行上下文堆栈、一个主线程、一组用于处理工作线程的任何附加线程、一个任务队列和一个微任务队列组成。除了一些浏览器在多个代理之间共享的主线程之外，代理的每个组件对于该代理都是唯一的。每个代理都由一个事件循环驱动，该循环收集任何用户和其他事件，将任务排入队列以处理每个回调。然后它运行任何待处理的 JavaScript 任务，然后是任何待处理的微任务，然后执行任何需要的渲染和绘制，然后再次循环以检查待处理的任务。
// ### 手写实现


// MyPromise.js

// 先定义三个常量表示状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// 新建 MyPromise 类
class MyPromise {
  constructor(executor){
    // executor 是一个执行器，进入会立即执行
    // 并传入resolve和reject方法
    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  // 储存状态的变量，初始值是 pending
  status = PENDING;
  // 成功之后的值
  value = null;
  // 失败之后的原因
  reason = null;

  // 存储成功回调函数
  onFulfilledCallbacks = [];
  // 存储失败回调函数
  onRejectedCallbacks = [];

  // resolve和reject为什么要用箭头函数？
  // 如果直接调用的话，普通函数this指向的是window或者undefined
  // 用箭头函数就可以让this指向当前实例对象
  // 更改成功后的状态
  resolve = (value) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态修改为成功
      this.status = FULFILLED;
      // 保存成功之后的值
      this.value = value;
      // resolve里面将所有成功的回调拿出来执行
      while (this.onFulfilledCallbacks.length) {
        // Array.shift() 取出数组第一个元素，然后（）调用，shift不是纯函数，取出后，数组将失去该元素，直到数组为空
        this.onFulfilledCallbacks.shift()(value)
      }
    }
  }

  // 更改失败后的状态
  reject = (reason) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态成功为失败
      this.status = REJECTED;
      // 保存失败后的原因
      this.reason = reason;
      // resolve里面将所有失败的回调拿出来执行
      while (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()(reason)
      }
    }
  }

  then(onFulfilled, onRejected) {
    const realOnFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    const realOnRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason};

    // 为了链式调用这里直接创建一个 MyPromise，并在后面 return 出去
    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () =>  {
        // 创建一个微任务等待 promise2 完成初始化
        queueMicrotask(() => {
          try {
            // 获取成功回调函数的执行结果
            const x = realOnFulfilled(this.value);
            // 传入 resolvePromise 集中处理
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error)
          } 
        })  
      }

      const rejectedMicrotask = () => { 
        // 创建一个微任务等待 promise2 完成初始化
        queueMicrotask(() => {
          try {
            // 调用失败回调，并且把原因返回
            const x = realOnRejected(this.reason);
            // 传入 resolvePromise 集中处理
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error)
          } 
        }) 
      }
      // 判断状态
      if (this.status === FULFILLED) {
        fulfilledMicrotask() 
      } else if (this.status === REJECTED) { 
        rejectedMicrotask()
      } else if (this.status === PENDING) {
        // 等待
        // 因为不知道后面状态的变化情况，所以将成功回调和失败回调存储起来
        // 等到执行成功失败函数的时候再传递
        this.onFulfilledCallbacks.push(fulfilledMicrotask);
        this.onRejectedCallbacks.push(rejectedMicrotask);
      }
    }) 
    
    return promise2;
  }

  // resolve 静态方法
  static resolve (parameter) {
    // 如果传入 MyPromise 就直接返回
    if (parameter instanceof MyPromise) {
      return parameter;
    }

    // 转成常规方式
    return new MyPromise(resolve =>  {
      resolve(parameter);
    });
  }

  // reject 静态方法
  static reject (reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }
}



module.exports = MyPromise;

function resolvePromise(promise2, x, resolve, reject) {
  // 如果相等了，说明return的是自己，抛出类型错误并返回
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  // 判断x是不是 MyPromise 实例对象
  if(x instanceof MyPromise) {
    // 执行 x，调用 then 方法，目的是将其状态变为 fulfilled 或者 rejected
    // x.then(value => resolve(value), reason => reject(reason))
    // 简化之后
    x.then(resolve, reject)
  } else{
    // 普通值
    resolve(x)
  }
}
// ### 符合promise A+ 规范的resolvePromise


// MyPromise.js

function resolvePromise(promise, x, resolve, reject) {
  // 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise
  // 这是为了防止死循环
  if (promise === x) {
    return reject(new TypeError('The promise and the return value are the same'));
  }

  if (typeof x === 'object' || typeof x === 'function') {
    // 这个坑是跑测试的时候发现的，如果x是null，应该直接resolve
    if (x === null) {
      return resolve(x);
    }

    let then;
    try {
      // 把 x.then 赋值给 then 
      then = x.then;
    } catch (error) {
      // 如果取 x.then 的值时抛出错误 e ，则以 e 为据因拒绝 promise
      return reject(error);
    }

    // 如果 then 是函数
    if (typeof then === 'function') {
      let called = false;
      // 将 x 作为函数的作用域 this 调用之
      // 传递两个回调函数作为参数，第一个参数叫做 resolvePromise ，第二个参数叫做 rejectPromise
      // 名字重名了，我直接用匿名函数了
      try {
        then.call(
          x,
          // 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
          y => {
            // 如果 resolvePromise 和 rejectPromise 均被调用，
            // 或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
            // 实现这条需要前面加一个变量called
            if (called) return;
            called = true;
            resolvePromise(promise, y, resolve, reject);
          },
          // 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
          r => {
            if (called) return;
            called = true;
            reject(r);
          });
      } catch (error) {
        // 如果调用 then 方法抛出了异常 e：
        // 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
        if (called) return;

        // 否则以 e 为据因拒绝 promise
        reject(error);
      }
    } else {
      // 如果 then 不是函数，以 x 为参数执行 promise
      resolve(x);
    }
  } else {
    // 如果 x 不为对象或者函数，以 x 为参数执行 promise
    resolve(x);
  }
}

// # promise.all


function myPromiseAll(args) {
    return new Promise((resolve, reject) => {
        let fullCount = 0
        let iteratorIndex = 0
        let results =[]
        for(const item of args){
            let resultIndex = iteratorIndex
            iteratorIndex += 1
            Promise.resolve(item).then((res) => {
                results[resultIndex] = res
                fullCount += 1
                if(iteratorIndex === fullCount){
                    resolve(results)
                }
            }).catch(err => {
                reject(err)
            })
        }
        if(iteratorIndex === 0){
            resovle(results)
        }
    })
}

// # promise.allsettled


function myPromiseAllsettled(args) {
    return new Promise((resolve, reject) => {
        let fullCount = 0
        let iteratorIndex = 0
        let results =[]
        for(const item of args){
            let resultIndex = iteratorIndex
            iteratorIndex += 1
            Promise.resolve(item).then((res) => {
                res[resultIndex] = res
                fullCount += 1
                if(iteratorIndex === fullCount){
                    resolve(results)
                }
            }).catch(err => {
                const result = {
                    status: 'reject',
                    value: item
                }
                res[resultIndex] = result
                fullCount += 1
                if(iteratorIndex === fullCount){
                    resolve(results)
                }
            })
        }
        if(iteratorIndex === fullCount){
            resovle(results)
        }
    })
}

// # promise.race


function myPromiseRace(args) {
    return new Promise((resolve, reject) => {
        for(const item of args){
            Promise.resolve(item).then((res) => {
                resolve(res)
            }).catch(err =>{
                reject(err)
            })
        }
    })
}

// # promise.any

// Promise.any() 是 ES2021 新增的特性，它接收一个 Promise 可迭代对象（例如数组），

// 只要其中的一个 promise 成功，就返回那个已经成功的 promise
// 如果可迭代对象中没有一个 promise 成功（即所有的 promises 都失败/拒绝），
// 就返回一个失败的 promise 和 AggregateError 类型的实例，
// 它是 Error 的一个子类，用于把单一的错误集合在一起

const promises = [
  Promise.reject('ERROR A'),
  Promise.reject('ERROR B'),
  Promise.resolve('result'),
]

Promise.any(promises).then((value) => {
  console.log('value: ', value)
}).catch((err) => {
  console.log('err: ', err)
})

// value:  result

// 如果所有传入的 promises 都失败：
const promises = [
  Promise.reject('ERROR A'),
  Promise.reject('ERROR B'),
  Promise.reject('ERROR C'),
]

Promise.any(promises).then((value) => {
  console.log('value：', value)
}).catch((err) => {
  console.log('err：', err)
  console.log(err.message)
  console.log(err.name)
  console.log(err.errors)
})

// err： AggregateError: All promises were rejected
// All promises were rejected
// AggregateError
// ["ERROR A", "ERROR B", "ERROR C"]

// Promise.any() 和 Promise.race() 的 关注点 不一样：

// Promise.any() ：关注于 Promise 是否已经解决
// Promise.race() ： 主要关注 Promise 是否已经解决，无论它是被解决还是被拒绝

// Promise.any 只要传入的 promise 有一个是 fullfilled 则立即 resolve 出去，
// 否则将所有 reject 结果收集起来并返回 AggregateError
MyPromise.any = function(promises){
  return new Promise((resolve,reject)=>{
    promises = Array.isArray(promises) ? promises : []
    let len = promises.length
    // 用于收集所有 reject 
    let errs = []
    // 如果传入的是一个空数组，那么就直接返回 AggregateError
    if(len === 0) return reject(new AggregateError('All promises were rejected'))
    promises.forEach((promise)=>{
      promise.then(value=>{
        resolve(value)
      },err=>{
        len--
        errs.push(err)
        if(len === 0){
          reject(new AggregateError(errs))
        }
      })
    })
  })
}

// 关于 AggregateError
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError


