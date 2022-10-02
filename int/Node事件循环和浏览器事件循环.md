# Node的事件循环
[原文链接](https://zhuanlan.zhihu.com/p/54882306)
[chrome浏览器V8的优化 & node11前后变化]
NodeJS的执行机制

* V8 引擎解析 JavaScript 脚本。
* 解析后的代码，调用 Node API。
* libuv 库负责 Node API 的执行。它将不同的任务分配给不同的线程，形成一个 Event Loop（事件循环），以异步的方式将任务的执行结果返回给 V8 引擎。
* V8 引擎再将结果返回给用户。


nodejs中的微任务是在不同阶段之间执行的。node事件循环机制分为6个阶段，它们会按照顺序反复运行。每当进入某一个阶段的时候，都会从对应的回调队列中取出函数去执行。当队列为空或者执行的回调函数数量到达系统设定的阈值，就会进入下一阶段。

## Node事件循环的阶段
无论是我们对文件的IO操作、数据库操作，都会有对应的结果和回调函数放到事件循环队列中，事件循环会不断从任务队列中取出对应的回调函数然后进行执行。一次完整的事件循环可以称之为一次Tick分为多个阶段: 在每一次事件循环的tick中，会按照如下顺序来执行代码

[不同阶段图片](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3293e898bd56417c94a69b80f77cf4d6~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

- 定时器(Timers): timers 阶段会执行 setTimeout 和 setInterval 回调，并且是由 poll 阶段控制的
- 待定回调(pending callback): 处理一些上一轮循环中的少数未执行的 I/O 回调
- idle，prepare: 仅 node 内部使用
- 轮询(Poll): poll 是一个至关重要的阶段，这一阶段中，系统会做两件事情：回到 timer 阶段执行回调：执行 I/O 回调，获取新的 I/O 事件, 适当的条件下 node 将阻塞在这里
- check: setImmediate()的回调会被加入 check 队列中，从 event loop 的阶段图可以知道，check 阶段的执行顺序在 poll 阶段之后
- 关闭的回调函数：一些关闭的回调函数，如：socket.on('close', ...)。

node 的事件循环的阶段顺序为：

输入数据阶段(incoming data)->轮询阶段(poll)->检查阶段(check)->关闭事件回调阶段(close callback)->定时器检测阶段(timers)->I/O事件回调阶段(I/O callbacks)->闲置阶段(idle, prepare)->轮询阶段...

注意：上面六个阶段都不包括 process.nextTick()(下文会介绍)

### 详细介绍timers、poll、check这 3 个阶段

因为日常开发中的绝大部分异步任务都是在这 3 个阶段处理的。

#### timer 阶段

timers 阶段会执行 setTimeout 和 setInterval 回调，并且是由 poll 阶段控制的。
同样，在 Node 中定时器指定的时间也不是准确时间，只能是尽快执行。

#### poll 阶段
[poll的执行阶段](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9tbWJpei5xcGljLmNuL3N6X21tYml6X2pwZy8yd1Y3TGljTDc2Mll4VmlhR3NFbmhSOUtpYmJHNnlRcXBjRWo0VlBGcE9PdnpOYW51S1NnMURvNWVKQlV2SVNvQnNpYVNPN3hTM2liZWpkSGJ6NDhseGRXN3hnLzY0MA?x-oss-process=image/format,png)

poll 是一个至关重要的阶段，这一阶段中，系统会做两件事情。回到 timer 阶段执行回调和执行 I/O 回调。

当然设定了 timer 的话且 poll 队列为空，则会判断是否有 timer 超时，如果有的话会回到 timer 阶段执行回调。

并且在进入该阶段时如果没有设定了 timer 的话，会发生以下两件事情

如果 poll 队列不为空，会遍历回调队列并同步执行，直到队列为空或者达到系统限制

如果 poll 队列为空时，会有两件事发生

如果有 setImmediate 回调需要执行，poll 阶段会停止并且进入到 check 阶段执行回调
如果没有 setImmediate 回调需要执行，会等待回调被加入到队列中并立即执行回调，这里同样会有个超时时间设置防止一直等待下去

#### check 阶段

setImmediate()的回调会被加入 check 队列中，从 event loop 的阶段图可以知道，check 阶段的执行顺序在 poll 阶段之后。

```
console.log('start')
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(function() {
    console.log('promise1')
  })
}, 0)
setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(function() {
    console.log('promise2')
  })
}, 0)
Promise.resolve().then(function() {
  console.log('promise3')
})
console.log('end')

// node的结果 start=>end=>promise3=>timer1=>timer2=>promise1=>promise2
// 浏览器的结果 start=>end=>promise3=>timer1=>promise1=>timer2=>promise2
```
一开始执行栈的同步任务（这属于宏任务）执行完毕后（依次打印出 start end，并将 2 个 timer 依次放入 timer 队列）,会先去执行微任务（这点跟浏览器端的一样），所以打印出 promise3然后进入 timers 阶段，执行 timer1 的回调函数，打印 timer1，并将 promise.then 回调放入 microtask 队列，同样的步骤执行 timer2，打印 timer2；这点跟浏览器端相差比较大，timers 阶段有几个 setTimeout/setInterval 都会依次执行，并不像浏览器端，每执行一个宏任务后就去执行一个微任务（关于 Node 与浏览器的 Event Loop 差异，下文还会详细介绍）。

## setTimeout 和 setImmediate（注意点）
二者非常相似，区别主要在于调用时机不同。

setImmediate 设计在 poll 阶段完成时执行，即 check 阶段；
setTimeout 设计在 poll 阶段为空闲时，且设定时间到达后执行，但它在 timer 阶段执行

```
setTimeout(function timeout () {
  console.log('timeout');
},0);
setImmediate(function immediate () {
  console.log('immediate');
});
```
对于以上代码来说，setTimeout 可能执行在前，也可能执行在后。首先 setTimeout(fn, 0) === setTimeout(fn, 1)，这是由源码决定的。进入事件循环也是需要成本的，如果在准备时候花费了大于 1ms 的时间，那么在 timer 阶段就会直接执行 setTimeout 回调。如果准备时间花费小于 1ms，那么就是 setImmediate 回调先执行了。

但当二者在异步 i/o callback 内部调用时，总是先执行 setImmediate，再执行 setTimeout

```
const fs = require('fs')
fs.readFile(__filename, () => {
    setTimeout(() => {
        console.log('timeout');
    }, 0)
    setImmediate(() => {
        console.log('immediate')
    })
})
// immediate
// timeout
```

在上述代码中，setImmediate 永远先执行。因为两个代码写在 IO 回调中，IO 回调是在 poll 阶段执行，当回调执行完毕后队列为空，发现存在 setImmediate 回调，所以就直接跳转到 check 阶段去执行回调了。

## process.nextTick
这个函数其实是独立于 Event Loop 之外的，它有一个自己的队列，当每个阶段完成后，如果存在 nextTick 队列，就会清空队列中的所有回调函数，并且优先于其他 microtask 执行。
```
setTimeout(() => {
 console.log('timer1')
 Promise.resolve().then(function() {
   console.log('promise1')
 })
}, 0)
process.nextTick(() => {
 console.log('nextTick')
 process.nextTick(() => {
   console.log('nextTick')
   process.nextTick(() => {
     console.log('nextTick')
     process.nextTick(() => {
       console.log('nextTick')
     })
   })
 })
})
// nextTick=>nextTick=>nextTick=>nextTick=>timer1=>promise1
```
```
setImmediate(() => {
    console.log('timeout1')
    Promise.resolve().then(() => console.log('promise resolve'))
    process.nextTick(() => console.log('next tick1'))
});
setImmediate(() => {
    console.log('timeout2')
    process.nextTick(() => console.log('next tick2'))
});
setImmediate(() => console.log('timeout3'));
setImmediate(() => console.log('timeout4'));
```
在 node11 之前，因为每一个 eventLoop 阶段完成后会去检查 nextTick 队列，如果里面有任务，会让这部分任务优先于微任务执行，因此上述代码是先进入 check 阶段，执行所有 setImmediate，完成之后执行 nextTick 队列，最后执行微任务队列，因此输出为timeout1=>timeout2=>timeout3=>timeout4=>next tick1=>next tick2=>promise resolve


在 node11 之后，process.nextTick 是微任务的一种,因此上述代码是先进入 check 阶段，执行一个 setImmediate 宏任务，然后执行其微任务队列，再执行下一个宏任务及其微任务,因此输出为timeout1=>next tick1=>promise resolve=>timeout2=>next tick2=>timeout3=>timeout4

## node 版本差异说明
ode11 之后一些特性已经向浏览器看齐了，总的变化一句话来说就是，如果是 node11 版本一旦执行一个阶段里的一个宏任务(setTimeout,setInterval和setImmediate)就立刻执行对应的微任务队列。

### timers 阶段的执行时机变化
```
setTimeout(()=>{
    console.log('timer1')
    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)
setTimeout(()=>{
    console.log('timer2')
    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
```
如果是 node11 版本一旦执行一个阶段里的一个宏任务(setTimeout,setInterval和setImmediate)就立刻执行微任务队列，这就跟浏览器端运行一致，最后的结果为timer1=>promise1=>timer2=>promise2

如果是 node10 及其之前版本要看第一个定时器执行完，第二个定时器是否在完成队列中.如果是第二个定时器还未在完成队列中，最后的结果为timer1=>promise1=>timer2=>promise2。如果是第二个定时器已经在完成队列中，则最后的结果为timer1=>timer2=>promise1=>promise2

### check 阶段的执行时机变化

```
setImmediate(() => console.log('immediate1'));
setImmediate(() => {
    console.log('immediate2')
    Promise.resolve().then(() => console.log('promise resolve'))
});
setImmediate(() => console.log('immediate3'));
setImmediate(() => console.log('immediate4'));
```
如果是 node11 后的版本，会输出immediate1=>immediate2=>promise resolve=>immediate3=>immediate4

如果是 node11 前的版本，会输出immediate1=>immediate2=>immediate3=>immediate4=>promise resolve

### nextTick 队列的执行时机变化

```
setImmediate(() => console.log('timeout1'));
setImmediate(() => {
    console.log('timeout2')
    process.nextTick(() => console.log('next tick'))
});
setImmediate(() => console.log('timeout3'));
setImmediate(() => console.log('timeout4'));
```
如果是 node11 后的版本，会输出timeout1=>timeout2=>next tick=>timeout3=>timeout4

如果是 node11 前的版本，会输出timeout1=>timeout2=>timeout3=>timeout4=>next tick
## Node 与浏览器的 Event Loop 差异
浏览器环境下，microtask 的任务队列是每个 macrotask 执行完之后执行。而在 Node.js 中，microtask 会在事件循环的各个阶段之间执行，也就是一个阶段执行完毕，就会去执行 microtask 队列的任务。
```
setTimeout(()=>{
    console.log('timer1')
    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)
setTimeout(()=>{
    console.log('timer2')
    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
// 浏览器端运行结果：timer1=>promise1=>timer2=>promise2
// Node 端运行结果：timer1=>timer2=>promise1=>promise2
```
全局脚本（main()）执行，将 2 个 timer 依次放入 timer 队列，main()执行完毕，调用栈空闲，任务队列开始执行；
首先进入 timers 阶段，执行 timer1 的回调函数，打印 timer1，并将 promise1.then 回调放入 microtask 队列，同样的步骤执行 timer2，打印 timer2；
至此，timer 阶段执行结束，event loop 进入下一个阶段之前，执行 microtask 队列的所有任务，依次打印 promise1、promise2

[浏览器执行图](https://pic2.zhimg.com/v2-d1ca0d6b13501044a5f74c99becbcd3d_b.webp)
[Nodejs执行图](https://pic1.zhimg.com/v2-963090bd3b681de3313b4466b234f4f0_b.jpg)

### 浏览器和 Node 环境下，microtask 任务队列的执行时机不同

Node 端，microtask 在事件循环的各个阶段之间执行
浏览器端，microtask 在事件循环的 macrotask 执行完之后执行
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
Node结果：
// script start
// async1 start
// async2
// promise1
// promise2
// script end
// nextTick1
// nextTick2
// async1 end
// promise3
// setTimeout0
// setImmediate
// setTimeout2
浏览器结果：
// script start
// async1 start
// async2
// promise1
// promise2
// script end
// async1 end
// promise3
// setTimeout0
// setImmediate
// setTimeout2
```
# 浏览器的事件循环

浏览器执行微任务，当某个宏任务执行完后,会查看是否有微任务队列。如果有，先执行微任务队列中的所有任务，如果没有，会读取宏任务队列中排在最前的任务，执行宏任务的过程中，遇到微任务，依次加入微任务队列。栈空后，再次读取微任务队列里的任务，依次类推。


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


首先js代码先执行主线程的代码，也就是同步的代码，从上至下，遇到异步代码交给浏览器，浏览器专门开了一个线程维护两种队列，一种微任务队列，一种宏任务队列。宏任务队列可以有多个，微任务队列只有一个。JS调用栈是后进先出(LIFO)的。引擎每次从堆栈中取出一个函数，然后从上到下依次运行代码。每当它遇到一些异步代码，如setTimeout，它就把它交给浏览器的相应线程。事件循环(Event loop)不断地监视任务队列(Task Queue)，并按它们排队的顺序一次处理一个回调。每当调用堆栈(call stack)为空时，Event loop获取回调并将其放入堆栈(stack )中进行处理。请记住，如果调用堆栈不是空的，则事件循环不会将任何回调推入堆栈。每一次执行宏任务之前，都是要确保我微任务的队列是空的，也就是说从代码执行的顺序来说微任务优先于宏任务。

存在插队的情况，也就是说当我微任务执行完了，要开始执行宏任务了（有多个宏任务），宏任务队列当队列中的代码执行了，宏任务队列里面又有微任务代码，又把微任务放入到微任务队列当中

从严格的意义来说，紧接着是先进行编译的宏任务，但是此时微任务里面有任务才去执行的微任务队列，而不是直接去执行的。这些异步的代码交给js执行


* 宏任务队列 Macrotask Queue: ajax、Dom监听、setTimeout、setInterval、 setImmediate、script（整体代码）、 I/O 操作、UI 渲染等。
* 微任务队列 Microtask Queue: Promise的then回调、 Mutation Observer API、queueMicrotask

## chromeV8引擎对async await的优化
原理上执行await之后的async2函数本来已经跳出async1函数了，此时已经将async1函数的浏览器的主线程执行权力交给了async下面的函数执行。所以async1 end应该是promise1和promise2后面执行的。但是chrome优化之后，这种情况的话相当于直接把await后面的代码注册为一个微任务，可以简单理解为promise.then(await下面的代码)。然后跳出async1函数，执行其他代码。所以async1 end比promise1和promise2先执行。
```
console.log('script start')
 
async function async1() {
await async2()
console.log('async1 end')
}
async function async2() {
console.log('async2 end')
}
async1()
 
setTimeout(function() {
console.log('setTimeout')
}, 0)
 
new Promise(resolve => {
console.log('Promise')
resolve()
})
.then(function() {
console.log('promise1')
})
.then(function() {
console.log('promise2')
})
 
console.log('script end')
 // 旧版输出如下，但是请继续看完本文下面的注意那里，新版有改动
// script start => async2 end => Promise => script end => promise1 => promise2 => async1 end => setTimeout
// 新版输出：script start => async2 end => Promise => script end => async1 end => promise1 => promise2 => setTimeout
```

## 其他问题
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
