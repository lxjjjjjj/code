const getData = () =>
  new Promise(resolve => setTimeout(() => resolve("data"), 1000))

// async函数会被编译成generator函数 (babel会编译成更本质的形态，这里我们直接用generator)
function* testG() {
  // await被编译成了yield
  const data = yield getData()
  console.log('data: ', data);
  const data2 = yield getData()
  console.log('data2: ', data2);
  return data + '123'
}
const testGAsync = asyncToGenerator(testG)
testGAsync().then(result => {
  console.log(result)
})

function asyncToGenerator(func) {
  return function() {
    const genFunc = func.apply(this, arguments)
    return new Promise((resolve, reject) => {
      function step(type, ...args) {
        let genRes
        try {
          genRes = genFunc[type](args)
        } catch(err) {
          return reject(err)
        }
        const { value, done } = genRes
        if(done) {
          return resolve(value)
        } else {
          return Promise.resolve(value).then((val) => step('next', val), (err) => step('throw', err))
        }
      }
      step('next')
    })
  }
}

