[1](https://juejin.cn/post/6844903830266576909)
[2](https://juejin.cn/post/6844903833445859335)
[3](https://juejin.cn/post/7052609791641780260)
任务调度队列来处理并发任务

版本 5 中对于 Compilation 上的一些实例属性全部通过了 new AsyncQueue 的形式来定义成为异步调度器队列。

在调度器中通过 processor 属性传入了对应的处理方法，使用 AsyncQueue 来管理内部的调度顺序。


[webpack4生成module的流程图](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/4/28/16a61f6221b95d62~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)