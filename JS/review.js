const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
class MyPromise {
  constructor(exector){
    try {
      exector(this.resolve, this.reject)
    } catch(err) {
      this.reject(err)
    }
  }
  status = PENDING
  value = null
  reason = null
  onFulfilledCallbacks = []
  onRejectedCallbacks = []
  resolve = (value) => {
    if(this.status === PENDING) {
      this.status = FULFILLED
      this.value = value
      while(this.onFulfilledCallbacks.length){
        this.onFulfilledCallbacks.shift()(value)
      }
    }
  }
  reject = (reason) => {
    if(this.status === PENDING) {
      this.status = REJECTED
      this.reason = reason
      while(this.onRejectedCallbacks.length){
        this.onRejectedCallbacks.shift()(reason)
      }
    }
  }
  then(onFulfilled, onRejected) {
    const realOnFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    const realOnRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
    const promise2 = new MyPromise((resolve, reject) => {
      const fulfilledMicrotask = () => {
        queueMicrotask(() => {
          try{
            const x = realOnFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          }catch(err){
            reject(err)
          }
        })
      }
      const rejectedMicrotask = () => {
        queueMicrotask(() => {
          try{
            const x = realOnRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          }catch(err){
            reject(err)
          }
        })
      }
      if(this.status === FULFILLED) {
        fulfilledMicrotask()
      }else if(this.status === REJECTED) {
        rejectedMicrotask()
      } else {
        this.onFulfilledCallbacks.push(fulfilledMicrotask)
        this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })
    return promise2
  }
}
function resolvePromise(promise2, x, resolve, reject){
  if(x === promise2){
    return reject(new TypeError('xxxxxxx'))
  }
  if(x instanceof MyPromise){
    x.then(resolve, reject)
  } else{
    resolve(x)
  }
}

const promise = new MyPromise((resolve) => {
  setTimeout(() => {
    resolve(1)
  }, 2000)
})
promise.then((value)=> {
  console.log('then1', value)
  return new MyPromise((resolve) => {
    resolve(2)
  })
}).then((value) => {
  console.log('then2', value)
})

// function quickSort(arr) {
//   if(arr.length < 2) return arr
//   let midIndex = arr.length / 2
//   const mid = arr.splice(midIndex,1)[0]
//   const left = [], right = [];
//   for(let i = 0;i< arr.length;i++){
//     if(arr[i] <= mid){
//       left.push(arr[i])
//     } else {
//       right.push(arr[i])
//     }
//   }
//   return quickSort(left).concat([mid], quickSort(right))
// }
// const arr2 = quickSort([1,5,3,4,2,7,8])
// console.log(arr2)

// function myNew(proto) {
//   let obj = {}
//   const args = Array.from(arguments).shift()
//   obj.__proto__ = proto.prototype
//   obj = proto.constructor
//   const res = proto.constructor(args)
//   if(typeof res === 'object' && res !== null) return res 
//   return obj
// }
// const obj1 = {
//   foo: 1,
//   get bar() {
//     return this.foo
//   }
// }
// const obj2 = myNew(obj1)
// console.log(obj2)

// function throttle(func, wait = 50){
//   let last = new Date()
//   return function() {
//     const now = new Date()
//     if(now - last > wait){
//       last = now
//       func.call(this,...Array.from(arguments))
//     }
//   }
// }
// const aa = throttle(() => {
//   console.log('zhixingle')
// }, 5000)
// setInterval(() => {
//   aa()
// }, 1000);

// function debounce (func, wait = 50) {
//   let timer = 0
//    return function (...args) {
//        if(timer) clearTimeout(timer)
//        timer = setTimeout(()=>{
//           func.apply(this, args)
//           clearTimeout(timer)
//        }, wait)
//    }
// }
// const aa = debounce(() => {
//   console.log('debounce')
// },1000)
// setInterval(()=> {
//   aa()
// },2000)

// function myCall(context,...args) {
//   context = context || window
//   const symbolFn = Symbol()
//   context[symbolFn] = this
//   const res = context[symbolFn](...args)
//   delete context[symbolFn]
//   return res
// }
// function myApply(context,args) {
//   context = context || window
//   const symbolFn = Symbol()
//   context[symbolFn] = this
//   const res = context[symbolFn](...args)
//   delete context[symbolFn]
//   return res
// }
// function myBind(context,...outerArgs) {
//   context = context || window
//   const self = this
//   return function F(...innerArgs){
//     if(self instanceof F){
//       return new self(...outerArgs,...innerArgs)
//     }
//     let symbolFn = Symbol()
//     context[symbolFn] = self
//     let result = context[symbolfn](...outerArgs, ...innerArgs)
//         delete context[symbolfn]
//         return result
//   }
// }
// const getData = () =>
//   new Promise(resolve => setTimeout(() => resolve("data"), 1000))


// // async函数会被编译成generator函数 (babel会编译成更本质的形态，这里我们直接用generator)
// function* testG() {
//   // await被编译成了yield
//   const data = yield getData()
//   console.log('data: ', data);
//   const data2 = yield getData()
//   console.log('data2: ', data2);
//   return data + '123'
// }
// function asyncGen(genfunc){
//   return function() {
//     const gen = genfunc.apply(this, arguments)
//     return new Promise((resolve,reject) => {
//       function step(key, arg) {
//         let result
//         try{
//           result = gen[key](arg)
//         }catch(e){
//           reject(e)
//         }
//         const { done, value } = result
//         if(done){
//           resolve(value)
//         }else {
//           return Promise.resolve(value).then((value) => { step('next',value) },(reason) => { step('throw', reason)})
//         }
//       }
//       step('next')
//     })
//   }
// }
// const testGAsync = asyncGen(testG)
// testGAsync().then(result => {
//   console.log(result)
// })

// const a = async () => {
//   await new Promise((resolve)=>{
//     setTimeout(()=> {
//       console.log('async 1')
//       resolve()
//     })
//   })
    
//   console.log('~~~1')
// }
// const b = async () => {
//   await a()
//   console.log('~~~2')
// }
// b()
// function compose(funs) {
//   var combin = null;
//   for (var i = 0; i < funs.length; i++) {
//     combin = (function(i, combin) {
//       return combin
//         ? function(args) {
//             return combin(funs[i](args));
//           }
//         : function(args) {
//             return funs[i](args);
//           };
//     })(i, combin);
//   }
//   return combin;
// }

// class EventBus {
//   constructor(){
//     this.eventMap = {}
//     this.callbackID = 0
//   }
//   $on(name, callback) {
//     if(!this.eventMap[name]){
//       this.eventMap[name] = {}
//     }
//     const id = this.callbackID++
//     this.eventMap[name][id] = callback
//     return id
//   }
//   $emit(name, ...args){
//     const eventList = this.eventMap[name]
//     for(const id in eventList){
//       eventList[id](...args)
//       if(id.indexOf('D') !== -1) {
//         delete eventList[id]
//       }
//     }
//   }
//   $once(name, callback){
//     if(!this.eventMap[name]){
//       this.eventMap[name] = {}
//     }
//     const id = 'D' + this.callbackID++
//     this.eventMap[name][id] = callback
//     return id
//   }
//   $off(name, id){
//     delete this.eventObj[name][id];
//     if(!Object.keys(this.eventObj[name]).length){
//       delete this.eventMap[name]
//     }
//   }
// }

function all(args) {
    return Promise((resolve, reject) => {
        let interatorIndex = 0;
        let fullCount = 0;
        let result = []
        for(let item of args) {
            let resultIndex = interatorIndex
            interatorIndex++
            Promise.resolve(item).then(value => {
                fullCount++
                result[resultIndex] = value
                if(interatorIndex === fullCount){
                    resolve(result)
                }
            }).catch(err => {
                reject(err)
            })
        }
        if(interatorIndex === 0){
            resolve(result)
        }
    })
}

function allsettled(args) {
    return new Promise((resolve, reject) => {
        let fullCount = 0;
        let interatorIndex = 0;
        let result = []
        for(let item of args) {
            let resultIndex = interatorIndex
            interatorIndex++
            Promise.resolve(item).then((value)=> {
                result[resultIndex] = value
                if(fullCount === interatorIndex) {
                    resolve(result)
                }
            }).catch(err=> {
                const res = {
                    value: item,
                    status: 'reject'
                }
                result[resultIndex] = res
                fullCount += 1
                if(fullCount === interatorIndex) {
                    resolve(result)
                }
            })
        }
        if(iteratorIndex === fullCount){
            resovle(results)
        }
    })
}

function race(args){
    return new Promise((resolve, reject) => {
        for(let item of args) {
            Promise.resolve(item).then(value => {
                resolve(value)
            }).catch(err => {
                reject(err)
            })
        }
    })
}

function any(promises) {
    return new Promise((resolve, reject) => {
        promises = Array.isArray(promises) ? promises : [promises]
        let len = promises.length
        let errs = []
        if(len === 0) return reject(new AggregateError('All promises were rejected'))
        promises.forEach(promise => {
            promise.then(value => {
                resolve(value)
            },err => {
                len--
                errs.push(err)
                if(len === 0){
                    reject(new AggregateError(errs))
                }
            })
        })
    })
}