Promise.resolve().then(()=>{
    console.log('Promise1')  
    setTimeout(()=>{
        console.log('setTimeout2')
    },0)
})
setTimeout(()=>{
    console.log('setTimeout1')
    Promise.resolve().then(()=>{
        console.log('Promise2')    
    })
},0)

// 1.一开始执行栈的同步任务（这属于宏任务）执行完毕，会去查看是否有微任务队列，上题中存在(有且只有一个)，
// 然后执行微任务队列中的所有任务输出Promise1，同时会生成一个宏任务 setTimeout2
// 2.然后去查看宏任务队列，宏任务 setTimeout1 在 setTimeout2 之前，先执行宏任务 setTimeout1，输出 setTimeout1
// 3.在执行宏任务setTimeout1时会生成微任务Promise2 ，放入微任务队列中，接着先去清空微任务队列中的所有任务，输出 Promise2
// 4.清空完微任务队列中的所有任务后，就又会去宏任务队列取一个，这回执行的是 setTimeout2

// Promise1
// setTimeout1
// Promise2
// setTimeout2

