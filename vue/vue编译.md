[如何将template编译成AST](https://juejin.cn/post/7116296421816418311)
[模型树的优化](https://juejin.cn/post/7117085295798911012)
[render code的生成](https://juejin.cn/post/7121504219588198413)
[vue3 编译之美](https://juejin.cn/post/7124890499478978597)
[vue3 空白字符的处理](https://juejin.cn/post/7127074001897127943)
[web components](https://juejin.cn/post/7153521106916212744)
Vue.js 提供了 2 个版本，一个是 Runtime + Compiler 版本，一个是 Runtime only 版本。Runtime + Compiler 版本是包含编译代码的，可以把编译过程放在运行时做，Runtime only 版本不包含编译代码的，需要借助 webpack 的 vue-loader 事先把模板编译成 render 函数。

如果你需要在客户端编译模板 (比如传入一个字符串给 template 选项，或挂载到一个元素上并以其 DOM 内部的 HTML 作为模板)，就将需要加上编译器，即完整版：

```
// 需要编译器
new Vue({
  template: '<div>{{ hi }}</div>'
})

// 不需要编译器
new Vue({
  render (h) {
    return h('div', this.hi)
  }
})
```
当使用 vue-loader 或 vueify 的时候，*.vue 文件内部的模板会在构建时预编译成 JavaScript。你在最终打好的包里实际上是不需要编译器的，所以只用运行时版本即可。因为运行时版本相比完整版体积要小大约 30%，所以应该尽可能使用这个版本。

在 Vue 的整个编译过程中，会做三件事：

解析模板 parse ，生成 AST
优化 AST optimize
生成代码 generate

对编译过程的了解会让我们对 Vue 的指令、内置组件等有更好的理解。不过由于编译的过程是一个相对复杂的过程，我们只要求理解整体的流程、输入和输出即可，对于细节我们不必抠太细。由于篇幅较长，这里会用三篇文章来讲这三件事。这是第一篇， 模板解析，template -> AST 。

利用相关的正则开始匹配html字符串，在匹配到开始标签的时候会触发start钩子的时候会创建vnode对象 stack++，匹配到结束标签会触发end钩子，进行stack--。chars钩子用于解析文本节点(不同的文本type)，commit钩子用于匹配注释节点，要注意的是纯文本节点和注释节点的描述对象的 type 都是 3，不同的是注释节点的元素描述对象拥有 isComment 属性，并且该属性的值为 true，目的就是用来与普通文本节点作区分的。


为什么要做优化？

永远不需要变化的 DOM 就是静态的。
重新渲染时，作为常量，无需创建新节点；

markStatic$1(root) 标记静态节点
markStaticRoots(root, false) 标记静态根

isStatic函数会根据元素的 type和元素的属性进行节点动静态的判断。

静态节点

如果type = 2说明这一点是一个动态节点，因为包含表达式
如果type = 3说明可能是纯文本节点或者是注释节点，可以标记为静态节点
如果元素节点有：

pre 属性，使用了 v-pre指令，标记为静态节点
如果没有动态绑定，没有使用v-if、v-for，不是内置标签（slot,component），是平台保留标签（HTML 标签和 SVG 标签），不是 template 标签的直接子元素并且没有包含在 for 循环中，节点包含的属性只能有 isStaticKey 中指定的几个，那么就标记为静态节点。






