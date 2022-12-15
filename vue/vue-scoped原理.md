[原文链接](https://juejin.cn/post/6991354556349153293)
在vue文件中的style标签上，有一个特殊的属性：scoped。当一个style标签拥有scoped属性时，它的CSS样式就只能作用于当前的组件，也就是说，该样式只能适用于当前组件元素。通过该属性，可以使得组件之间的样式不互相污染。如果一个项目中的所有style标签全部加上了scoped，相当于实现了样式的模块化。

# 浅入原理
每个 Vue 文件都将对应一个唯一的 id，该 id 根据文件路径名和内容 hash 生成，通过组合形成scopeId。编译 template 标签时，会为每个标签添加了当前组件的scopeId，如：

```
<div class="demo">test</div>
// 会被编译成:
<div class="demo" data-v-12e4e11e>test</div>
```

编译 style 标签时，会根据当前组件的 scopeId 通过属性选择器和组合选择器输出样式，如:
```
.demo{ color: red; }
// 会被编译成:
.demo[data-v-12e4e11e]{ color: red; }
```
这样就相当为我们配置的样式加上了一个唯一表示。但是，有两个问题：渲染的 HTML 标签上的 data-v-xxx 属性是如何生成的? CSS 代码中的添加的属性选择器是如何实现的?
每个 Vue 文件都将对应一个唯一的 id，该 id 根据文件路径名和内容 hash 生成，通过组合形成scopeId。
编译 template 标签时，会为每个标签添加了当前组件的scopeId，如：

```
<div class="demo">test</div>
// 会被编译成:
<div class="demo" data-v-12e4e11e>test</div>
```

编译 style 标签时，会根据当前组件的 scopeId 通过属性选择器和组合选择器输出样式，如:
```
.demo{color: red;}
// 会被编译成:
.demo[data-v-12e4e11e]{color: red;}
```
这样就相当为我们配置的样式加上了一个唯一表示。
但是，有两个问题：

渲染的 HTML 标签上的 data-v-xxx 属性是如何生成的?
CSS 代码中的添加的属性选择器是如何实现的?

## resourceQuery
resourceQuery 的作用是，根据引入文件路径参数的匹配路径，vue-loader 中就是通过 resourceQuery 拼接不同的 query参数，将各个标签分配给对应的 loader 进行处理。
```
{
  test: /.css$/,
  resourceQuery: /inline/,
  use: 'url-loader'
}
// 当引入文件路径携带query参数匹配时，也将加载该loader
import Foo from './foo.css?inline'
```
## loader.pitch
正常情况，loader 的执行是从右到左，但是其实在从右到左执行之前，会先 从左到右 调用 loader 上的 pitch 方法。例如：
```
module.exports = {
//...
module: {
    rules: [
      {
//...
        use: ['a-loader', 'b-loader', 'c-loader'],
      },
    ],
  },
};
```
将会发生这些步骤：
```
|- a-loader `pitch`
  |- b-loader `pitch`
    |- c-loader `pitch`
      |- requested module is picked up as a dependency
    |- c-loader normal execution
  |- b-loader normal execution
|- a-loader normal execution
```
那在 pitching 阶段能做些什么？首先，传递给 pitch 方法的 data，在执行阶段也会暴露在 this.data 之下，并且可以用于在循环时，捕获并共享前面的信息。
```
module.exports = function (content) {
  // this.data.value = 42
  return someSyncOperation(content, this.data.value);
};
module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  data.value = 42;
};
```
其次，如果某个 loader 在 pitch 方法中给出一个结果，那么这个过程会回过身来，并跳过剩下的 loader。在我们上面的例子中，如果 b-loader 的 pitch 方法返回了一些东西：
```
module.exports = function (content) {
  return someSyncOperation(content);
};
module.exports.pitch = function (remainingRequest, precedingRequest, data) {
  if (someCondition()) {
    return (
      'module.exports = require(' +
      JSON.stringify('-!' + remainingRequest) +
      ');'
    );
  }
};
```
上面的步骤将被缩短为：
```
|- a-loader `pitch`
  |- b-loader `pitch` returns a module
|- a-loader normal execution
```
## VueLoaderPlugin
VueLoaderPlugin主要做的两件事:

一个是注册公共的 pitcher。
一个是复制 webpack 的 rules。
## vue-loader
根据 query.type 注入处理对应标签的 loader。由于 loader.pitch 会先于 loader 执行 ，在捕获阶段执行，检查query.type 并直接调用相关的 loader。

[图片链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d192d8311c83421b94521a59b980abce~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
```
type = style，执行 stylePostLoader
type = template，执行 templateLoader
```
## prepare
1.生成单文件唯一的哈希 ID。
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/32a51b85c7184e37a6b7f660403324ad~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
2.处理template标签，拼接 query 参数
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0f4348698bd94d568b9c284dc7a9c99f~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
3.处理style标签，为每个标签拼接 type=style 等参数
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/770a423340c0472ba2db4e1a1ce3813d~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/89629f69690e42d384c5eb7984c8c158~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
准备工作做好之后，就是不用的 type 调用不用的 loader 进行处理。第一个就是对 template 的处理，templateLoader。
## templateLoader
回头来看，Vue 中一个组件最后都会生成 render 方法，然后 render 生成 VNode，vnode 是描述组件对应的 HTML 标签和结构，一个 vnode 包含了渲染 DOM 节点需要的基本属性，当然这里的基本属性也包含了scopeId。那这里的 scopeId 怎么最后到 DOM 上的了? 在templateLoader.js中,当scopre=true的 template 的文件会根据单文件唯一的哈希 ID生成一个 scopeId。
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2858dc29871045f2af710971606a009e~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
接下来就是通过模板编译器将模板生成我们熟悉的 vnode，这个过程中，会对配置属性进行处理，也就是在这个过程中，scopeId，被解析到vnode 的配置属性。然后在 render 函数执行时调用 createElement ，作为 vnode 的原始属性，渲染成到 DOM 节点上。这也回答了上文提到的第一个问题「渲染的 HTML 标签上的 data-v-xxx 属性是如何生成的？ 」。
[添加id链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b7f722e59734b31bbc740f00620ee48~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

## stylePostLoader
templateLoader，解决了 id 渲染 DOM 上面的问题，而 stylePostLoader 的作用就是在 Css 中添加属性选择器。
在stylePostLoader.js中生成一个 id ，同一个单页面组件中的 style，与 templateLoader 中的 scopeId 保持一致。
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0c5141b465aa43bcbe2fec6881a24af0~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
然后通过 PostCSS 解析 style 标签内容，同时通过 scopedPlugin 为每个选择器追加一个 [scopeId] 的属性选择器。
[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd2e836e16674ae6af0f40abb2a1314e~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
这里还会对 scoped 有一些特殊处理。对于 '>>>' 、 '/deep/'、::v-deep、pseudo等特殊选择器时，将不会将 [scopeId] 的属性选择器追加。

[源码链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/040d4943af354c93970f00a9aedcfdbe~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

到这里对于文章之前提到的第二个问题「CSS 代码中的添加的属性选择器是如何实现的?」，就水落石出了，通过 selector.insertAfter为当前styles下的每一个选择器添加了属性选择器，其值即为传入的[scopeId]。
由于只有当前组件渲染的DOM节点上上面存在相同的属性，从而就实现了 css scoped 的效果。


本文简单浅析了 Vue scoped 的底层实现原理。vue-loader 通过生成哈希 ID，根据 type 的不同调用不同的 loader 将，哈希 ID分别注入到 DOM 和属性选择器中。实现 CSS 局部作用域的效果。CSS Scoped 可以算作为 Vue 定制的一个处理原生 CSS 作用域的解决方案。







