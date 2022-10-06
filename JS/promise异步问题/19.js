new Promise((resolve,reject)=>{
    reject(2)
  }).catch((err)=>{
    return new Promise((resolve,reject)=>{
      resolve('resolve', err)
    })
  }).then((err)=>{
    console.log('then', err)
  })
  // then resolve