# 事件循环存在的必要性
为了协调事件，用户交互，脚本，渲染，网络任务等，浏览器必须使用事件循环
# Node的事件循环
[原文链接](https://zhuanlan.zhihu.com/p/54882306)
[原文链接](https://juejin.cn/post/7077122129107353636)
[chrome浏览器V8的优化 & node11前后变化]
NodeJS的执行机制

* V8 引擎解析 JavaScript 脚本。
* 解析后的代码，调用 Node API。
* libuv 库负责 Node API 的执行。它将不同的任务分配给不同的线程，形成一个 Event Loop（事件循环），以异步的方式将任务的执行结果返回给 V8 引擎。
* V8 引擎再将结果返回给用户。

nodejs中的微任务是在不同阶段之间执行的。node事件循环机制分为6个阶段(当然他们都是EventLoop中的宏任务执行顺序)，它们会按照顺序反复运行。每当进入某一个阶段的时候，都会从对应的回调队列中取出函数去执行。当队列为空或者执行的回调函数数量到达系统设定的阈值，就会进入下一阶段。

## Node事件循环的阶段
无论是我们对文件的IO操作、数据库操作，都会有对应的结果和回调函数放到事件循环队列中，事件循环会不断从任务队列中取出对应的回调函数然后进行执行。一次完整的事件循环可以称之为一次Tick分为多个阶段: 在每一次事件循环的tick中，会按照如下顺序来执行代码

[不同阶段图片](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3293e898bd56417c94a69b80f77cf4d6~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)

- 定时器(Timers): timers 阶段会执行 setTimeout 和 setInterval 回调，并且是由 poll 阶段控制的
- 待定回调(pending callback): 上一次循环队列中，还未执行完毕的会在这个阶段进行执行。比如延迟到下一个 Loop 之中的 I/O 操作。
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

在上述的同步代码执行完毕，以及进入 EventLoop 中这一切发生在 1ms 之内，显然 timers 阶段由于代码中的 setTimeout 并没有达到对应的时间，换句话说它所对应的 callback 并没有被推入当前 timer 中。
自然，名为 timer 的函数也并不会被执行。会依次进入接下里的阶段。Loop 会依次向下进行检查。
当执行到 poll 阶段时，即使定时器对应的 timer 函数已经被推入 timers 中了。由于 poll 阶段检查到存在 setImmediate 所以会继续进入 check 阶段并不会掉头重新进入 timers 中。

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
这个函数其实是独立于 Event Loop 之外的，它有一个自己的队列，当每个阶段完成后，如果存在 nextTick 队列，就会清空队列中的所有回调函数，并且优先于其他 microtask 执行。所谓 Process.nextTick 的执行时机即是在同步任务执行完毕后，即将将 micro-task 推入栈中时优先会将 Process.nextTick 推入栈中进行执行。
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
node11 之后一些特性已经向浏览器看齐了，总的变化一句话来说就是，如果是 node11 版本一旦执行一个阶段里的一个宏任务(setTimeout,setInterval和setImmediate)就立刻执行对应的微任务队列。

一个简单的例子
```
function tick() {
  console.log('tick');
}

function timer() {
  console.log('timer');
}

setTimeout(() => {
  timer();
}, 0);

process.nextTick(() => {
  tick();
});
// log: tick timer
```
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
## node11 之前 Node 与浏览器的 Event Loop 差异
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

### node11 之前 浏览器和 Node 环境下，microtask 任务队列的执行时机不同

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

## 总结
JS被设计成单线程的，因为JS可以操作DOM，为了保证用户操作和页面展示的一致。对于消耗时间久会对浏览器渲染产生阻塞的行为放到浏览器提供的各种异步队列中执行。浏览器会在打开一个tab页面的时候同时开启，GUI渲染线程、JS引擎线程、timer定时器线程、事件回调线程以及http异步请求线程。JS同步代码会在主线程中执行，形成执行栈，每当遇到不同的异步代码会交给浏览器执行。timer线程执行setTimeout、setInterval代码，http异步请求线程执行请求。DOM监听操作被触发时，事件回调线程会讲其放到任务队列中。当异步执行完，事件回调会将执行完的任务回调放到任务队列中。JS的同步代码执行完就会执行任务队列中的回调。当然任务队列分为微任务队列和宏任务队列。宏任务队列可以有多个，微任务队列只有一个。当某个宏任务执行完后, 会查看是否有微任务队列。如果有，先执行微任务队列中的所有任务，如果没有，会读取宏任务队列中排在最前的任务。每一次执行宏任务之前，都是要确保我微任务的队列是空的。存在插队的情况，也就是说当我微任务执行完了，要开始执行宏任务了（有多个宏任务），宏任务队列当队列中的代码执行了，宏任务队列里面又有微任务代码，又把微任务放入到微任务队列当中。

* 宏任务队列 Macrotask Queue: ajax、Dom监听、setTimeout、setInterval、 setImmediate、script（整体代码）、 I/O 操作、UI 渲染等、postMessage、MessageChannel
* 微任务队列 Microtask Queue: Promise的then回调、 Mutation Observer API、queueMicrotask


[原文链接](https://juejin.cn/post/6932263539839074311)

## 一个浏览器页面的线程
浏览器内核是多线程，在内核控制下各线程相互配合以保持同步，一个浏览器页面通常由以下常驻线程组成：

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


## 宏任务队列

每个页面都对应线程进程。而该进程又有多个线程，比如 JS 线程、渲染线程、IO 线程、网络线程、定时器线程等等，**这些线程之间的通信是通过向对象的任务队列中添加一个任务（postTask）来实现的。宏任务的本质也就是线程间通信的一个消息队列。宏任务的真面目是浏览器派发，与 JS 引擎无关的，参与了 Event Loop 调度的任务。**每次执行栈执行的代码就是一个宏任务，从事件队列中获取一个事件回调放入到执行栈中执行也是一个宏任务。**浏览器为了能够使JS内部macro-task(宏任务)与DOM任务能够有序的执行，会在一个宏任务执行完成之后，在下一个宏任务开始之前，对页面进行重新渲染。**

## micro-task(微任务)

微任务的出现，使得在宏任务执行完，到浏览器渲染之前，可以在这个阶段插入任务的能力。

微任务是在运行宏任务/同步任务的时候产生的，是属于当前任务的，所以它不需要浏览器的支持，内置在 JS 当中，直接在 JS 的引擎中就被执行掉了。

可以理解是在宏任务执行完成之后立即执行的任务。他在渲染之前，无需等待渲染，所以的他响应速度要比宏任务快。在一个宏任务运行期间产生的所有微任务都在当前宏任务之前完成之后立即执行。

简单来说, Microtasks 就是在 当次 事件循环的 结尾 立刻执行 的任务。

function callback() {
  Promise.resolve().then(callback)
}

callback()

这段代码是在执行 microtasks 的时候，又把自己添加到了 microtasks 中，看上去是和那个 setTimeout 内部继续 setTimeout 类似。但实际效果却和第一段 addEventListener 内部 while(true) 一样，是会阻塞主进程的。这和 microtasks 内部的执行机制有关。

## 渲染任务

其实在同步任务、异步任务之外还有渲染任务。页面并不是时时刻刻去渲染的，而是有他固定的节奏去渲染（render steps），一般情况浏览器的渲染是每秒60次，遵循W3C规则的浏览器是跟随电脑的刷新频率进行渲染。在它内部分为三个小步骤：

Structure - 构建 DOM 树的结构
Layout - 确认每个 DOM 的大致位置（排版）
Paint - 绘制每个 DOM 具体的内容（绘制）

特殊的requestAnimationFrame

requestAnimationFrame是一个特殊的异步任务，他不会被加入到异步任务队列，而是被加入到渲染任务，他在渲染任务的三个步骤之前执行，用来处理渲染相关的工作。

## requestAnimationFrame和setTimeout有什么不同

functuin callBack() {
	move()； // 让元素移动1PX
    requestAnimationFrame(callBack);
}

functuin callBack() {
	move()； // 让元素移动1PX
    setTimeout(() => {
    	callBack();
    }, 0);
}

这两种方法来让 box 移动起来。但实际测试发现，使用 setTimeout 移动的 box 要比 requestAnimationFrame 速度快得多。这表明单位时间内 callback 被调用的次数是不一样的。
这是因为 setTimeout 在每次运行结束时都把自己添加到异步队列。等渲染过程的时候（不是每次执行异步队列都会进到渲染循环）异步队列已经运行过很多次了，所以渲染部分会一下会更新很多像素，而不是 1 像素。 requestAnimationFrame 只在渲染过程之前运行，因此严格遵守“执行一次渲染一次”，所以一次只移动 1 像素，是我们预期的方式。

## 宏任务队列、微任务队列、渲染任务执行的特点
Tasks(宏任务队列) 只执行一个。执行完了就进入主进程，主进程可能决定进入其他两个异步队列，也可能自己执行到空了再回来。 补充：对于“只执行一个”的理解，可以考虑设置 2 个相同时间的 timeout，两个并不会一起执行，而依然是分批的。
```
botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 1');
    });
    console.log('listener 1'); 
});
botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 2');
    });
    console.log('listener 2'); 
});
// listener 1 microtask 1 listener 2 microtask 2
```
Animation callbacks(渲染任务) 执行队列里的全部任务，但如果任务本身又新增 Animation callback 就不会当场执行了，因为那是下一个循环 补充：同 Tasks(宏任务队列)，可以考虑连续调用两句 requestAnimationFrame，它们会在同一次事件循环内执行，有别于 Tasks (宏任务队列)

```
box.style.transform = 'translateX(1000px)'
requestAnimationFrame(()=>{
  requestAnimationFrame(()=>{
    box.style.tranition = 'transform 1s ease'
    box.style.transform = 'translateX(500px)'
  })
})
```

Microtasks 直接执行到空队列才继续。因此如果任务本身又新增 Microtasks，也会一直执行下去。所以上面的例子才会产生阻塞。 补充：因为是当次执行，因此如果既设置了 setTimeout(0) 又设置了 Promise.then()，优先执行 Microtasks。

```
function callback() {
  Promise.resolve().then(callback)
}

callback()
```

## 手动点击触发回调事件和js代码调用点击事件回调的区别
```
botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 1');
    });
    console.log('listener 1'); 
});
botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 2');
    });
    console.log('listener 2'); 
});

在浏览器上运行点击按钮，输出结果：

listener 1、microtask 1、listener2、microtask 2

botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 1');
    });
    console.log('listener 1'); 
});
botton.addEventListener('click', () => {
    Promise.resolve().then(() => {
        console.log('microtask 2');
    });
    console.log('listener 2'); 
});
button.click();

输出结果有所不用：

listener 1 、listener 2、microtask 1 、microtask 2

```
为什么会出现这样的情况了？

第一种情况下，浏览器并不知道会有几个listener，会一个一个执行，当前执行完成之后，在看看后面还没有其他的listener，当第一个listener执行完成之后，主任务为空了，执行异步任务输出microtask 1。再执行第二个listener。

第二种情况，使用button.click，浏览器会把click手机到事件队列中，依次同步执行。当同步执行完成之后，再执行异步任务。

## 浏览器对同步代码的合并
[原文链接](https://mp.weixin.qq.com/s/DSaLOOF0yBe8mEP5zywXng)

```
box.style.display = 'none';
box.style.display = 'block';
box.style.display = 'none';
```
先看这段代码，效果其实并不会box先显示在影藏，它是浏览器的一种自我优化策略，现代浏览器都有渲染队列的机制，会把它们捆绑在一起执行。我们经常在优化的时候会说，减少DOM的回流和重绘的一种手段就是DOM的读写分离，就是因为浏览器的渲染队列机制。

```
document.body.appendChild(el)
el.style.display = 'none'
```

这两句代码先把一个元素添加到 body，然后隐藏它。从直观上来理解，可能大部分人觉得如此操作会导致页面闪动，因此编码时经常会交换两句的顺序：先隐藏再添加。
但实际上两者写法都不会造成闪动，因为他们都是同步代码。浏览器会把同步代码捆绑在一起执行，然后以执行结果为当前状态进行渲染。因此无论两句是什么顺序，浏览器都会执行完成后再一起渲染，因此结果是相同的。


```
button.addEventListener('click',()=>{
  while(true);
})
```

点击后会导致异步队列永远执行，因此不单单主进程，渲染过程也同样被阻塞而无法执行，因此页面无法再选中（因为选中时页面表现有所变化，文字有背景色，鼠标也变成 text），也无法再更换内容。（但鼠标却可以动！）

如果我们把代码改成这样
```
function loop() {
  setTimeout(loop,0)
}
loop()
```
每个异步任务的执行效果都是加入一个新的异步任务，新的异步任务将在下一次被执行，因此就不会存在阻塞。主进程和渲染过程都能正常进行。

我们的本意是从让 box 元素的位置从 0 一下子 移动到 1000，然后 动画移动 到 500。
```
box.style.transform = 'translateX(1000px)'
box.style.tranition = 'transform 1s ease'
box.style.transform = 'translateX(500px)'
```
我们的本意是从让 box 元素的位置从 0 一下子 移动到 1000，然后 动画移动 到 500。

但实际情况是从 0 动画移动 到 500。这也是由于浏览器的合并优化造成的。第一句设置位置到 1000 的代码被忽略了。

解决方法有 2 个：

第一种：我们刚才提过的 requestAnimationFrame。思路是让设置 box 的初始位置（第一句代码）在同步代码执行；让设置 box 的动画效果（第二句代码）和设置 box 的重点位置（第三句代码）放到下一帧执行。
但要注意， requestAnimationFrame 是在渲染过程 之前 执行的，因此直接写成
```
box.style.transform = 'translateX(1000px)'
requestAnimationFrame(()=>{
  box.style.tranition = 'transform 1s ease'
  box.style.transform = 'translateX(500px)'
})
```
是无效的，因为这样这三句代码依然是在同一帧中出现。那如何让后两句代码放到下一帧呢？这时候我们想到一句话：没有什么问题是一个 requestAnimationFrame 解决不了的，如果有，那就用两个：
```
box.style.transform = 'translateX(1000px)'
requestAnimationFrame(()=>{
  requestAnimationFrame(()=>{
    box.style.tranition = 'transform 1s ease'
    box.style.transform = 'translateX(500px)'
  })
})
```
在渲染过程之前，再一次注册 requestAnimationFrame，这就能够让后两句代码放到下一帧去执行了，问题解决。（当然代码看上去有点奇怪）

第二种：你之所以没有在平时的代码中看到这样奇葩的嵌套用法，是因为还有更简单的实现方式，并且同样能够解决问题。这个问题的根源在于浏览器的合并优化，那么打断它的优化，就能解决问题。

```
box.style.transform = 'translateX(1000px)'
getComputedStyle(box) // 伪代码，只要获取一下当前的计算样式即可
box.style.tranition = 'transform 1s ease'
box.style.transform = 'translateX(500px)'

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


# EventLoop 和 浏览器渲染 帧动画 空闲回调的关系

[原文链接](https://juejin.cn/post/6844904165462769678)
[html官方规范的事件循环调度的场景](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue)

为了协调事件，用户交互，脚本，渲染，网络任务等，浏览器必须使用本节中描述的事件循环。

## 问题
### 1、每一轮 Event Loop 都会伴随着渲染吗？
事件循环不一定每轮都伴随着重渲染，但是如果有微任务，一定会伴随着微任务执行。决定浏览器视图是否渲染的因素很多，浏览器是非常聪明的。
### 2、requestAnimationFrame 在哪个阶段执行，在渲染前还是后？在 microTask 的前还是后？
requestAnimationFrame在重新渲染屏幕之前执行，非常适合用来做动画。
### 3、requestIdleCallback 在哪个阶段执行？如何去执行？在渲染前还是后？在 microTask 的前还是后？
requestIdleCallback在渲染屏幕之后执行，并且是否有空执行要看浏览器的调度，如果你一定要它在某个时间内执行，请使用 timeout参数。
### 4、resize、scroll 这些事件是何时去派发的。
resize和scroll事件其实自带节流，它只在 Event Loop 的渲染阶段去派发事件到 EventTarget 上。

## 流程
1、从任务队列中取出一个宏任务并执行。
2、检查微任务队列，执行并清空微任务队列，如果在微任务的执行中又加入了新的微任务，也会在这一步一起执行。
3、进入更新渲染阶段，判断是否需要渲染，这里有一个 rendering opportunity 的概念，也就是说不一定每一轮 event loop 都会对应一次浏览器渲染，要根据屏幕刷新率、页面性能、页面是否在后台运行来共同决定，通常来说这个渲染间隔是固定的。（所以多个 task 很可能在一次渲染之间执行）。
(1)、浏览器会尽可能的保持帧率稳定，例如页面性能无法维持 60fps（每 16.66ms 渲染一次）的话，那么浏览器就会选择 30fps 的更新速率，而不是偶尔丢帧。
如果浏览器上下文不可见，那么页面会降低到 4fps 左右甚至更低。
如果满足以下条件，也会跳过渲染：
(2)、浏览器判断更新渲染不会带来视觉上的改变。
(3)、map of animation frame callbacks 为空，也就是帧动画回调为空，可以通过 requestAnimationFrame 来请求帧动画。
有时候浏览器希望两次「定时器任务」是合并的，他们之间只会穿插着 microTask的执行，而不会穿插屏幕渲染相关的流程，比如requestAnimationFrame。
4、如果上述的判断决定本轮不需要渲染，那么下面的几步也不会继续运行：
有时候浏览器希望两次「定时器任务」是合并的，他们之间只会穿插着 microTask 的执行，而不会穿插屏幕渲染相关的流程（比如requestAnimationFrame，下面会写一个例子）。
5、对于需要渲染的文档，如果窗口的大小发生了变化，执行监听的 resize 方法。
6、对于需要渲染的文档，如果页面发生了滚动，执行 scroll 方法。
7、对于需要渲染的文档，执行帧动画回调，也就是 requestAnimationFrame 的回调。（后文会详解）
8、对于需要渲染的文档， 执行 IntersectionObserver 的回调。
9、对于需要渲染的文档，重新渲染绘制用户界面。
10、判断 task队列和microTask队列是否都为空，如果是的话，则进行 Idle 空闲周期的算法，判断是否要执行 requestIdleCallback 的回调函数。

对于 resize 和 scroll 来说，并不是到了这一步才去执行滚动和缩放，那岂不是要延迟很多？浏览器当然会立刻帮你滚动视图，根据CSSOM 规范所讲，浏览器会保存一个 pending scroll event targets，等到事件循环中的 scroll 这一步，去派发一个事件到对应的目标上，驱动它去执行监听的回调函数而已。resize 也是同理。也就是事件线程会将滚动事件对象在用户触发的时候放到任务队列中。等待JS执行。

## 多任务队列
事件循环中可能会有一个或多个任务队列，这些队列分别为了处理：多个宏任务队列，一个微任务队列

http异步请求队列、DOM事件队列、GUI渲染队列、timer队列

浏览器会在保持任务顺序的前提下，可能分配四分之三的优先权给鼠标和键盘事件，保证用户的输入得到最高优先级的响应，而剩下的优先级交给其他 Task，并且保证不会“饿死”它们。

这个规范也导致 Vue 2.0.0-rc.7 这个版本 nextTick 采用了从微任务 MutationObserver 更换成宏任务 postMessage 而导致了一个 Issue。简单描述一下就是采用了 task 实现的 nextTick，在用户持续滚动的情况下 nextTick 任务被延后了很久才去执行，导致动画跟不上滚动了。迫于无奈，尤大还是改回了 microTask 去实现 nextTick，当然目前来说 promise.then 微任务已经比较稳定了，并且 Chrome 也已经实现了 queueMicroTask 这个官方 API。不久的未来，我们想要调用微任务队列的话，也可以节省掉实例化 Promise 在开销了。

宏任务可能会合并一起渲染、但是宏任务执行时产生的微任务是一定会执行的。
## requestAnimationFrame

### 在重新渲染前调用。

为什么要在重新渲染前去调用？因为 rAF 是官方推荐的用来做一些流畅动画所应该使用的 API，做动画不可避免的会去更改 DOM，而如果在渲染之后再去更改 DOM，那就只能等到下一轮渲染机会的时候才能去绘制出来了，这显然是不合理的。rAF在浏览器决定渲染之前给你最后一个机会去改变 DOM 属性，然后很快在接下来的绘制中帮你呈现出来，所以这是做流畅动画的不二选择。

假设我们现在想要快速的让屏幕上闪烁 红、蓝两种颜色，保证用户可以观察到，如果我们用 setTimeout 来写，并且带着我们长期的误解「宏任务之间一定会伴随着浏览器绘制」，那么你会得到一个预料之外的结果。如果这两个 Task 之间正好遇到了浏览器认定的渲染机会，那么它会重绘，否则就不会。由于这俩宏任务的间隔周期太短了，所以很大概率是不会的。如果你把延时调整到 17ms 那么重绘的概率会大很多，毕竟这个是一般情况下 60fps 的一个指标。但是也会出现很多不绘制的情况，所以并不稳定。
```
setTimeout(() => {
  document.body.style.background = "red"
  setTimeout(() => {
    document.body.style.background = "blue"
  })
})

```

如果用rAf呢 可以稳定绘制
```
let i = 10
let req = () => {
  i--
  requestAnimationFrame(() => {
    document.body.style.background = "red"
    requestAnimationFrame(() => {
      document.body.style.background = "blue"
      if (i > 0) {
        req()
      }
    })
  })
}

req()
```
### 很可能在宏任务之后不调用 --- 定时器合并

在第一节解读规范的时候，第 4 点中提到了，定时器宏任务可能会直接跳过渲染。
按照一些常规的理解来说，宏任务之间理应穿插渲染，而定时器任务就是一个典型的宏任务，看一下以下的代码：
```
setTimeout(() => {
  console.log("sto")
  requestAnimationFrame(() => console.log("rAF"))
})
setTimeout(() => {
  console.log("sto")
  requestAnimationFrame(() => console.log("rAF"))
})

queueMicrotask(() => console.log("mic"))
queueMicrotask(() => console.log("mic"))

理想结果 --- 每一个宏任务之后都紧跟着一次渲染
mic
mic
sto
rAF
sto
rAF

真实结果 --- 浏览器会合并这两个定时器任务
mic
mic
sto
sto
rAF
rAF
```
## requestAnimationFrame 和 微任务 的执行顺序

requestAnimationFrame(() => console.log("rAF"));
queueMicrotask(() => console.log("mic"));

或者

queueMicrotask(() => console.log("mic"));
requestAnimationFrame(() => console.log("rAF"));

都是先执行微任务 再执行 requestAnimationFrame
## requestIdleCallback
意图是让我们把一些计算量较大但是又没那么紧急的任务放到空闲时间去执行。不要去影响浏览器中优先级较高的任务，比如动画绘制、用户输入等等。

requestIdleCallback 是一个兼容性不那么好的功能，所以我们使用前得判断它是否支持
我们可以使用 window.requestIdleCallback() 方法来插入一个函数，这个函数将在浏览器空闲时被调用；requestIdleCallback
 它的参数为 callback 和 可选的 timeout；如果指定了 timeout 且为正值；则回调在 timeout 毫秒后还没调用时，回调任务就会被放入事件循环里排队，这样做可能会影响性能；


注意点：因为它发生在一帧的最后，此时页面布局已经完成，所以不建议在 requestIdleCallback 里再操作 DOM，这样会导致页面再次重绘。

### 渲染有序进行
Run Task -> Update Rendering -> idle callback | Run Task -> Update Rendering -> idle callback

当然，这种有序的 浏览器 -> 用户 -> 浏览器 -> 用户 的调度基于一个前提，就是我们要把任务切分成比较小的片，不能说浏览器把空闲时间让给你了，你去执行一个耗时 10s 的任务，那肯定也会把浏览器给阻塞住的。这就要求我们去读取 rIC 提供给你的 deadline 里的时间，去动态的安排我们切分的小任务。浏览器信任了你，你也不能辜负它呀。

### 渲染长期空闲

还有一种情况，也有可能在几帧的时间内浏览器都是空闲的，并没有发生任何影响视图的操作，它也就不需要去绘制页面：

Update Rendering -> 50ms deadline -> Update Rendering

这种情况下为什么还是会有 50ms 的 deadline 呢？是因为浏览器为了提前应对一些可能会突发的用户交互操作，比如用户输入文字。如果给的时间太长了，你的任务把主线程卡住了，那么用户的交互就得不到回应了。50ms 可以确保用户在无感知的延迟下得到回应。


1、当浏览器判断这个页面对用户不可见时，这个回调执行的频率可能被降低到 10 秒执行一次，甚至更低。这点在解读 EventLoop 中也有提及。

2、如果浏览器的工作比较繁忙的时候，不能保证它会提供空闲时间去执行 rIC 的回调，而且可能会长期的推迟下去。所以如果你需要保证你的任务在一定时间内一定要执行掉，那么你可以给 rIC 传入第二个参数 timeout。
这会强制浏览器不管多忙，都在超过这个时间之后去执行 rIC 的回调函数。所以要谨慎使用，因为它会打断浏览器本身优先级更高的工作。

3、最长期限为 50 毫秒，是根据研究得出的，研究表明，人们通常认为 100 毫秒内对用户输入的响应是瞬时的。 将闲置截止期限设置为 50ms 意味着即使在闲置任务开始后立即发生用户输入，浏览器仍然有剩余的 50ms 可以在其中响应用户输入而不会产生用户可察觉的滞后。

4、每次调用 timeRemaining() 函数判断是否有剩余时间的时候，如果浏览器判断此时有优先级更高的任务，那么会动态的把这个值设置为 0，否则就是用预先设置好的 deadline - now 去计算。

5、这个 timeRemaining() 的计算非常动态，会根据很多因素去决定，所以不要指望这个时间是稳定的。

### 动画例子

#### 滚动

如果我鼠标不做任何动作和交互，直接在控制台通过 rIC 去打印这次空闲任务的剩余时间，一般都稳定维持在 49.xx ms，因为此时浏览器没有什么优先级更高的任务要去处理。

而如果我不停的滚动浏览器，不断的触发浏览器的重新绘制的话，这个时间就变的非常不稳定了。

通过这个例子，你可以更加有体感的感受到什么样叫做「繁忙」，什么样叫做「空闲」。

#### 动画

这个动画的例子很简单，就是利用rAF在每帧渲染前的回调中把方块的位置向右移动 10px。

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      #SomeElementYouWantToAnimate {
        height: 200px;
        width: 200px;
        background: red;
      }
    </style>
  </head>
  <body>
    <div id="SomeElementYouWantToAnimate"></div>
    <script>
      var start = null
      var element = document.getElementById("SomeElementYouWantToAnimate")
      element.style.position = "absolute"

      function step(timestamp) {
        if (!start) start = timestamp
        var progress = timestamp - start
        element.style.left = Math.min(progress / 10, 200) + "px"
        if (progress < 2000) {
          window.requestAnimationFrame(step)
        }
      }
      // 动画
      window.requestAnimationFrame(step)

      // 空闲调度
      window.requestIdleCallback(() => {
        alert("rIC")
      })
    </script>
  </body>
</html>
```
注意在最后我加了一个 requestIdleCallback 的函数，回调里会 alert('rIC')，来看一下演示效果：

alert 在最开始的时候就执行了，为什么会这样呢一下，想一下「空闲」的概念，我们每一帧仅仅是把 left 的值移动了一下，做了这一个简单的渲染，没有占满空闲时间，所以可能在最开始的时候，浏览器就找到机会去调用 rIC 的回调函数了。

我们简单的修改一下 step 函数，在里面加一个很重的任务，1000 次循环打印。
```
function step(timestamp) {
  if (!start) start = timestamp
  var progress = timestamp - start
  element.style.left = Math.min(progress / 10, 200) + "px"
  let i = 1000
  while (i > 0) {
    console.log("i", i)
    i--
  }
  if (progress < 2000) {
    window.requestAnimationFrame(step)
  }
}
```

其实和我们预期的一样，由于浏览器的每一帧都"太忙了",导致它真的就无视我们的 rIC 函数了。

如果给 rIC 函数加一个 timeout 呢：

// 空闲调度
window.requestIdleCallback(
  () => {
    alert("rID")
  },
  { timeout: 500 },
)

浏览器会在大概 500ms 的时候，不管有多忙，都去强制执行 rIC 函数，这个机制可以防止我们的空闲任务被“饿死”。



