Promise.resolve()
  .then(function success1 (res) {
    throw new Error('error')
  }, function fail1 (e) {
    console.error('fail1: ', e)
  })
  .then(function success2 (res) {
  }, function fail2 (e) {
    console.error('fail2: ', e)
  })
//   VM150:9 fail2:  Error: error
//   at success1 (<anonymous>:3:11)
// Promise {<fulfilled>: undefined}


Promise.resolve()
  .then(function success (res) {
    throw new Error('error')
  }, function fail1 (e) {
    console.error('fail1: ', e)
  })
  .catch(function fail2 (e) {
    console.error('fail2: ', e)
  })
// fail2:  Error: error
    // at success (<anonymous>)
// .then 的第二个处理错误的函数捕获不了第一个处理成功的函数抛出的错误，
// 而后续的 .catch 可以捕获之前的错误。