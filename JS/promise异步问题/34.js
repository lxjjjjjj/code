new Promise((resolve) => {
    console.log(1)
    resolve(4)
}).then(res => {
    console.log(2)
    return res;
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

// 1 10 2 20 3 30

// 我们将这个转换成下面这段代码一窥究竟：

const p1 = new Promise((resolve, reject) => {
    console.log(1)
    resolve(4)
})
const p2 = p1.then(function p1Fullfilled(res){
    console.log(2)
    return res
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

// 先执行同步任务：

// p1 执行器是同步执行，因此打印1，并且 p1状态改变成fullfilled
// p1.then返回一个promise，即p2，由于p1状态已经改变，因此将p1的onFullfilled回调，即p1Fullfilled放入微任务队列中，此时微任务队列：[p1Fullfilled]
// p2.then返回一个promise，即p3，由于p2的状态此时还是pending状态，因此p2的onFullfilled回调，即p2Fullfillled只会存入p2的回调列表中，而不是放入微任务队列
// new Promise返回一个promise，即p10，同时打印10，并且p10状态变成fullfilled
// p10.then返回一个promise，即p20，由于p10状态已改变，因此将p10的onFullfilled回调，即p10Fullfilled放入微任务队列中，此时微任务队列：
// [p1Fullfilled, p10Fullfilled]
// p20.then返回一个promise，即p30，由于p20的状态此时还是pending状态，因此p2的onFullfilled回调，即p20Fullfilled只会存入p20的回调列表中，而不是放入微任务队列
// 至此所有同步任务已经执行完成，下面开始执行微任务队列中的任务：
// 从微任务队列中取出p1Fullfilled并且执行，此时打印2，并且p2状态改变，因此将p2的回调放入微任务队列中，此时微任务队列：[p10Fullfilled, p2Fullfillled]
// 从微任务队列中取出p10Fullfilled并执行，此时打印20，并且p20状态改变，因此将p20的回调放入微任务队列中，此时微任务队列：[p2Fullfillled, p20Fullfilled]
// 重复上述步骤，依次执行p2Fullfillled，p20Fullfilled

