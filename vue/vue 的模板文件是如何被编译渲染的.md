[原文链接](https://juejin.cn/post/6863241580753616903)

vue.js： 完整版本，包含了模板编译的能力；
vue.runtime.js： 运行时版本，不提供模板编译能力，需要通过 vue-loader 进行提前编译。

```
// 需要编译器
new Vue({
    template: '<div>{{ hi }}</div>'
})
// 不需要编译器
new Vue({
    render(h) {
        return h('div', this.hi)
    }
})
```
简单来说，就是如果你用了 vue-loader ，就可以使用 vue.runtime.min.js，将模板编译的过程交过 vue-loader，如果你是在浏览器中直接通过 script 标签引入 Vue，需要使用 vue.min.js，运行的时候编译模板。

正则表达式匹配开始字符和结束字符并且对静态节点写上标注做一些优化

模板编译，将模板代码转化为 AST；
优化 AST，方便后续虚拟 DOM 更新；
生成代码，将 AST 转化为可执行的代码 renderFunction
