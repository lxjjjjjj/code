// [原文链接](https://juejin.cn/post/6844904102053281806)
// 接收一个generate函数
function asyncToGenerator(generatorFunc) {
    // 模拟async函数
    return function() {
      // 生成迭代器函数
      const gen = generatorFunc.apply(this, arguments)
      // async函数返回一个promise 可以被 await 
      // 返回一个promise 因为外部是用.then的方式 或者await的方式去使用这个函数的返回值的
      // var test = asyncToGenerator(testG)
      // test().then(res => console.log(res))
      return new Promise((resolve, reject) => {
        function step(key, arg) {
          let generatorResult
          try {
            // 通过不断调用step实现一步一步调用generate函数
            generatorResult = gen[key](arg)
          } catch (error) {
            return reject(error)
          }
          const { value, done } = generatorResult
          if (done) {
            return resolve(value)
          } else {
            // 除了最后结束的时候外，每次调用gen.next()
            // 其实是返回 { value: Promise, done: false } 的结构，
            // 这里要注意的是Promise.resolve可以接受一个promise为参数
            // 并且这个promise参数被resolve的时候，这个then才会被调用
            return Promise.resolve(value).then(val => step('next', val), err => step('throw', err))
          }
        }
        step("next")
      })
    }
}
