function promiseAny(promises){
    return new Promise((resolve, reject) => {
        promises = Array.isArray(promises) ? promises : []
        let len = promises.length
        let errs = []
        if(len === 0) return reject(new AggregateError('All promises were rejected'))
        promises.forEach(promise => {
            promise.then(value => {
                resolve(value)
            }, err => {
                len--
                errs.push(err)
                if(len === 0) {
                    reject(new AggregateError(errs))
                }
            })
        })
    })
}
const promises = [
    Promise.reject('ERROR A'),
    Promise.reject('ERROR B'),
    Promise.reject('result'),
  ]
  promiseAny(promises).then((value) => {
    console.log('value: ', value)
  }).catch((err) => {
    console.log('err: ', err)
  })