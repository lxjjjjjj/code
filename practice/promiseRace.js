function promiseRace(arr) {
    return new Promise((resolve, reject) => {
        for(const item of arr){
            Promise.resolve(item).then((res) => {
                resolve(res)
            }).catch(err =>{
                reject(err)
            })
        }
    })
}
const promises = [
    Promise.reject('ERROR A'),
    Promise.reject('ERROR B'),
    Promise.resolve('result'),
  ]
promiseRace(promises).then((value) => {
    console.log('value: ', value)
  }).catch((err) => {
    console.log('err: ', err)
  })