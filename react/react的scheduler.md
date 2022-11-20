[原文链接](https://juejin.cn/post/7087933643821154312)

# 前言

我们都知道react可以运行在node环境中和浏览器环境中，所以在不同环境下实现requesHostCallback等函数的时候采用了不同的方式，其中在node环境下采用setTimeout来实现任务的及时调用，浏览器环境下则使用MessageChannel。这里引申出来一个问题，react为什么放弃了requesIdleCallback和setTimeout而采用MessageChannel来实现。这一点我们可以在这个PR中看到一些端倪。

* 由于requestIdleCallback依赖于显示器的刷新频率，使用时需要看vsync cycle（指硬件设备的频率）的脸色

* MessageChannel方式也会有问题，会加剧和浏览器其它任务的竞争

* 为了尽可能每帧多执行任务，采用了5ms间隔的消息event发起调度，也就是这里真正有必要使用postmessage来传递消息

* 对于浏览器在后台运行时postmessage和requestAnimationFrame、setTimeout的具体差异还不清楚，假设他们拥有同样的优先级。

react团队做这一改动可能是react团队更希望控制调度的频率，根据任务的优先级不同，提高任务的处理速度，放弃本身对于浏览器帧的依赖。优化react的性能（concurrent）

## ScheduleCallback 注册任务
根据优先级不同timeout不同，最终导致任务的过期时间不同，而任务的过期时间是用来排序的唯一条件。所以我们可以理解优先级最高的任务，过期时间越短，任务执行的靠前。 如果是延迟任务则将 newTask 放入延迟调度队列（timerQueue）并执行 requestHostTimeout。如果是正常任务则将 newTask 放入正常调度队列（taskQueue）并执行 requestHostCallback。同时react也会根据不同的任务优先级设置不同的过期时间ImmediatePriority > UserBlockingPriority > NormalPriority > LowPriority > IdlePriority

## requestHostCallback调度任务
调用flushWork消费任务，并且给任务过期事件添加5ms时间尽可能多的执行任务。上一个任务执行完才执行下一个任务

```
// 调度一个主线程回调，如果已经执行了一个任务，等到下一次交还执行权的时候再执行回调。
// 立即调度
if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback(flushWork);
}
```
```
const channel = new MessageChannel();
const port = channel.port2;
// 收到消息之后调用performWorkUntilDeadline来处理
channel.port1.onmessage = performWorkUntilDeadline;
requestHostCallback = function(callback) {
    scheduledHostCallback = callback;
    if (!isMessageLoopRunning) {
      isMessageLoopRunning = true;
      port.postMessage(null);
    }
  };
```

performWorkUntilDeadline

可以看到这个函数主要的逻辑设置deadline为当前时间加上5ms 对应前言提到的5ms，同时开始消费任务并判断是否还有新的任务以决定后续的逻辑

## flushWork 消费任务

可以看到消费任务的主要逻辑是在workLoop这个循环中实现的，我们在React工作循环一文中有提到的任务调度循环。concurrent模式下，callback是performConcurrentWorkOnRoot，其内部根据当前调度的任务是否相同，来决定是否返回自身，如果相同，则说明还有任务没做完，返回自身，其作为新的callback被放到当前的task上。while循环完成一次之后，检查shouldYieldToHost，如果需要让出执行权，则中断循环，走到下方，判断currentTask不为null，返回true，说明还有任务，回到performWorkUntilDeadline中，判断还有任务，继续port.postMessage(null)，调用监听函数performWorkUntilDeadline，继续执行任务。return 的结果会作为 performWorkUntilDeadline 中hasMoreWork的依据。高优先级任务完成后，currentTask.callback为null，任务从taskQueue中删除，此时队列中还有低优先级任务，currentTask = peek(taskQueue)  currentTask不为空，说明还有任务，继续postMessage执行workLoop，但它被取消过，导致currentTask.callback为null。所以会被删除，此时的taskQueue为空，低优先级的任务重新调度，加入taskQueue。


workLoop本身是一个大循环，这个循环非常重要。此时实现了时间切片和fiber树的可中断渲染。首先我们明确一点task本身采用最小堆根据sortIndex也即expirationTime。并通过
peek方法从taskQueue中取出来最紧急的任务。
每次while循环的退出就是一个时间切片，详细看下while循环退出的条件，可以看到一共有两种方式可以退出

队列被清空：这种情况就是正常下情况。见49行从taskQueue队列中获取下一个最紧急的任务来执行，如果这个任务为null，则表示此任务队列被清空。退出workLoop循环


workLoop本身是一个大循环，这个循环非常重要。此时实现了时间切片和fiber树的可中断渲染。首先我们明确一点task本身采用最小堆根据sortIndex也即expirationTime。并通过
peek方法从taskQueue中取出来最紧急的任务。
每次while循环的退出就是一个时间切片，详细看下while循环退出的条件，可以看到一共有两种方式可以退出

队列被清空：这种情况就是正常下情况。见49行从taskQueue队列中获取下一个最紧急的任务来执行，如果这个任务为null，则表示此任务队列被清空。退出workLoop循环


workLoop本身是一个大循环，这个循环非常重要。此时实现了时间切片和fiber树的可中断渲染。首先我们明确一点task本身采用最小堆根据sortIndex也即expirationTime。并通过peek方法从taskQueue中取出来最紧急的任务。每次while循环的退出就是一个时间切片，详细看下while循环退出的条件，可以看到一共有两种方式可以退出

1.队列被清空：这种情况就是正常下情况。见49行从taskQueue队列中获取下一个最紧急的任务来执行，如果这个任务为null，则表示此任务队列被清空。退出workLoop循环

2.任务执行超时：在执行任务的过程中由于任务本身过于复杂在执行task.callback之前就会判断是否超时（shouldYieldToHost）。如果超时也需要退出循环交给performWorkUntilDeadline发起下一次调度，与此同时浏览器可以有空闲执行别的任务。因为本身MessageChannel监听事件是一个异步任务，故可以理解在浏览器执行完别的任务后会继续执行performWorkUntilDeadline。每次任务执行结束都会更新当前的node节点记住当前节点的位置。

# 时间切片原理
消费任务队列的过程中, 可以消费1~n个 task, 甚至清空整个 queue. 但是在每一次具体执行task.callback之前都要进行超时检测, 如果超时可以立即退出循环并等待下一次调用。
# 可中断渲染原理
在时间切片的基础之上, 如果单个callback执行的时间过长。就需要task.callback在执行的时候自己判断下是否超时，所以concurrent模式下，fiber树每构建完一个单元都会判断是否超时。如果超时则退出循环并返回回调，等待下次调用，完成之前没有完成的fiber树构建。










