console.log('script start');
new Promise(resolve => {
  setTimeout(()=>{
    console.log('setTimeout');
    new Promise(resolve => {
     resolve();
    }).then(() => console.log('setTimeoutthen'))
  })
  resolve();
}).then(() => {
    //then1-1
    new Promise(resolve => {
      resolve();
    })
    .then(() => console.log('then2-1'))
    .then(() => console.log('then2-2'));
}).then(() => {
    //then1-2
    new Promise(resolve => {
    //promise3
        resolve()
    }).then(() => {
    //then3-1
        new Promise((resolve) => {
            resolve()
        }).then(() => console.log('then4-1'))
    }).then(() => console.log('then3-2'))
}).then(() => console.log('then1-3'));

console.log('script end');
//script start script end then2-1 then2-2 then1-3 then4-1 then3-2 setTimeout setTimeoutthen

// 第一轮
// current task：script start，script end
// micro task queue: [Promise1的then1-1]
// macro task queue: [setTimeout]
// 第二轮
// current task：无输出
// micro task queue: [Promise2的then2-1，Promise1的then1-2]
// macro task queue: [setTimeout]
// 第三轮
// current task：then2-1
// micro task queue: [Promise2的then2-2，Promise3的then3-1,Promise1的then1-3]
// macro task queue: [setTimeout]
// 第四轮
// current task：then2-2,then1-3
// micro task queue: [Promise4的then4-1,Promise3的then3-2]
// macro task queue: [setTimeout]
// 第五轮
// current task：then4-1,then3-2
// micro task queue: []
// macro task queue: [setTimeout]
// 第六轮
// current task：setTimeout
// micro task queue: []
// macro task queue: [setTimeout中的then]
// 第七轮
// current task：setTimeoutthen
// micro task queue: []
// macro task queue: []
// 通过这个例子我们可以看到，无论promise1，then()内部怎么运转，在每次轮询中，都是会顺序的吧then1-1,then1-2,then1-3依次压入微任务队列，then1,2内部的promise2,3，4也会根据then1,2的执行顺序开始。



