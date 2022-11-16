function promiseAllSettled(arr) {
    return new Promise((resolve, reject) => {
        let fullCount = 0
        let iteratorIndex = 0
        let result = []
        for(let item of arr) {
            let resultIndex = iteratorIndex
            iteratorIndex++
            Promise.resolve(item).then(res => {
                result[resultIndex] = res
                fullCount++
                if(fullCount === iteratorIndex){
                    resolve(result)
                }
            }).catch(err => {
                const res = {
                    status: 'rejected',
                    value: item
                }
                result[resultIndex] = res
                fullCount += 1
                if(fullCount === iteratorIndex){
                    resolve(result)
                }
            })
        }
        if(iteratorIndex === fullCount) {
            resolve(result)
        }
    })
}

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