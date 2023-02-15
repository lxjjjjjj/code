const p1 = new Promise((resolve, reject) => {
    console.log(1)
    resolve('success')
    setTimeout(() => {
        console.log('2')
        reject('fail')
    })
})
console.log(3)

setTimeout(() => {
   console.log(4)
},100)

console.log(5)

setTimeout(() => {
    console.log(6)
})

const p2 = p1.then(res => {
    console.log(res)
    setTimeout(() => {
        console.log(7)
    }, 0)
    return res
}, error => {
    console.log(error)
    return error
})

console.log(p2 === p1)


// 输出结果
//  1
//  3
//  5
//  false
//  success
//  2
//  6
//  7
//  4


const p11 = new Promise((resolve, reject) => {
    console.log(1)
    resolve('success')
    setTimeout(() => {
        console.log('2')
        reject('fail')
    },0)
})

setTimeout(() => {
   console.log(4)
},0); p11.then(res => { console.log(res) });

// 结果
// 1
// success
// 2
// 4


const p111 = new Promise((resolve, reject) => {
    console.log(1)
    resolve('success')
    setTimeout(() => {
        console.log('2')
        reject('fail')
    },200)
})
console.log(3)

setTimeout(() => {
   console.log(4)
},100)

console.log(5)

setTimeout(() => {
    console.log(6)
})

const p22 = p111.then(res => {
    console.log(res)
    setTimeout(() => {
        console.log(7)
    }, 0)
    return res
}, error => {
    console.log(error)
    return error
})

console.log(p22 === p111)

//  1
//  3
//  5
//  false
//  success
//  6
//  7
//  4
//  2