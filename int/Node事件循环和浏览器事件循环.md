# Node的事件循环
浏览器中的EventLoop是根据HTML5定义的规范来实现的，不同的浏览器可能会有不同的实现，而Node中是由libuv实现的。

## Node事件循环的阶段

- 无论是我们对文件的IO操作、数据库操作，都会有对应的结果和回调函数放到事件循环队列中
- 事件循环会不断从任务队列中取出对应的回调函数然后进行执行。
- 一次完整的事件循环可以称之为一次Tick(时钟的滴答类似) 分为多个阶段:
- 定时器(Timers):本阶段执行已经被 setTimeout() 和 setInterval() 的调度回调函数。
- 待定回调(pading callback):对某些操作系统（如Tcp）的执行回调
- idle，perpase:仅系统内部使用
- 轮询(Poll):探索检测新的IO事件、执行IO相关的回调
- setImmediate()回调函数在这里执行
- 关闭的回调函数：一些关闭的回调函数，如：socket.on('close', ...)。

## Node中的宏任务和微任务

我们会发现从一次事件循环的Tick来说，Node的事件循环更复杂，它也分为微任务和宏任务：
宏任务（macrotask）：setTimeout、setInterval、IO事件、setImmediate、close事件；
微任务（microtask）：Promise的then回调、process.nextTick、queueMicrotask；

但是，Node中的事件循环不只是 微任务队列和 宏任务队列。

微任务队列：

next tick queue：process.nextTick； 
other queue：Promise的then回调、queueMicrotask； 


宏任务队列:

timer queue：setTimeout、setInterval 
poll queue：IO事件； 
check queue：setImmediate； 
close queue：close事件；

## Node事件循环的顺序

所以，在每一次事件循环的tick中，会按照如下顺序来执行代码：


```
next tick microtask queue 
other microtask queue 
timer queue
poll queue
check queue
close queue
```

```

async function async1() {
  console.log("async1 start");
  await async2();
  console.log("async1 end");
}

async function async2() {
  console.log("async2");
}

console.log("script start");

setTimeout(function () {
  console.log("setTimeout0");
}, 0);

setTimeout(function () {
  console.log("setTimeout2");
}, 300);

setImmediate(() => console.log("setImmediate"));

process.nextTick(() => console.log("nextTick1"));

async1();

process.nextTick(() => console.log("nextTick2"));

new Promise(function (resolve) {
  console.log("promise1");
  resolve();
  console.log("promise2");
}).then(function () {
  console.log("promise3");
});

console.log("script end");

//script start
//async1 start
// async2 promise1 promise2 scriptend nextTick1 nextTick2
// async1 end promise3 settimeout0 setImmediate settimeout2

```
# 浏览器的事件循环
[浏览器的事件循环和面试题](https://juejin.cn/post/7079092748929728548/#heading-5)

```
首先js代码先执行主线程的代码，也就是同步的代码，从上至下，遇到异步代码交给浏览器，浏览器专门开了一个线程，其中浏览器线程中维护这两个队列，一个微任务队列，一个宏任务队列。

宏任务队列 Macrotask Queue: ajax、setTimeout、setInterval、Dom监听等

微任务队列 Microtask Queue: Promise的then回调、 Mutation Observer API、queueMicrotask

注意:每一次执行宏任务之前，都是要确保我微任务的队列是空的，也就是说从代码执行的顺序来说微任务优先于宏任务。

存在插队的情况，也就是说当我微任务执行完了，要开始执行宏任务了（有多个宏任务），宏任务队列当队列中的代码执行了，宏任务队列里面又有微任务代码，又把微任务放入到微任务队列当中

从严格的意义来说，紧接着是先进行编译的宏任务，但是此时微任务里面有任务才去执行的微任务队列，而不是直接去执行的。这些异步的代码交给js执行
```


