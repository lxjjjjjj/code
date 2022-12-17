[原文链接](https://juejin.cn/post/7098556679242907662)

# 概念上
loader。webpack 自带的功能只能处理 javaScript 和 JSON 文件，loader 让 webpack 能够去处理其他类型的文件，并将它们转换成有效的模块，以及被添加到依赖图中。

plugin。插件可以执行范围更广的任务，包括打包优化，资源管理，注入环境变量

# 执行顺序上

plugin

plugin 的执行时机和 webpack 钩子或者其他插件的钩子有关，本质上利用的是 Tapable 定义的钩子。webpack 提供了各种各样的钩子，可以看这里。因此如果想要熟练开发 webpack 插件，一定要对 Tapable 用法比较熟悉。我手写了 Tapable 所有的钩子，解读了 Tapable 的源码，并提供了使用 Demo，具体可以看这里

loader

默认情况下，loader 按照我们在配置文件中配置的 module.rules 从下往上，从右到左依次执行。但是可以通过 enforce 以及 inline loader 修改 loader 的执行顺序。
rules: [
  {
    test: /\.js$/,
    use: {
      loader: "loader3",
    },
    enforce: "pre", // enforce: 'post'
  },
];

# 源码上
从 webpack 调用 loader 以及 plugin 的时机简单介绍

loader 的调用在lib/NormalModule中。
webpack 在打包我们的源码时，会从入口模块开始构建依赖(主要流程在 Compilation.js 中)。对每一个文件都会依次执行下面的顺序：

调用 NormalModule.build() 构建模块(一个文件对应一个 NormalModule)
对每一个模块调用 runLoaders 执行模块匹配的 loaders，获取经过 loader 处理后的模块源码
调用 this.parser.parse() 解析处理后的模块源码，提取模块依赖
对提取的模块依赖，再重复以上过程

可以看出，loader 的执行在依赖解析之前完成



plugin 的调用时机就比较灵活。实际上 webpack 在整个生命周期都会调用相应的钩子。比如

在根据文件路径解析模块时，会调用相应的 resolvers 钩子。

假设有个需求，需要分析都有哪些文件引用了 product.js 这个文件，此时就可以使用 resolvers 钩子。

