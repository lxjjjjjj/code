function promiseAll(arr) {
    return new Promise((resolve, reject) => {
        let iteratorIndex = 0
        let fullCount = 0
        let result = []
        for(let item of arr) {
            let resultIndex = iteratorIndex
            iteratorIndex++
            Promise.resolve(item).then((res) => {
                result[resultIndex] = res
                fullCount++
                if(fullCount === iteratorIndex) {
                    resolve(result)
                }
            }).catch(err => {
                reject(err)
            })
        }
        if(iteratorIndex === 0){
            resolve(result)
        }
    })
}
const promises = [
    Promise.reject('ERROR A'),
    Promise.reject('ERROR B'),
    Promise.resolve('result'),
  ]
  promiseAll(promises)