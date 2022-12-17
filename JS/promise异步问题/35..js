new Promise((resolve) => {
    console.log(1)
    resolve(4)
}).then(res => {
    console.log(2)
    return new Promise(resolve => {
        console.log('2-1');
        resolve('2-1')
    });
}).then(res => {
    console.log(3)
})

new Promise((resolve) => {
    console.log(10)
    resolve(4)
}).then(res => {
    console.log(20)
    return res;
}).then(res => {
    console.log(30)
})
// 1 10 2 2-1 20 30 3

// 转换成下面的代码
const p1 = new Promise((resolve, reject) => {
    console.log(1)
    resolve(4)
})
const p2 = p1.then(function p1Fullfilled(res){
    console.log(2)
    const p21 = new Promise((resolve, reject) => {
        console.log('2-1')
        resolve('2-1')
    })
    return p21
})
const p3 = p2.then(function p2Fullfillled(res){
    console.log(3)
})

const p10 = new Promise((resolve, reject) => {
    console.log(10)
    resolve(4)
})
const p20 = p10.then(function p10Fullfilled(res){
    console.log(20)
    return res
})
const p30 = p20.then(function p20Fullfilled(res){
    console.log(30)
})


// 1 10 2 2-1 20 30 3

new Promise((resolve) => {
    console.log(1)
    resolve(4)
}).then(res => {
    console.log(2)
    return new Promise(resolve => {
        resolve('2-1')
    }).then(res => res).then(res => res);
}).then(res => {
    console.log(3, res)
})
new Promise((resolve) => {
    console.log(10)
    resolve(4)
}).then(res => {
    console.log(20)
    return res;
}).then(res => {
    console.log(30)
}).then(res => {
    console.log(40)
}).then(res => {
    console.log(50)
}).then(res => {
    console.log(60)
})
// 1 10 2 20 30 40 50 3 '2-1' 60

 
Promise.resolve(Promise.resolve(4)).then((res) => {
    console.log(0);
    return new Promise((resolve) => { resolve(4) });
}).then((res) => {
    console.log(res)
}, err => {
    console.log(err)
})
Promise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
})

// 0 1 2 3 4 5 6

Promise.resolve(4).then((res) => {
    console.log(0);
    return new Promise((resolve) => { resolve(4) });
}).then((res) => {
    console.log(res)
}, err => {
    console.log(err)
})
Promise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
})
// 0 1 2 3 4 5 6

Promise.resolve(4).then((res) => {
    console.log(0);
    return 4
}).then((res) => {
    console.log(res)
}, err => {
    console.log(err)
})
Promise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
})

// 0 1 4 2 3 5 6

Promise.resolve(Promise.resolve(4)).then((res) => {
    console.log(0);
    return 4
}).then((res) => {
    console.log(res)
}, err => {
    console.log(err)
})
Promise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
})

// 0 1 4 2 3 5 6


Promise.resolve().then(() => {
    console.log(0);
    return Promise.resolve(4);
}).then((res) => {
    console.log(res)
})
// 所以是Promise.resolve(4)一个微任务 和 后面的一个then微任务 顶替了下面的两轮then
// 和前面有几个Promise.then无关
Promise.resolve().then(() => {
    console.log(1);
}).then(() => {
    console.log(2);
}).then(() => {
    console.log(3);
}).then(() => {
    console.log(5);
}).then(() => {
    console.log(6);
})

// 打印顺序：0 1 2 3 4 5 6

