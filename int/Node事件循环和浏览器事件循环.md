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
// async2 promise1 promise2 script end nextTick1 nextTick2
// async1 end promise3 settimeout0 setImmediate settimeout2

```
# 浏览器的事件循环
[原文链接](https://juejin.cn/post/7079092748929728548)

浏览器内核是多线程，在内核控制下各线程相互配合以保持同步，一个浏览器通常由以下常驻线程组成：

- GUI 渲染线程

主要负责页面的渲染，解析HTML、CSS，构建DOM树，布局和绘制等。当界面需要重绘或者由于某种操作引发回流时，将执行该线程。该线程与JS引擎线程互斥，当执行JS引擎线程时，GUI渲染会被挂起，当任务队列空闲时，主线程才会去执行GUI渲染。

- JavaScript引擎线程

该线程当然是主要负责处理 JavaScript脚本，执行代码。也是主要负责执行准备好待执行的事件，即定时器计数结束，或者异步请求成功并正确返回时，将依次进入任务队列，等待 JS引擎线程的执行。当然，该线程与 GUI渲染线程互斥，当 JS引擎线程执行 JavaScript脚本时间过长，将导致页面渲染的阻塞。

- 定时触发器线程
负责执行异步定时器一类的函数的线程，如： setTimeout，setInterval。主线程依次执行代码时，遇到定时器，会将定时器交给该线程处理，当计数完毕后，事件触发线程会将计数完毕后的事件加入到任务队列的尾部，等待JS引擎线程执行。

- 事件触发线程
主要负责将准备好的事件交给 JS引擎线程执行。比如 setTimeout定时器计数结束， ajax等异步请求成功并触发回调函数，或者用户触发点击事件时，该线程会将整装待发的事件依次加入到任务队列的队尾，等待 JS引擎线程的执行。

- 异步http请求线程
负责执行异步请求一类的函数的线程，如： Promise，axios，ajax等。主线程依次执行代码时，遇到异步请求，会将函数交给该线程处理，当监听到状态码变更，如果有回调函数，事件触发线程会将回调函数加入到任务队列的尾部，等待JS引擎线程执行。


首先js代码先执行主线程的代码，也就是同步的代码，从上至下，遇到异步代码交给浏览器，浏览器专门开了一个线程维护两个队列，一个微任务队列，一个宏任务队列。JS调用栈是后进先出(LIFO)的。引擎每次从堆栈中取出一个函数，然后从上到下依次运行代码。每当它遇到一些异步代码，如setTimeout，它就把它交给浏览器的相应线程。事件循环(Event loop)不断地监视任务队列(Task Queue)，并按它们排队的顺序一次处理一个回调。每当调用堆栈(call stack)为空时，Event loop获取回调并将其放入堆栈(stack )中进行处理。请记住，如果调用堆栈不是空的，则事件循环不会将任何回调推入堆栈。每一次执行宏任务之前，都是要确保我微任务的队列是空的，也就是说从代码执行的顺序来说微任务优先于宏任务。

存在插队的情况，也就是说当我微任务执行完了，要开始执行宏任务了（有多个宏任务），宏任务队列当队列中的代码执行了，宏任务队列里面又有微任务代码，又把微任务放入到微任务队列当中

从严格的意义来说，紧接着是先进行编译的宏任务，但是此时微任务里面有任务才去执行的微任务队列，而不是直接去执行的。这些异步的代码交给js执行


* 宏任务队列 Macrotask Queue: ajax、setTimeout、setInterval、Dom监听等
* 微任务队列 Microtask Queue: Promise的then回调、 Mutation Observer API、queueMicrotask



```
function foo() {
  setTimeout(foo, 0); // 是否存在堆栈溢出错误?
};

```
调用 foo()会将foo函数放入调用堆栈(call stack)。

在处理内部代码时，JS引擎遇到setTimeout。

然后将foo回调函数传递给WebAPIs并从函数返回，调用堆栈再次为空

计时器被设置为0，因此foo将被发送到任务队列。

由于调用堆栈是空的，事件循环将选择foo回调并将其推入调用堆栈进行处理。

进程再次重复，堆栈不会溢出。
```
