const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
const PENDING = 'pending'



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