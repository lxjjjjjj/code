Promise.resolve(1)
  .then(2)
  .then(Promise.resolve(3))
  .then(console.log)
 // .then 或者 .catch 的参数期望是函数，传入非函数则会发生值穿透。
 // 运行结果:1 

 const promise = Promise.resolve()
  .then(() => {
    return promise
  })
promise.catch(console.error)
// TypeError: Chaining cycle detected for promise #<Promise>

Promise.resolve()
  .then(() => {
    return new Error('error!!!')
  })
  .then((res) => {
    console.log('then: ', res)
  })
  .catch((err) => {
    console.log('catch: ', err)
  })
  // then:  Error: error!!!
    // at <anonymous>
// .then 或者 .catch 中 return 一个 error 对象并不会抛出错误，所以不会被后续的 .catch 捕获，
// 需要改成其中一种：return Promise.reject(new Error('error!!!'))
// throw new Error('error!!!')因为返回任意一个非 promise 的值都会被包裹成 promise 对象，
// 即 return new Error('error!!!') 等价于 return Promise.resolve(new Error('error!!!'))。

const promise2 = new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('once')
      resolve('success')
    }, 1000)
  })
  
  const start = Date.now()
  promise2.then((res) => {
    console.log(res, Date.now() - start)
  })
  promise2.then((res) => {
    console.log(res, Date.now() - start)
  })
  // once
  // success 1002
  // success 1002