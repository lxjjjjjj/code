const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
class MyPromise {
    constructor(exector){
        try{
            exector(this.resolve,this.reject)
        }catch(err) {
            this.reject(err)
        }
    }
    status = PENDING
    value = null
    reason = null
    onfulfilledCallbacks = []
    onRejectedCallbacks = []
    resolve = (value) => {
        if (this.status === PENDING) {
            this.status === FULFILLED
            this.value = value
            while (this.onfulfilledCallbacks.length) {
              this.onfulfilledCallbacks.shift()(value)
            }
        }
    }
    reject = (reason) => {
        if (this.status === PENDING) {
            this.status === REJECTED
            this.reason = reason
            while (this.onRejectedCallbacks.length) {
              this.onRejectedCallbacks.shift()(reason)
            }
        }
    }
    then(onfulfilled,onRejected){
        const realOnFulfilled = typeof onfulfilled === 'function' ? onfulfilled : value => value
        const realOnRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }
        const promise2 = new MyPromise((resolve, reject) => {
            const fulfilledMicroTask = () => {
                queueMicrotask(()=> {
                    try{
                        const x = realOnFulfilled(this.value)
                        resolvedPromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            }
            const rejectedMicroTask = () => { 
                queueMicrotask(()=> {
                    try{
                        const x = realOnRejected(this.reason)
                        resolvedPromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e)
                    }
                })
            }
            if (this.status === FULFILLED) {
                fulfilledMicroTask()
            } else if(this.status === REJECTED) {
                rejectedMicroTask()
            } else {
                this.onfulfilledCallbacks.push(fulfilledMicroTask)
                this.onRejectedCallbacks.push(rejectedMicroTask)
            }
        })
        return promise2
    }
}
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
const promise = new MyPromise((resolve, reject)=> {
    setTimeout(()=>{
        resolve(1)
    },2000)
})
function other () {
    return new MyPromise((resolve, reject) => {
        resolve(2)
    })
  }
promise.then((value)=>{
    console.log('then1', value)
    return other()
}).then((value) => {
    console.log('then2',value)
})