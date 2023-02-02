
const promises = [
    Promise.reject('ERROR A'),
    Promise.reject('ERROR B'),
    Promise.resolve('result'),
  ]
  promiseAllSettled(promises).then((value) => {
    console.log('value: ', value)
  }).catch((err) => {
    console.log('err: ', err)
  })