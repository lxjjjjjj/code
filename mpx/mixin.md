为什么会有mixin

Mpx 提供了一套完善的 mixin 机制，有人可能要问，原生小程序中已经支持了 behaviors，为何我们还需要提供 mixin 呢？主要有以下两点原因：

1.Behaviors 是平台限度的，只有在部分小程序平台中可以使用，而且内置 behaviors 承载了除了 mixin 外的其他功能，框架提供的 mixin 是一个与平台无关的基础能力；

2.Behaviors 只有组件支持使用，页面不支持，而且只支持局部声明，框架提供的 mixin 与组件页面无关，且支持全局 mixin 声明。
mixin的执行时机

Mixin 混合实例对象可以像正常的实例对象一样包含选项，相同选项将进行逻辑合并。举例：如果 mixin1 包含一个钩子 ready,而创建组件 Component 也有一个钩子 ready，两个函数将被调用。 Mixin 钩子按照传入顺序(数组顺序)依次调用，并在调用组件自身的钩子之前被调用。


[mixin](https://mpxjs.cn/guide/advance/mixin.html#局部-mixin)