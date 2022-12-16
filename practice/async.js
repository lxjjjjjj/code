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

