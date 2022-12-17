// onFulfilled及onRejected的返回值
var p = new Promise((resolve, reject) => {
    resolve('p..success')
});
var p2 = p.then((res) => {
    console.log('p..res', res);
    return 'p.res'; // 如果没有return语句呢？试试去掉 return
}, err => {
    console.log('p..err', err);
    return 'p.err';
})
p2.then(res => {
    console.log('p2..res', res);
}, err => {
    console.log('p2..err', err);
})
// p..res p..success
// p2..res p.res

var p = new Promise((resolve, reject) => {
    console.log('第一层')
    resolve('第一层的resolve')
})
.then(res => {
    console.log('p..res', res);
    return new Promise((resolve, reject) => {
        console.log('这是什么');
        resolve('look at this');
    })
}, err => {
    console.log('p..err', err);
})
.then(res => {
    console.log('第三层..res', res);
}, err => {
    console.log('第三层..err', err);
})

// 第一层
// p..res 第一层的resolve
// 这是什么
// 第三层..res look at this

// onFulfilled或者onRejected省略的情况

var p = new Promise((resolve, reject) => {
    resolve('p..success')
});
p.then().then().then(res => {
    console.log('p...res', res);
}, err => {
    console.log('p...err', err)
})
// 或者
var p = new Promise((resolve, reject) => {
    reject('p..reject')
});
p.then().then().then(res => {
    console.log('p...res', res);
}, err => {
    console.log('p...err', err)
})
// 或者
var p = new Promise((resolve, reject) => {
    reject('p..reject')
});
p.then('abc', 'efg').then().then(res => {
    console.log('p...res', res);
}, err => {
    console.log('p...err', err)
})

// p...res p..success
// p...err p..reject
// p...err p..reject

// onFulfilled或者onRejected有异常的情况下
var p = new Promise((resolve, reject) => {
    resolve('p..success');
})
.then((res) => {
    console.log('p..res', res);
    console.log(a + b);
    return 'p.res';
}, err => {
    console.log('p..err', err);
})
.then(res => {
    console.log('p2..res', res);
}, err => {
    console.log('p2..err', err);
})

// p..res p..success
// p2..err ReferenceError: a is not defined


// resolve 或者 reject一个promise

var p = new Promise((resolve, reject) => {
    resolve(new Promise((resolve2, reject2) => {
        resolve2('这是内部的resolve');
    }))
})
p.then(res => {
    console.log('p..res', res);
}, err => {
    console.log('p..err', err);
})
// reject
var p = new Promise((resolve, reject) => {
    reject(new Promise((resolve2, reject2) => {
        resolve2('这是内部的resolve');
    }))
})
p.then(res => {
    console.log('p..res', res);
}, err => {
    console.log('p..err', err);
})
// p..err Promise {<fulfilled>: '这是内部的resolve'}
// p..res 这是内部的resolve

var p = new Promise((resolve, reject) => {
    console.log('第一层')
    resolve('第一层的resolve')
})
.then(res => {
    console.log('p..res', res);
    return new Promise((resolve, reject) => {
        console.log('这是什么');
        resolve(
            new Promise((resolve, reject) => {
                 console.log('继续嵌套。。。');
                 reject('经典折磨')
            })
        );
    })
}, err => {
    console.log('p..err', err);
})
.then(res => {
    console.log('第三层..res', res);
}, err => {
    console.log('第三层..err', err);
})

// 第一层
// p..res 第一层的resolve
// 这是什么
// 继续嵌套。。。
// 第三层..err 经典折磨


// then 方法链式调用

var p = new Promise((resolve, reject) => {
    console.log('第一层')
    resolve('第一层的resolve')
})
p.then(res => {
    console.log('p..res', res);
    return '第二层..'
}, err => {
    console.log('p..err', err);
})
.then(res => {
    console.log('第三层..res', res);
}, err => {
    console.log('第三层..err', err);
});
// 第一层
// p..res 第一层的resolve
// 第三层..res 第二层..

var p = new Promise((resolve, reject) => {
    console.log('第一层promise');
    resolve(
        new Promise((resolve2, reject2) => {
            console.log('内部的promise');
            resolve2('这是内部的resolve');
        })
        .then(res => {
            console.log('内部的res', res);
            return '搞懂了吗';
        }, err => {
            console.log('内部的err', err);
        })
    )
})
p.then(res => {
    console.log('p..res', res);
}, err => {
    console.log('p..err', err);
});
// 第一层promise
// 内部的promise
// 内部的res 这是内部的resolve
// p..res 搞懂了吗

var p = new Promise((resolve, reject) => {
    console.log('第一层promise');
    resolve(
        new Promise((resolve2, reject2) => {
            console.log('内部的promise');
            resolve2('这是内部的resolve');
        })
        .then(res => {
            console.log('内部的res', res);
            return '搞懂了吗';
        }, err => {
            console.log('内部的err', err);
        })
        .then((res) => {
            console.log('第三层res', res);
            return '第三层的onfill返回值'
        }, err => {
            console.log('第三层err', err);
        })
    )
})
p.then(res => {
    console.log('p..res', res);
}, err => {
    console.log('p..err', err);
});
// 第一层promise
// 内部的promise
// 内部的res 这是内部的resolve
// 第三层res 搞懂了吗
// p..res 第三层的onfill返回值


// resolve 结合 then链式调用经典折磨

var p = new Promise((resolve, reject) => {
    console.log('1........');
    resolve(
        new Promise((resolve1, reject1) => {
            console.log('2.......');
            resolve1('a')
        })
        .then(res => {
            console.log('3...res', res);
        }, err => {
            console.log('4...err', err);
        })
    );
})
.then(res => {
    console.log('5...', res);
    return new Promise((resolve, reject) => {
               console.log('6....');
               resolve('b')
           })
           .then(res => {
               console.log('7...', res);
               return 'c';
            }, err => {
               console.log('8...', err);
            })
}, err => {
    console.log('9...', err);
}).then(res => {
    console.log('10...', res);
}, err => {
    console.log('11...', err);
})

// 1........
// 2.......
// 3...res a
// 5... undefined
// 6....
// 7... b
// 10... c
