// const PENDING = 'pending'
// const FULFILLED = 'fulfilled'
// const REJECTED = 'rejected'
// class MyPromise {
//   constructor(exector){
//     try {
//       exector(this.resolve, this.reject)
//     } catch(err) {
//       this.reject(err)
//     }
//   }
//   status = PENDING
//   value = null
//   reason = null
//   onFulfilledCallbacks = []
//   onRejectedCallbacks = []
//   resolve = (value) => {
//     if(this.status === PENDING) {
//       this.status = FULFILLED
//       this.value = value
//       while(this.onFulfilledCallbacks.length){
//         this.onFulfilledCallbacks.shift()(value)
//       }
//     }
//   }
//   reject = (reason) => {
//     if(this.status === PENDING) {
//       this.status = REJECTED
//       this.reason = reason
//       while(this.onRejectedCallbacks.length){
//         this.onRejectedCallbacks.shift()(reason)
//       }
//     }
//   }
//   then(onFulfilled, onRejected) {
//     const realOnFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
//     const realOnRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
//     const promise2 = new MyPromise((resolve, reject) => {
//       const fulfilledMicrotask = () => {
//         queueMicrotask(() => {
//           try{
//             const x = realOnFulfilled(this.value)
//             resolvePromise(promise2, x, resolve, reject)
//           }catch(err){
//             reject(err)
//           }
//         })
//       }
//       const rejectedMicrotask = () => {
//         queueMicrotask(() => {
//           try{
//             const x = realOnRejected(this.reason)
//             resolvePromise(promise2, x, resolve, reject)
//           }catch(err){
//             reject(err)
//           }
//         })
//       }
//       if(this.status === FULFILLED) {
//         fulfilledMicrotask()
//       }else if(this.status === REJECTED) {
//         rejectedMicrotask()
//       } else {
//         this.onFulfilledCallbacks.push(fulfilledMicrotask)
//         this.onRejectedCallbacks.push(rejectedMicrotask)
//       }
//     })
//     return promise2
//   }
// }
// function resolvePromise(promise2, x, resolve, reject){
//   if(x === promise2){
//     return reject(new TypeError('xxxxxxx'))
//   }
//   if(x instanceof MyPromise){
//     x.then(resolve, reject)
//   } else{
//     resolve(x)
//   }
// }

// const promise = new MyPromise((resolve) => {
//   setTimeout(() => {
//     resolve(1)
//   }, 2000)
// })
// promise.then((value)=> {
//   console.log('then1', value)
//   return new MyPromise((resolve) => {
//     resolve(2)
//   })
// }).then((value) => {
//   console.log('then2', value)
// })

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

