const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
const PENDING = 'pending'

class MyPromise {
    constructor(exector) {
        try {
            exector(this.resolve, this.reject)
        } catch(err) {
            this.reject(err)
        }
    }
    status = PENDING
    reason = null
    value = null
    onFulfilledCallbacks = []
    onRejectedCallbacks = []
    resolve = (value) => {
        if (this.status === PENDING) {
            this.status = FULFILLED
            this.value = value
            while(this.onFulfilledCallbacks.length) {
                this.onFulfilledCallbacks.shift()(value)
            }
        }
    }
    reject = (reason) => {
        if (this.status === PENDING) {
            this.status = REJECTED
            this.reason = reason
            while(this.onRejectedCallbacks.length) {
                this.onRejectedCallbacks.shift()(reason)
            }
        }
    }
    then(fulfilled, rejected) {
        const realFulfilled = typeof fulfilled === 'function' ? fulfilled : (value) => value
        const realRejected = typeof rejected === 'function' ? rejected : (reason) => { throw reason }
        const promise2 =  new MyPromise((resolve, reject) => {
            const fulfilledQueueTask = () => {
                queueMicrotask(() => {
                    try {
                        const x = realFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(err) {
                        reject(err)
                    }
                })
            }
            const rejectedQueueTask = () => {
                queueMicrotask(() => {
                    try {
                        const x = realRejected(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch(err) {
                        reject(err)
                    }
                })
            }
            if (this.status === PENDING) {
                this.onFulfilledCallbacks.push(fulfilledQueueTask)
                this.onRejectedCallbacks.push(rejectedQueueTask)
            } else if (this.status === FULFILLED) {
                fulfilledQueueTask()
            } else {
                rejectedQueueTask()
            }
        })
        return promise2
    }
}

function resolvePromise(promise2, x, resolve, reject) {
    if(promise2 === x) {
        return reject(new TypeError('xxxxxxxx'))
    } else if (promise2 instanceof MyPromise) {
        x.then(resolve, reject)
    } else {
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