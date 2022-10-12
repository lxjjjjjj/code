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




// 简易版本的async
// 定义了一个promise，用来模拟异步请求，作用是传入参数++
function getNum(num){
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve(num+1)
      }, 1000)
  })
}

//自动执行器，如果一个Generator函数没有执行完，则递归调用
function asyncFun(func){
  var gen = func();

  function next(data){
    var result = gen.next(data);
    if (result.done) return result.value;
    result.value.then(function(data){
      next(data);
    });
  }
  next();
}

// 所需要执行的Generator函数，内部的数据在执行完成一步的promise之后，再调用下一步
var func = function* (){
  var f1 = yield getNum(1);
  var f2 = yield getNum(f1);
  console.log(f2) ;
};
asyncFun(func);