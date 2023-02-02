
const promises = [
    Promise.resolve('ERROR A'),
    Promise.resolve('ERROR B'),
    Promise.resolve('result'),
  ]
  promiseAll(promises).then((value) => {
    console.log('value: ', value)
  }).catch((err) => {
    console.log('err: ', err)
  })