# vue-loader
[原文链接](https://juejin.cn/post/6937125495439900685)

vue-loader要配合vueloaderPlugin一起使用
[style代码的三个阶段](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/2/21/1690f6d4e5b01478~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)
[template代码的三个阶段](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/2/21/1690f6d95599feef~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)

vue-loader 主要包含三部分：

lib/index.js 定义的 normal loader
lib/loaders/pitcher.js 定义的 pitcher loader
lib/plugin.js 定义的插件
# 总结

预处理阶段：在vue-loader-plugin中处理
1.在插件中生成匹配xxx.vue?vue 的 pitcher loader放到rule数组的最前面确保比别的rules更前置处理内容。
2.插件重新给用户rules规定resourceQuery，clone rules 内 不是 resourceQuery 设定匹配的rules(不是用户自定义的rules)，用以lang参数结尾的虚拟路径使用户匹配的rules让rules生效。

内容处理阶段：normal loader 配合 pitcher loader 完成文件内容转换

1. 第一次进入vue-loader内并没有真的处理 block 里面的内容，而是简单地针对不同类型的内容块生成import语句

Script："./index.vue?vue&type=script&lang=js&"
Template: "./index.vue?vue&type=template&id=2964abc9&scoped=true&"
Style: "./index.vue?vue&type=style&index=0&id=2964abc9&scoped=true&lang=css&"

2. 生成的内容匹配pitcher规则，执行pitcher

```
const pitcher = {
  loader: require.resolve('./loaders/pitcher'),
  resourceQuery: query => {
    if (!query) { return false }
    const parsed = qs.parse(query.slice(1))
    return parsed.vue != null
  }
}

```
3. pitcher 转换import路径, 遍历用户定义的rule数组，拼接出完整的行内引用路径
  
比如
```
import mod from "-!../../node_modules/babel-loader/lib/index.js??clonedRuleSet-2[0].rules[0].use!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=script&lang=js&";
```
4. 第二次执行vue-loader
因为pitcher loader有熔断效果所以return内容之后会返回上一次执行的loader也就是vue-loader中，
根据生成的行内loader的配置，会依次

* 调用 vue-loader 处理 index.js 文件
* 调用 babel-loader 处理上一步返回的内容

vue-loader第二次执行因为路径query中有了type参数，所以可以做到根据不同type返回不同的内容


路径命中 /.vue$/i 规则，调用 vue-loader 生成中间结果A
结果A命中 xx.vue?vue 规则，调用 vue-loader pitcher 生成中间结果B
结果B命中具体loader，直接调用loader做处理



* 可以在插件中动态修改webpack的配置信息
* Loader 并不一定都要实实在在的处理文件的内容，也可以是返回一些更具体，更有指向性的新路径，以复用webpack的其他模块
* 灵活使用 resourceQuery ，能够在loader中更精准地命中特定路径格式


Vue SFC 文件包含多种格式的内容：style、script、template以及自定义block，vue-loader 如何分别处理这些内容？

在vue-loader中，给原始文件路径增加不同的参数，后续配合 resourceQuery 函数就可以分开处理这些内容，这样的实现相比于一次性处理，逻辑更清晰简洁，更容易理解

针对不同内容块，vue-loader 如何复用其他loader？比如针对 less 定义的style块，vue-loader 是怎么调用 less-loader 加载内容的？

经过 normal loader、pitcher loader 两个阶段后，SFC 内容会被转化为 import xxx from '!-babel-loader!vue-loader?xxx' 格式的引用路径，以此复用用户配置。

此外，从 vue-loader 可以学到一些webpack 插件、loader的套路：

可以在插件中动态修改webpack的配置信息
Loader 并不一定都要实实在在的处理文件的内容，也可以是返回一些更具体，更有指向性的新路径，以复用webpack的其他模块
灵活使用 resourceQuery ，能够在loader中更精准地命中特定路径格式
