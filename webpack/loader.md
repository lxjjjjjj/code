[loader1](https://juejin.cn/post/6844903780769595405)
[loader2](https://juejin.cn/post/6844903780777984008)
[loader3](https://juejin.cn/post/6844903780778000398)
# 什么是loader
[loader-api](https://v4.webpack.docschina.org/api/loaders)

[loader类型](https://juejin.cn/post/7017347786018390047)

[pitch loader场景](https://juejin.cn/post/7037696103973650463)

[关于pitch loader和normal loader的参数和返回值代表的含义](https://juejin.cn/post/7036379350710616078)

### loader 是什么的理解
```
webpack中loader的本质就是一个函数，接受我们的源代码作为入参同时返回新的内容。loader runner 会调用这个函数，然后把上一个 loader 产生的结果或者资源文件(resource file)传入进去。loader 用于对模块的源代码进行转换。loader 可以使你在 import 或 "load(加载)" 模块时预处理文件。因此，loader 类似于其他构建工具中“任务(task)”，并提供了处理前端构建步骤的得力方式。loader 可以将文件从不同的语言（如 TypeScript）转换为 JavaScript 或将内联图像转换为 data URL。loader 甚至允许你直接在 JavaScript 模块中 import CSS 文件！webpack中通过compilation对象进行模块编译时，会首先进行匹配loader处理文件得到结果(string/buffer),之后才会输出给webpack进行编译。简单来说，loader就是一个函数，通过它我们可以在webpack处理我们的特定资源(文件)之前进行提前处理。
比方说，webpack仅仅只能识别javascript模块，而我们在使用TypeScript编写代码时可以提前通过babel-loader将.ts后缀文件提前编译称为JavaScript代码，之后再交给Webapack处理。
```
### 四种loader 
```
匹配loader的执行顺序 如果use为一个数组时表示有多个loader依次处理匹配的资源，按照 从右往左(从下往上) 的顺序去处理。

行内 loader 通过!将资源中的 loader 进行分割，同时支持在 loader 后面，通过?传递参数

Pitching 阶段: loader 上的 pitch 方法，按照 后置(post)、行内(inline)、普通(normal)、前置(pre) 的顺序调用。

Normal 阶段: loader 上的 常规方法，按照 前置(pre)、普通(normal)、行内(inline)、后置(post) 的顺序调用。模块源码的转换， 发生在这个阶段。

关于normal loader本质上就是loader函数本身。
// loader函数本身 我们称之为loader的normal阶段
function loader(source) {
    // dosomething
    return source
}

关于pitch loader就是normal loader上的一个pitch属性，它同样是一个函数:
// pitch loader是normal上的一个属性
loader.pitch = function (remainingRequest,previousRequest,data) {
    // ...
}

pitch loader的重要性，pitch loader中如果存在非undefeind返回值的话，那么上述图中的整个loader chain会发生熔断效果。它会立马掉头将pitch函数的返回值去执行前置的noraml loader。正常执行时是会读取资源文件的内容交给normal loader去处理，但是pitch存在返回值时发生熔断并不会读取文件内容了。此时pitch函数返回的值会交给将要执行的normal loader。

何时应该将Loader设计为pitch loader

style-loader做的事情，所有的逻辑处理都在pitch loader中进行，normal loader是个空函数。
其次，style-loader做的事情很简单：它获得对应的样式文件内容，然后通过在页面创建style节点。将样式内容赋给style节点然后将节点加入head标签即可

```
### pitch loader的参数
```
1.remainingRequest
  需要注意的是remainingRequest与剩余loader有没有pitch属性没有关系，无论是否存在pitch属性remainingRequest都会计算pitch阶段还未处理剩余的loader。我们以loader2.pitch来举例:在loader.pitch函数中remainingRequest的值为xxx/loader3.js的字符串。如果说后续还存在多个loader,那么他们会以!进行分割。
2.previousRequest
  它表示pitch阶段已经迭代过的loader按照!分割组成的字符串。注意同样previousRequest和有无pitch属性没有任何关系。同时remainingRequest和previousRequest都是不包括自身的(也就是我们例子中都不包含loader2自身的绝对路径)。
3.data
  在normalLoader与pitch Loader进行交互正是利用了第三个data参数。当我们在loader2.pith函数中通过给data对象上的属性赋值时，比如data.name="19Qingfeng"。此时在loader2函数中可以通过this.data.name获取到自身pitch方法中传递的19Qingfeng。
```
### Normal Loader & Pitch Loader 返回值
```
上边其实我们已经详细讲过了关于Normal Loader和Pitch Loader的返回值。

Normal阶段，loader函数的返回值会在loader chain中进行一层一层传递直到最后一个loader处理后传递将返回值给webpack进行传递。

Pitch阶段，任意一个loader的pitch函数如果返回了非undefined的任何值，会发生熔断效果同时将pitch的返回值传递给normal阶段loader的函数。

需要额外注意的是，在normal阶段的最后一个loader一定需要返回一个js代码(一个module的代码，比如包含module.exports语句)。

```

## 实现一个style-loader

```
function styleLoader(source) {
  const script = `
    const styleEl = document.createElement('style')
    styleEl.innerHTML = ${JSON.stringify(source)}
    document.head.appendChild(styleEl)
  `;
  return script;
}

将style-loader设计成为normal loader

webpack解析到关于require(*.css)文件时，会交给style-loader去处理，最终将返回的script打包成一个module。
在通过require(*.css)执行后页面就会添加对应的style节点了。这里我们将style-loader的逻辑放在了normal阶段，而源码中放在了pitch阶段。那么是不是放在normal阶段也可以呢？ 接下来，让我们来换一种写法。

css-loader去一起处理css文件中的引入语句.如果把style-loader写在normal阶段，css文件中@import引入的css文件内容会丢失，本质上出现这个问题的原因是css-loader的normal阶段会将样式文件处理成为js脚本并且返回给style-loader的normal函数中。这也就意味着，如果我们将style-loader设计为normal loader的话，我们需要执行上一个loader返回的js脚本，并且获得它导出的内容才可以得到对应的样式内容


将style-loader设计成为pitch loader
那么为什么要这么做呢？
我们可以在style-loader的pitch阶段通过require语句引入css-loader处理文件后返回的js脚本，得到导出的结果。然后重新组装逻辑返回给webpack即可。
这样做的好处是，之前我们在normal阶段需要处理的执行css-loader返回的js语句完全不需要自己实现js执行的逻辑。完全交给webpack去执行了。
也许大多数同学仍然不是很明白这是什么意思，没关系。我先来带你实现一下它的基本内容：
function styleLoader(source) {}

// pitch阶段
styleLoader.pitch = function (remainingRequest, previousRequest, data) {
  const script = `
  import style from "!!${remainingRequest}"

    const styleEl = document.createElement('style')
    styleEl.innerHTML = style
    document.head.appendChild(styleEl)
  `;
  return script;
};

module.exports = styleLoader

这里我将style-loader的处理放在了pitch阶段进行处理。

pitch阶段的remainingRequest表示剩余还未处理loader的绝对路径以"!"拼接(包含资源路径)的字符串。

这里我们通过在style-loader的pitch阶段直接返回js脚本:

此时webpack会将style-loader返回的js脚本进行编译。
将本次返回的脚本编译称为一个module，同时会递归编译本次返回的js脚本，监测到它存在模块引入语句import/require进行递归编译。
此时style-loader中返回的module中包含这样一句代码：
 import style from "!!${remainingRequest}"

我们在normal loader阶段棘手的关于css-loader返回值是一个js脚本的问题通过import语句我们交给了webpack去编译。
webpack会将本次import style from "!!${remainingRequest}"重新编译称为另一个module，当我们运行编译后的代码时候:

首先分析const styles = require('./index.css');，style-loader pitch处理./index.css并且返回一个脚本。

webpack会将返回的js脚本编译称为一个module，同时分析这个module中的依赖语句进行递归编译。

由于style-loader pitch阶段返回的脚本中存在import语句，那么此时webpack就会递归编译import语句的路径模块。

webpack递归编译style-loader返回脚本中的import语句时，我们在编译完成就会通过import style from "!!${remainingRequest}"，在style-loader pitch返回的脚本阶段获得css-loader返回的js脚本并执行它，获取到它的导出内容。

这里有一点需要强调的是：我们在使用import语句时使用了 !!(双感叹号) 拼接remainingRequest，表示对于本次引入仅仅有inline loader生效。否则会造成死循环。

其实这就是style-loader为什么要实现pitch阶段来进行逻辑处理内容，你说normal不可以吗？

如果一定要用normal的话的确可以，但是我们需要处理太多的import/require从而实现模块引入，这无疑是一种非常糟糕的设计模式。

```
## 真实Pitch应用场景总结

```
通过上述的style-loader的例子，当我们希望将左侧的loader并联使用的时候使用pitch方式无疑是最佳的设计方式。
通过pitch loader中import someThing from !!${remainingRequest}剩余loader,从而实现上一个loader的返回值是js脚本，将脚本交给webpack去编译执行，这就是pitch loader的实际应用场景。
简单来说，如果在loader开发中你的需要依赖loader其他loader，但此时上一个loader的normal函数返回的并不是处理后的资源文件内容而是一段js脚本，那么将你的loader逻辑设计在pitch阶段无疑是一种更好的方式。

需要额外注意的是需要额外将 remainingRequest 绝对路径处理成为相对 process.cwd(loaderContext.context) 的路径，这是因为 webpack 中的模块生成机制生成的模块ID(路径)都是相对于process.cwd生成的。所以需要保证 require(import) 到对应的模块 ID 所以需要处理为相对路径。


```
## vue-loader

vue-loader要配合vueloaderPlugin一起使用

## file-loader

[https://zhuanlan.zhihu.com/p/86171506](https://note.youdao.com/)

简单来说，file-loader 就是在 JavaScript 代码里 import/require 一个文件时，会将该文件生成到输出目录，并且在 JavaScript 代码里返回该文件的地址。


## url-loader

一般来说，我们会发请求来获取图片或者字体文件。如果图片文件较多时（比如一些 icon），会频繁发送请求来回请求多次，这是没有必要的。此时，我们可以考虑将这些较小的图片放在本地，然后使用 url-loader 将这些图片通过 base64 的方式引入代码中。这样就节省了请求次数，从而提高页面性能。

[url-loader](https://zhuanlan.zhihu.com/p/85917267)

