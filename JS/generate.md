[原文链接](https://juejin.cn/post/7007623509174124580)
# generator的特点
1、function关键字与函数名之间有一个星号 "*" 。
2、函数体内使用 yield 表达式，定义不同的内部状态 （可以有多个yield）。
3、直接调用 Generator函数并不会执行，也不会返回运行结果，而是返回一个迭代器对象（Iterator Object）。
4、依次调用遍历器对象的next方法，遍历 Generator函数内部的每一个状态。
