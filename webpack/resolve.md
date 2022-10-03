[resolve](https://juejin.cn/post/6844903779712630797)

# 前提介绍
webpack 的特点之一是处理一切模块，我们可以将逻辑拆分到不同的文件中，然后通过模块化方案进行导出和引入。现在 ES6 的 Module 则是大家最常用的模块化方案，所以你一定写过 import './xxx' 或者 import 'something-in-nodemodules' 再或者 import '@/xxx'(@ 符号通过 webpack 配置中 alias 设置)。webpack 处理这些模块引入 import 的时候，有一个重要的步骤，就是如何正确的找到 './xxx'、'something-in-nodemodules' 或者 '@/xxx' 等等对应的是哪个文件。这个步骤就是 resolve 的部分需要处理的逻辑。

其实不仅是针对源码中的模块需要 resolve，包括 loader 在内，webpack 的整体处理过程中，涉及到文件路径的，都离不开 resolve 的过程。
同时 webpack 在配置文件中有一个 resolve 的配置，可以对 resolve 的过程进行适当的配置，比如设置文件扩展名，查找搜索的目录等(更多的参考[官方介绍](https://webpack.docschina.org/configuration/resolve/#resolve))。
下面，将主要介绍针对普通文件的 resolve 流程 和 loader 的 resolve 主流程。

## 普通文件的 resolve 流程

## loader 的 resolve 主流程