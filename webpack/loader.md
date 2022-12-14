[vue-loader1](https://juejin.cn/post/6844903780778000398)
[vue-loader2](https://juejin.cn/post/6994468137584295973)
[loader-api](https://v4.webpack.docschina.org/api/loaders)
[style-loader的实现](https://juejin.cn/post/7037696103973650463)
[babel-loader和loader-runner的实现更好的理解loader](https://juejin.cn/post/7036379350710616078)
[字节的loader介绍](https://juejin.cn/post/6950092728919130126)
# loader 是什么的理解

总结一下：

webpack中通过compilation对象进行模块编译时，会首先进行匹配loader处理文件得到结果(string/buffer),之后才会输出给webpack进行编译，loader runner 会调用这个函数，然后把上一个 loader 产生的结果或者资源文件(resource file)传入进去。loader 用于对模块的源代码进行转换。loader 让 webpack 能够去处理其他类型的文件，并将它们转换为有效模块。以供应用程序使用，以及被添加到依赖图中。loader的本质就是一个函数，接受我们的源代码作为入参同时返回新的内容。
```
webpack中loader的本质就是一个函数，接受我们的源代码作为入参同时返回新的内容。loader runner 会调用这个函数，然后把上一个 loader 产生的结果或者资源文件(resource file)传入进去。loader 用于对模块的源代码进行转换。loader 可以使你在 import 或 "load(加载)" 模块时预处理文件。因此，loader 类似于其他构建工具中“任务(task)”，并提供了处理前端构建步骤的得力方式。loader 可以将文件从不同的语言（如 TypeScript）转换为 JavaScript 或将内联图像转换为 data URL。loader 甚至允许你直接在 JavaScript 模块中 import CSS 文件！webpack中通过compilation对象进行模块编译时，会首先进行匹配loader处理文件得到结果(string/buffer),之后才会输出给webpack进行编译。简单来说，loader就是一个函数，通过它我们可以在webpack处理我们的特定资源(文件)之前进行提前处理。
比方说，webpack仅仅只能识别javascript模块，而我们在使用TypeScript编写代码时可以提前通过babel-loader将.ts后缀文件提前编译称为JavaScript代码，之后再交给Webapack处理。loader 让 webpack 能够去处理其他类型的文件，并将它们转换为有效模块。以供应用程序使用，以及被添加到依赖图中。
```
经常会出现以下两种形式：
（1）在 webpack.config.js 配置文件中，去根据文件匹配信息，去配置 loader 相关信息；
（2）是在 loader / plugin 中去修改、替换、生成的行内 loader 信息。


# 四种loader 
前置pre
普通normal
行内inline
后置post

## post、pre、normal 的 enforce 属性
匹配loader的执行顺序 如果use为一个数组时表示有多个loader依次处理匹配的资源，按照 从右往左(从下往上) 的顺序去处理。但是如果我们希望loader的执行顺序不是按照书写顺序执行，就会用到enforce属性值。

对于post，normal，pre，主要取决于在配置里Rule.enforce的取值：pre || post，若无设置，则为normal。
注意：相对于的是 Rule，并非某个 loader。那么作用于的就是对应 Rule 的所有 loader。

## inline

行内 loader 比较特殊，是在 import / require 的时候，将 loader 写入代码中。而对于inline而言，有三种前缀语法：

!：忽略 normal loader
-!：忽略 pre loader 和 normal loader
!!：忽略所有 loader（ pre / noraml / post ）

行内 loader 通过!将资源中的 loader 进行分割，同时支持在 loader 后面，通过?传递参数，参数信息参考 loader.options 内容。


# loader执行的两个阶段

## normal 阶段
Normal 阶段: loader 上的 常规方法，按照 前置(pre)、普通(normal)、行内(inline)、后置(post) 的顺序调用。模块源码的转换， 发生在这个阶段。

关于normal loader本质上就是loader函数本身。

// loader函数本身 我们称之为loader的normal阶段
function loader(source) {
    // dosomething
    return source
}
### normal loader 参数
normal loader默认接受一个参数，这个参数是需要处理的文件内容。在存在多个loader时，它的参数会受上一个loader的影响。

### normal loader 的 this 对象
关于normal loader中其实有非常多的属性会挂载在函数中的this上，比如通常我们在使用某个loader时会在外部传递一些参数，此时就可以在函数内部通过this.getOptions()方法获取。关于loader中的this被称作上下文对象。

[webpack原文链接](https://webpack.docschina.org/api/loaders/#the-loader-context)

#### this.addDependency

addDependency(file: string)
dependency(file: string) // shortcut
添加一个文件作为产生 loader 结果的依赖，使它们的任何变化可以被监听到。例如，sass-loader, less-loader 就使用了这个技巧，当它发现无论何时导入的 css 文件发生变化时就会重新编译。

#### this.cacheable

cacheable(flag = true: boolean)
默认情况下，loader 的处理结果会被标记为可缓存。调用这个方法然后传入 false，可以关闭 loader 处理结果的缓存能力。

一个可缓存的 loader 在输入和相关依赖没有变化时，必须返回相同的结果。这意味着 loader 除了 this.addDependency 里指定的以外，不应该有其它任何外部依赖。

#### this.resource
request 中的资源部分，包括 query 参数。

在示例中：'/abc/resource.js?rrr'

#### this.resourcePath
资源文件的路径。

在【示例](#example-for-the-loader-context)中：'/abc/resource.js'

#### this.resourceQuery
资源的 query 参数。

在示例中：'?rrr'

#### this.rootContext
从 webpack 4 开始，原先的 this.options.context 被改为 this.rootContext。

### normal loader 返回值

Normal阶段，loader函数的返回值会在loader chain中进行一层一层传递直到最后一个loader处理后传递将返回值给webpack进行传递。

在normal阶段的最后一个loader一定需要返回一个js代码(一个module的代码，比如包含module.exports语句)

## pitch 阶段
Pitching 阶段: loader 上的 pitch 方法，按照 后置(post)、行内(inline)、普通(normal)、前置(pre) 的顺序调用。

关于pitch loader就是normal loader上的一个pitch属性，它同样是一个函数:

// pitch loader是normal上的一个属性
loader.pitch = function (remainingRequest,previousRequest,data) {
    // ...
}

pitch loader的重要性，pitch loader中如果存在非undefeind返回值的话，那么上述图中的整个loader chain会发生熔断效果。它会立马掉头将pitch函数的返回值去执行前置的noraml loader。正常执行时是会读取资源文件的内容交给normal loader去处理，但是pitch存在返回值时发生熔断并不会读取文件内容了。此时pitch函数返回的值会交给将要执行的normal loader。

### pitch loader的参数

1.remainingRequest
  需要注意的是remainingRequest与剩余loader有没有pitch属性没有关系，无论是否存在pitch属性remainingRequest都会计算pitch阶段还未处理剩余的loader。
2.previousRequest
  它表示pitch阶段已经迭代过的loader按照!分割组成的字符串。注意同样previousRequest和有无pitch属性没有任何关系。同时remainingRequest和previousRequest都是不包括自身的。
3.data
  在normalLoader与pitch Loader进行交互正是利用了第三个data参数。当我们在pitch函数中通过给data对象上的属性赋值时，比如data.name="参数"。此时在normal loader函数中可以通过this.data.name获取到自身pitch方法中传递的参数。

### pitch loader 返回值

Pitch阶段，任意一个loader的pitch函数如果返回了非undefined的任何值，会发生熔断效果同时将pitch的返回值传递给normal阶段loader的函数。

### pitch loader的熔断效果
任意一个loader的pitch函数中返回了一个非undefined的内容时，loader的执行链条会被阻断--立马掉头执行，直接掉头执行上一个已经执行的loader的normal阶段并且将pitch的返回值传递给下一个normal loader,简而言之这就是loader的熔断效果。
[图解示例](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4df62ce00b9745fab4dee2dc098ddb09~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp?)
### pitch loader的应用场景
style-loader做的事情，所有的逻辑处理都在pitch loader中进行，normal loader是个空函数。

style-loader的工作：它获得对应的样式文件内容，然后通过在页面创建style节点。将样式内容赋给style节点然后将节点加入head标签即可

# 同步 / 异步 loader

如果是单个处理结果，可以在 同步模式 中直接返回。如果有多个处理结果，则必须调用 this.callback()。在 异步模式 中，必须调用 this.async()来告知 loader runner 等待异步结果，它会返回 this.callback() 回调函数。随后 loader 必须返回 undefined 并且调用该回调函数。

在 webpack 中，loader 可能会由于依赖于读取外部配置文件、进行网络请求等等原因，从而比较耗时。而此时如果进行同步操作，就会导致 webpack 阻塞住，所以 loader 会有同步 / 异步之分。

```
在 loader 中，可以通过两种方式返回数据：

return：return只能返回content信息；
callback

this.callback(
  err: Error | null,    // 错误信息
  content: string | Buffer,    // content信息
  sourceMap?: SourceMap,    // sourceMap
  meta?: any    // 会被 webpack 忽略，可以是任何东西（例如：AST、一些元数据啥的）。
);
```
## 同步 loader
对于同步 loader 而言，使用return或者this.callback均可以达到想要的效果。只是说，相对于return，this.callback可以返回更多的信息。
```
module.exports = function(content, map, meta) {
  // return handleData(content);
  this.callback(null, handleData(content), handleSourceMap(map), meta);
  return; // 当调用 callback() 函数时，总是返回 undefined
};
```
## 异步 loader
```
module.exports = function(content, map, meta) {
  var callback = this.async();
  asycnHandleData(content, function(err, result) {
    if (err) return callback(err);
    callback(null, result, map, meta);
  });
};
```
## 将同步loader变成异步loader(同样loader的pitch阶段也可以通过下述两个方案变成异步loader。)

### 返回Promise
我们仅仅修改loader的返回值为一个Promise就可以将loader变为异步loader，后续步骤会等待返回的Promise变成resolve后才会继续执行。
```
funciton asyncLoader() {
    // dosomething
    return Promise((resolve) => {
        setTimeout(() => {
            // resolve的值相当于同步loader的返回值
            resolve('19Qingfeng')
        },3000)
    })
}
```
### 通过this.async
同样还有另一种方式也是比较常用的异步loader方式,我们通过在loader内部调用this.async函数将loader变为异步，同时this.async会返回一个callback的方式。只有当我们调用callback方法才会继续执行后续阶段处理。
```
function asyncLoader() {
    const callback = this.async()
    // dosomething
    
    // 调用callback告诉loader-runner异步loader结束
    callback('19Qingfeng')
}
```
# webpack中配置loader的三种方式

## 绝对路径
第一种方式在项目内部存在一些未发布的自定义loader时比较常见，直接使用绝对路径地址的形式指向loader文件所在的地址。
```
const path = require('path')
// webpack.config.js
module.exports = {
    ...
    module: {
        rules: [
            {
                test:/\.js$/,
                // .js后缀其实可以省略，后续我们会为大家说明这里如何配置loader的模块查找规则
                loader: path.resolve(__dirname,'../loaders/babel-loader.js')
            }
        ]
    }
}
```
## resolveLoader.alias
我们可以通过webpack中的resolveLoader的别名alias方式进行配置，比如：
```
const path = require('path')
// webpack.config.js
module.exports = {
    ...
    resolveLoader: {
        alias: {
            'babel-loader': path.resolve(__dirname,'../loaders/babel-loader.js')
        }
    },
    module: {
        rules: [
            {
                test:/\.js$/,
                loader: 'babel-loader'
            }
        ]
    }
}
```
## resolveLoader.modules 默认值是node_modules
我们可以通过resolveLoader.modules定义webpack在解析loader时应该查找的目录，比如:

```
const path = require('path')
// webpack.config.js
module.exports = {
    ...
    resolveLoader: {
        modules: [ path.resolve(__dirname,'../loaders/') ]
    },
    module: {
        rules: [
            {
                test:/\.js$/,
                loader: 'babel-loader'
            }
        ]
    }
}
```
上述代码中我们将resolveLoader.modules配置为 path.resolve(__dirname,'../loaders/')，此时在webpack解析loader模块规则时就会去path.resolve(__dirname,'../loaders/')目录下去寻找对应文件。
当然resolveLoader.modules的默认值是['node_modules']，自然在默认业务场景中我们通过npm install按照的第三方loader都是存在于node_modules内所以配置mainFields默认就可以找到对应的loader入口文件。


# loader的raw属性
normal Loader的参数我们讲到过它会接受前置normal loader or 对应资源文件(当它为第一个loader还未经过任何loader处理时) 的内容。这个内容默认是一个string类型的字符串。但是在我们开发一些特殊的loader时，比如我们需要处理图片资源时，此时对于图片来说将图片变成字符串明显是不合理的。针对于图片的操作通常我们需要的是读取图片资源的Buffer类型而非字符串类型。此时我们可以通过loader.raw标记normal loader的参数是Buffer还是String:
* 当loader.raw为false时，此时我们normal loader的source获取的是一个String类型，这也是默认行为。
* 当loader.raw为true时，此时这个loader的normal函数接受的source参数就是一个Buffer类型。

```
function loader2(source) {
    // 此时source是一个Buffer类型 而非模型的string类型
}
loader2.raw = true
module.exports = loader2
```
# loader-runner(webpack中集中处理loader执行的机制)

**在一个 module 构建过程中，首先根据 module 的依赖类型(例如 NormalModuleFactory)调用对应的构造函数来创建对应的模块。在创建模块的过程中(new NormalModuleFactory())，会根据开发者的 webpack.config 当中的 rules 以及 webpack 内置的 rules 规则实例化 RuleSet 匹配实例，简单来说就是在每一个模块module通过webpack编译前都会首先根据对应文件后缀寻找匹配到对应的loader，先调用loader处理资源文件从而将处理后的结果交给webpack进行编译。webpack在进行模块编译时会调用_doBuild，在doBuild方法内部通过调用runLoaders方法调用loader处理模块。**

```
实例化 RuleSet 后，还会注册2个钩子函数:当 NormalModuleFactory 实例化完成后，并在 compilation 内部调用这个实例的 create 方法开始真实开始创建这个 normalModule。首先调用hooks.factory获取对应的钩子函数，接下来就调用 resolver 钩子(hooks.resolver)进入到了 resolve 的阶段，在真正开始 resolve loader 之前，首先就是需要匹配过滤找到构建这个 module 所需要使用的所有的 loaders。首先进行的是对于 inline loaders 的处理：

class NormalModuleFactory {
  ...
  // 内部嵌套 resolver 的钩子，完成相关的解析后，创建这个 normalModule
  this.hooks.factory.tap('NormalModuleFactory', () => (result, callback) => { ... })

  // 在 hooks.factory 的钩子内部进行调用，实际的作用为解析构建一共 module 所需要的 loaders 及这个 module 的相关构建信息(例如获取 module 的 packge.json等)
  this.hooks.resolver.tap('NormalModuleFactory', () => (result, callback) => { ... })
  ...
}
```

## runLoader参数
### 第一个参数对象
* resource: resource参数表示需要加载的资源路径。
* loaders: 表示需要处理的loader绝对路径拼接成为的字符串，以!分割。
* context: loader上下文对象，webpack会在进入loader前创建一系列属性挂载在一个object上，而后传递给loader内部。比如我们上边说到的this.getOptions()方法获得loader的配置options参数就是在进入runLoader函数前webpack将getOptions方法定义在了loaderContext对象中传递给context参数。
* processResource: 读取资源文件的方法。同样源码中的processResource涉及了很多plugin hooks相关逻辑，这里你可以简单理解为它是一个fs.readFile方法就可以。本质上这个参数的核心就是通过processResource方法按照路径来读取我们的资源文件。

### 第二个参数
runLoaders函数第二个参数传入的是一个callback表示本次loader处理完成的结果。

## runLoaders的处理结果
### error
如果runLoaders函数执行过程中遇到错误那么这个参数将会变成错误内容，否则将为null。
### result
如果runLoaders函数执行完毕并且没有存在任何错误，那么这个result将会存在以下属性:

result：它是一个数组用来表示本次经过所有loaders处理完毕后的文件内容。
resourceBuffer： 它是一个Buffer内容，这个内容表示我们的资源文件原始内容转化为Buffer的结果。
其他参数是关于webpack构建与缓存时的参数，这里我们可以先不用关系这些参数。

## 代码实现
* filePath是title.js的模块路径，换而言之我们就是通过loader来处理这个title.js文件。
* request是我们模拟title.js中的内容，它其实和title.js文件内容是一模一样的，这里我们为了方便模拟webpack解析loader的处理规则所以直接将title.js的文件内容放在了request字符串中。
* 这里我们给runLoaders中第一参数对应的属性分别是:
    * resource表示需要loader编译的模块路径。
    * loaders表示本次loader处理，需要有哪些loader进行处理。(它是一个所有需要处理的loader文件路径组成的数组)
    * context表示loader的上下文对象，真实源码中webpack会在进入runLoaders方法前对这个对象进行额外加工，这里我们不做过多处理，它就是loader中的this上下文。
    * readResource这个参数表示runLoaders方法中会以我们传入的这个参数去读取resource需要加载的文件路径从而得到文件内容。
```
// loader-runner/index.js
// 入口文件
const fs = require('fs');
const path = require('path');
const { runLoaders } = require('loader-runner');

// 模块路径
const filePath = path.resolve(__dirname, './title.js');

// 模拟模块内容和.title.js一模一样的内容
const request = 'inline1-loader!inline2-loader!./title.js';

// 模拟webpack配置
const rules = [
  // 普通loader
  {
    test: /\.js$/,
    use: ['normal1-loader', 'normal2-loader'],
  },
  // 前置loader
  {
    test: /\.js$/,
    use: ['pre1-loader', 'pre2-loader'],
    enforce: 'pre',
  },
  // 后置loader
  {
    test: /\.js$/,
    use: ['post1-loader', 'post2-loader'],
  },
];

// 从文件引入路径中提取inline loader 同时将文件路径中的 -!、!!、! 等标志inline-loader的规则删除掉
const parts = request.replace(/^-?!+/, '').split('!');

// 获取文件路径
const sourcePath = parts.pop();

// 获取inlineLoader
const inlineLoaders = parts;

// 处理rules中的loader规则
const preLoaders = [],
  normalLoaders = [],
  postLoaders = [];

rules.forEach((rule) => {
  // 如果匹配情况下
  if (rule.test.test(sourcePath)) {
    switch (rule.enforce) {
      case 'pre':
        preLoaders.push(...rule.use);
        break;
      case 'post':
        postLoaders.push(...rule.use);
        break;
      default:
        normalLoaders.push(...rule.use);
        break;
    }
  }
});

/**
 * 根据inlineLoader的规则过滤需要的loader
 * https://webpack.js.org/concepts/loaders/
 * !: 单个！开头，排除所有normal-loader.
 * !!: 两个!!开头 仅剩余 inline-loader 排除所有(pre,normal,post).
 * -!: -!开头将会禁用所有pre、normal类型的loader，剩余post和normal类型的.
 */
let loaders = [];
if (request.startsWith('!!')) {
  loaders.push(...inlineLoaders);
} else if (request.startsWith('-!')) {
  loaders.push(...postLoaders, ...inlineLoaders);
} else if (request.startsWith('!')) {
  loaders.push(...postLoaders, ...inlineLoaders, ...preLoaders);
} else {
  loaders.push(
    ...[...postLoaders, ...inlineLoaders, ...normalLoaders, ...preLoaders]
  );
}

// 将loader转化为loader所在文件路径
// webpack下默认是针对于配置中的resolveLoader的路径进行解析 这里为了模拟我们省略了webpack中的路径解析
const resolveLoader = (loader) => path.resolve(__dirname, './loaders', loader);

// 获得需要处理的loaders路径
loaders = loaders.map(resolveLoader);

runLoaders(
  {
    resource: filePath, // 加载的模块路径
    loaders, // 需要处理的loader数组
    context: { name: '19Qingfeng' }, // 传递的上下文对象
    readResource: fs.readFile.bind(fs), // 读取文件的方法
    // processResource 参数先忽略
  },
  (error, result) => {
    console.log(error, '存在的错误');
    console.log(result, '结果');
  }
);


```
loader-runner方法的内部实现
[原文链接](https://github.com/19Qingfeng/19webpack/tree/master/loader-runner)
```
/**
 *
 * 通过loader的绝对路径地址创建loader对象
 * @param {*} loader loader的绝对路径地址
 */
function createLoaderObject(loader) {
  const obj = {
    normal: null, // loader normal 函数本身
    pitch: null, // loader pitch 函数
    raw: null, // 表示normal loader处理文件内容时 是否需要将内容转为buffer对象
    // pitch阶段通过给data赋值 normal阶段通过this.data取值 用来保存传递的data
    data: null,
    pitchExecuted: false, // 标记这个loader的pitch函数时候已经执行过
    normalExecuted: false, // 表示这个loader的normal阶段是否已经执行过
    request: loader, // 保存当前loader资源绝对路径
  };
  // 按照路径加载loader模块 真实源码中通过loadLoader加载还支持ESM模块 咱们这里仅仅支持CJS语法
  const normalLoader = require(obj.request);
  // 赋值
  obj.normal = normalLoader;
  obj.pitch = normalLoader.pitch;
  // 转化时需要buffer/string   raw为true时为buffer false时为string
  obj.raw = normalLoader.raw;
  return obj;
}

function runLoaders(options, callback) {
  // 需要处理的资源绝对路径
  const resource = options.resource || '';
  // 需要处理的所有loaders 组成的绝对路径数组
  let loaders = options.loaders || [];
  // loader执行上下文对象 每个loader中的this就会指向这个loaderContext
  const loaderContext = options.context || {};
  // 读取资源内容的方法
  const readResource = options.readResource || fs.readFile.bind(fs);
  // 根据loaders路径数组创建loaders对象
  loader = loader.map(createLoaderObject);
  // 处理loaderContext 也就是loader中的this对象
  // 这里我们为loaderIndex上下文对象上定义了一系列属性，
  // 比如其中我们通过loaderIndex控制当前loaders列表中，
  // 当前执行到第几个loader以及当前data、async、callback等等属性。
  loaderContext.resourcePath = resource; // 资源路径绝对地址 
  loaderContext.readResource = readResource; // 读取资源文件的方法
  loaderContext.loaderIndex = 0; // 我们通过loaderIndex来执行对应的loader
  loaderContext.loaders = loaders; // 所有的loader对象
  loaderContext.data = null;
  // 标志异步loader的对象属性
  loaderContext.async = null;
  loaderContext.callback = null;
  // request 保存所有loader路径和资源路径
  // 这里我们将它全部转化为inline-loader的形式(字符串拼接的"!"分割的形式)
  // 注意同时在结尾拼接了资源路径哦～
  Object.defineProperty(loaderContext, 'request', {
    enumerable: true,
    get: function () {
      return loaderContext.loaders
        .map((l) => l.request)
        .concat(loaderContext.resourcePath || '')
        .join('!');
    },
  });
  // 保存剩下的请求 不包含自身(以LoaderIndex分界) 包含资源路径
  Object.defineProperty(loaderContext, 'remainingRequest', {
    enumerable: true,
    get: function () {
      return loaderContext.loaders
        .slice(loaderContext + 1)
        .map((i) => i.request)
        .concat(loaderContext.resourcePath)
        .join('!');
    },
  });
  // 保存剩下的请求，包含自身也包含资源路径
  Object.defineProperty(loaderContext, 'currentRequest', {
    enumerable: true,
    get: function () {
      return loaderContext.loaders
        .slice(loaderContext)
        .map((l) => l.request)
        .concat(loaderContext.resourcePath)
        .join('!');
    },
  });
  // 已经处理过的loader请求 不包含自身 不包含资源路径
  Object.defineProperty(loaderContext, 'previousRequest', {
    enumerable: true,
    get: function () {
      return loaderContext.loaders
        .slice(0, loaderContext.index)
        .map((l) => l.request)
        .join('!');
    },
  });
  // 通过代理保存pitch存储的值 pitch方法中的第三个参数可以修改 通过normal中的this.data可以获得对应loader的pitch方法操作的data
  Object.defineProperty(loaderContext, 'data', {
    enumerable: true,
    get: function () {
      return loaderContext.loaders[loaderContext.loaderIndex].data;
    },
  });
  // 用来存储读取资源文件的二进制内容 (转化前的原始文件内容)
  // 这里我们定义的processOptions中的resourceBuffer正是result中的resourceBuffer： 
  // 原始(未经loader处理)的资源文件内容的Buffer对象。
  const processOptions = {
    resourceBuffer: null,
  };
  // 处理完loaders对象和loaderContext上下文对象后
  // 根据流程我们需要开始迭代loaders--从pitch阶段开始迭代
  // 按照 post-inline-normal-pre 顺序迭代pitch
  iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
    callback(err, {
      result,
      resourceBuffer: processOptions.resourceBuffer,
    });
  });
}
// 在创建loader对象、赋值loaderContext属性后，
// 按照之前的流程图。我们就要进入每一个loader的pitch执行阶段。
// 上边我们定义了iteratePitchingLoaders函数，并且为他传入了三个参数:
// processOptions: 我们上述定义的对象，它存在一个resourceBuffer属性用来保存未经过loader处理前Buffer类型的资源文件内容。
// loaderContext: loader上下文对象。
// callback: 这个方法内部调用了runLoaders方法外部传入的callback，用来在回调函数中调用最终的runLoaders方法的结果。
/**
 * 迭代pitch-loaders
 * 核心思路: 执行第一个loader的pitch 依次迭代 如果到了最后一个结束 就开始读取文件
 * @param {*} options processOptions对象
 * @param {*} loaderContext loader中的this对象
 * @param {*} callback runLoaders中的callback函数
 */
function iteratePitchingLoaders(options, loaderContext, callback) {
  // 超出loader个数 表示所有pitch已经结束 那么此时需要开始读取资源文件内容
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
    return processResource(options, loaderContext, callback);
  }

  const currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

  // 当前loader的pitch已经执行过了 继续递归执行下一个
  if (currentLoaderObject.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(options, loaderContext, callback);
  }
  
  const pitchFunction = currentLoaderObject.pitch;

  // 标记当前loader pitch已经执行过
  currentLoaderObject.pitchExecuted = true;

  // 如果当前loader不存在pitch阶段
  if (!currentLoaderObject.pitch) {
    return iteratePitchingLoaders(options, loaderContext, callback);
  }

  // 存在pitch阶段 并且当前pitch loader也未执行过 调用loader的pitch函数
  runSyncOrAsync(
    // pitchFunction作为需要执行的fn。
    pitchFunction,
    // loaderContext表示pitch loader函数中的this上下文对象。
    loaderContext,
    // 上文我们说到过pitch loader函数会接受三个参数分别是剩下的laoder请求, 
    // 已经处理过的loader请求以及作为传递给normal阶段的data。
    [
      currentLoaderObject.remainingRequest,
      currentLoaderObject.previousRequest,
      currentLoaderObject.data,
    ],
    // 第四个参数是一个回调函数，它表示pitch loader函数执行完毕后这个callback会被调用，
    // 如果pitch loader存在返回值那么它的第二个参数则会接受到pitch loader执行后的返回值。
    function (err, ...args) {
      if (err) {
        // 存在错误直接调用callback 表示runLoaders执行完毕
        return callback(err);
      }
      // 根据返回值 判断是否需要熔断 or 继续往下执行下一个pitch
      // pitch函数存在返回值 -> 进行熔断 掉头执行normal-loader
      // pitch函数不存在返回值 -> 继续迭代下一个 iteratePitchLoader
      const hasArg = args.some((i) => i !== undefined);
      if (hasArg) {
        loaderContext.loaderIndex--;
        // 熔断 直接返回调用normal-loader
        iterateNormalLoaders(options, loaderContext, args, callback);
      } else {
        // 这个pitch-loader执行完毕后 继续调用下一个loader
        iteratePitchingLoaders(options, loaderContext, callback);
      }
    }
  );
}
// processResource方法是读取资源文件内容的方法，按照上文流程图中的步骤当所有pitch执行完毕后我们需要读取资源文件内容了。
// runSyncOrAsync方法是执行调用loader函数的方法,loader的执行有两种方式同步/异步，这里正是通过这个方法进行的统一处理。
// iterateNormalLoaders方法是迭代normal loader的方法。

/**
 *
 * 执行loader 同步/异步
 * @param {*} fn 需要被执行的函数
 * @param {*} context loader的上下文对象
 * @param {*} args [remainingRequest,previousRequest,currentLoaderObj.data = {}]
 * @param {*} callback 外部传入的callback (runLoaders方法的形参)
 */

 // 它的实现很简单，内容通过闭包结合isSync变量实现异步this.async/this.callback这两个loader API的实现。
 // 最终，loader执行完毕runSyncOrAsync方法会将loader执行完毕的返回值传递给callback函数的第二个参数。

function runSyncOrAsync(fn, context, args, callback) {
  // 是否同步 默认同步loader 表示当前loader执行完自动依次迭代执行
  let isSync = true;
  // 表示传入的fn是否已经执行过了 用来标记重复执行
  let isDone = false;

  // 定义 this.callback
  // 同时this.async 通过闭包访问调用innerCallback 表示异步loader执行完毕
  const innerCallback = (context.callback = function () {
    isDone = true;
    // 当调用this.callback时 标记不走loader函数的return了
    isSync = false;
    callback(null, ...arguments);
  });

  // 定义异步 this.async
  // 每次loader调用都会执行runSyncOrAsync都会重新定义一个context.async方法
  context.async = function () {
    isSync = false; // 将本次同步变更成为异步
    return innerCallback;
  };

  // 调用pitch-loader执行 将this传递成为loaderContext 同时传递三个参数
  // 返回pitch函数的返回值 甄别是否进行熔断
  const result = fn.apply(context, args);

  if (isSync) {
    isDone = true;
    if (result === undefined) {
      return callback();
    }
    // 如果 loader返回的是一个Promise 异步loader
    if (
      result &&
      typeof result === 'object' &&
      typeof result.then === 'function'
    ) {
      // 同样等待Promise结束后直接熔断 否则Reject 直接callback错误
      return result.then((r) => callback(null, r), callback);
    }
    // 非Promise 切存在执行结果 进行熔断
    return callback(null, result);
  }
}
/**
 *
 * 读取文件方法
 * @param {*} options
 * @param {*} loaderContext
 * @param {*} callback
 */
function processResource(options, loaderContext, callback) {
  // 重置越界的 loaderContext.loaderIndex
  // 达到倒叙执行 pre -> normal -> inline -> post
  loaderContext.loaderIndex = loaderContext.loaders.length - 1;
  const resource = loaderContext.resourcePath;
  // 读取文件内容
  loaderContext.readResource(resource, (err, buffer) => {
    if (err) {
      return callback(err);
    }
    // 保存原始文件内容的buffer 相当于processOptions.resourceBuffer = buffer
    options.resourceBuffer = buffer;
    // 同时将读取到的文件内容传入iterateNormalLoaders 进行迭代`normal loader`
    iterateNormalLoaders(options, loaderContext, [buffer], callback);
  });
}
// loaderIndex在迭代pitch loader中越界了(也就是等于loaderContext.loaders.length)时才会进入processResource方法所以此时我们将loaderContext.loaderIndex重置为loaderContext.loaders.lenth -1。
// iterateNormalLoaders额外传入了一个表示资源文件内容[buffer]的数组，这是刻意而为之，这里我先买个关子，后续你会发现我为什么这么做。
// 还记得我们在loaderContext.loaders中保存的loaders顺序吗，它是按照post -> inline -> normal -> pre的顺序保存的的，所以此时只要我们按照loaderIndex逆序去迭代，就可以得到normal loader的顺序。

/**
 * 迭代normal-loaders 根据loaderIndex的值进行迭代
 * 核心思路: 迭代完成pitch-loader之后 读取文件 迭代执行normal-loader
 *          或者在pitch-loader中存在返回值 熔断执行normal-loader
 * @param {*} options processOptions对象
 * @param {*} loaderContext loader中的this对象
 * @param {*} args [buffer/any]
 * 当pitch阶段不存在返回值时 此时为即将处理的资源文件
 * 当pitch阶段存在返回值时 此时为pitch阶段的返回值
 * @param {*} callback runLoaders中的callback函数
 */
function iterateNormalLoaders(options, loaderContext, args, callback) {
  // 越界元素判断 越界表示所有normal loader处理完毕 直接调用callback返回
  if (loaderContext.loaderIndex < 0) {
    return callback(null, args);
  }
  const currentLoader = loaderContext.loaders[loaderContext.loaderIndex];
  if (currentLoader.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }

  const normalFunction = currentLoader.normal;
  // 标记为执行过
  currentLoader.normalExecuted = true;
  // 检查是否执行过
  if (!normalFunction) {
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }
  // 根据loader中raw的值 格式化source
  convertArgs(args, currentLoader.raw);
  // 执行loader
  runSyncOrAsync(normalFunction, loaderContext, args, (err, ...args) => {
    if (err) {
      return callback(err);
    }
    // 继续迭代 注意这里的args是处理过后的args
    iterateNormalLoaders(options, loaderContext, args, callback);
  });
}
/**
 *
 * 转化资源source的格式
 * @param {*} args [资源]
 * @param {*} raw Boolean 是否需要Buffer
 * raw为true 表示需要一个Buffer
 * raw为false表示不需要Buffer
 */
function convertArgs(args, raw) {
  if (!raw && Buffer.isBuffer(args[0])) {
    // 我不需要buffer
    args[0] = args[0].toString();
  } else if (raw && typeof args[0] === 'string') {
    // 需要Buffer 资源文件是string类型 转化称为Buffer
    args[0] = Buffer.from(args[0], 'utf8');
  }
}
```

# babel-loader流程
[原文地址](https://github.com/19Qingfeng/19webpack/tree/master/loader-runner/loaders/babel-loader)
```
const core = require('@babel/core');

/**
 *
 * @param {*} source 源代码内容
 */
function babelLoader(source) {
  // 获取loader参数
  const options = this.getOptions() || {};
  // 通过transform方法进行转化
  const { code, map, ast } = core.transform(source, options);
  // 调用this.callback表示loader执行完毕
  // 同时传递多个参数给下一个loader
  this.callback(null, code, map, ast);
}

module.exports = babelLoader;
```
这里我们通过core.transform将源js代码进行ast转化同时通过外部传递的options选项处理ast节点的转化，从而按照外部传入规则将js代码转化为转化后的代码。这里我们通过this.getOptions方法获得外部loader传递的参数。在webpack5中获取loader的方法在调用runLoaders方法时webpack已经在loaderContext中添加了这个getOptions的实现，从而调用runLoaders方法时传入了处理好的loaderContext参数。在webpack5之前并不存在this.getOptions方法，需要额外通过loader-utils这个包实现获取外部loader配置参数。这个方法的实现非常简单，在源码中的webpack/lib/NormalModule.js中。下面我们来验证上面写的babel-loader是否生效
```
// src/index.js
// 这里我们使用ES6的语法
const arrowFunction = () => {
  console.log('hello');
};

console.log(arrowFunction);
```
```
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  devtool: 'eval-source-map',
  resolveLoader: {
    modules: [path.resolve(__dirname, './loaders')],
  },
  module: {
    rules: [
      {
        test: /\.js/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
};
```
```
// package.json
{
    ...
    // 这里我们定义两个脚本 一个为开发环境下的dev
    // 一个为build打包命令
  "scripts": {
    "dev": "webpack serve --mode developmen",
    "build": "webpack --config ./webpack.config.js"
  },
}
```
在上述代码编译之后debugger中的代码此时并不是我们真正的源码，是已经被babel转译后的代码，这对于日常开发来说无疑是一种灾难，这里我们的src/index.js的文件内容很简单只有一个箭头函数。可是当项目中代码越来越复杂，这种情况无疑对于我们进行debugger代码时是一种噩梦。其实导致这个问题的原因很简单，在babel-loader编译阶段我们并没有携带任何sourceMap映射。而在**webpack编译阶段即使开启了sourceMap映射此时也仅仅只能将webpack编译后的代码在debugger中映射到webpack处理前，也就是已经经历过babel-loader处理了。**
此时，我们需要做的仅仅是需要在babel-loader转化过程中添加对应的sourcemap返回交给webpack编译阶段时候携带babel-loader生成的sourcemap就可以达到我们期望的效果。

```
const core = require('@babel/core');

/**
 *
 * @param {*} source 源代码内容
 */
function babelLoader(source, sourceMap, meta) {
  // 获取loader参数
  const options = this.getOptions() || {};
  // 生成babel转译阶段的sourcemap
  options.sourceMaps = true;
  // 保存之前loader传递进入的sourceMap
  options.inputSourceMap = sourceMap;
  // 获得处理的资源文件名 babel生成sourcemap时候需要配置filename
  options.filename = this.request.split('!').pop().split('/').pop();
  // 通过transform方法进行转化
  const { code, map, ast } = core.transform(source, options);
  console.log(map, 'map');
  // 调用this.callback表示loader执行完毕
  // 同时传递多个参数给下一个loader
  // 将transform API生成的sourceMap 返回给下一个loader(或者webpack编译阶段)进行处理
  this.callback(null, code, map, ast);
}

module.exports = babelLoader;
```

这里我们在babel的tranform方法上接受到了上一次loader传递过来的soureMap结果（如果有的话）。同时调用options.sourceMaps告诉babel在转译时生成sourceMap。最终将生成的source在this.callback中返回。此时我们就在我们的babel转译阶段也生成了sourcemap同时最终会经过loader-chain将生成的sourcemap传递给webpack。同时额外注意webpack中devtool的配置，如果关闭了sourceMap的话就看不到任何源代码信息～

# 实现一个style-loader
style-loader做的事情很简单：它获得对应的样式文件内容，然后通过在页面创建style节点。将样式内容赋给style节点然后将节点加入head标签即可。
```
function styleLoader(source) {
  const script = `
    const styleEl = document.createElement('style')
    styleEl.innerHTML = ${JSON.stringify(source)}
    document.head.appendChild(styleEl)
  `;
  return script;
}
```
webpack解析到关于require(*.css)文件时，会交给style-loader去处理，最终将返回的script打包成一个module。在通过require(*.css)执行后页面就会添加对应的style节点了。

## 将style-loader设计成为normal loader

通常我们在使用style-loader处理我们的css样式文件时，都会配合css-loader去一起处理css文件中的引入语句。样式文件首先会经过css-loader的处理之后才会交给style-loader处理。

* src/index.js： 本次打包的入口文件。
```
// 它做的事情很简单 引入index.css
const styles = require('./index.css');
```
* src/index.css： 被入口js文件引入的样式文件。
```
// index.css 中定义了body的背景色
// 以及通过@import 语句引入了 ./require.css
@import url('./require.css');
body {
  color: red;
}
```
* src/require.css：被index.css引入的样式文件。
```
div {
  color: blue;
}
```
再次运行打包打开生成的html页面：我们可以看到body上我们设置的color:red丢失了。其实本质上出现这个问题的原因是css-loader的normal阶段会将样式文件处理成为js脚本并且返回给style-loader的normal函数中。source的内容是一个js脚本，我们将js脚本的内容插入到styleEl中去，当然是任何样式也不会生效。

这也就意味着，如果我们将style-loader设计为normal loader的话，我们需要执行上一个loader返回的js脚本，并且获得它导出的内容才可以得到对应的样式内容。那么此时我们需要在style-loader的normal阶段实现一系列js的方法才能执行js并读取到css-loader返回的样式内容，这无疑是一种非常糟糕的设计模式。

## 将style-loader设计成为pitch loader
那么，我们尝试按照源码的思路设计成为pitch loader呢？这样又会有什么好处呢？ 让我们先来分析一下。首先如果说我们在style-loader的pitch阶段直接返回值的话，那么会发生熔断效应。上边我们说到过，如果发生熔断效果那么此时会立马掉头执行normal loader，因为style-loader是第一个执行的过程，相当于: style-loader直接将结果返回给webpack执行(因为style-loader是第一个loader)

我们可以在style-loader的pitch阶段通过require语句引入css-loader处理文件后返回的js脚本，得到导出的结果。然后重新组装逻辑返回给webpack即可。这样做的好处是，之前我们在normal阶段需要处理的执行css-loader返回的js语句完全不需要自己实现js执行的逻辑。完全交给webpack去执行了。
```
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
```

将本次返回的脚本编译称为一个module，同时会递归编译本次返回的js脚本，监测到它存在模块引入语句import/require进行递归编译。此时style-loader中返回的module中包含这样一句代码：
```
import style from "!!${remainingRequest}"
```
我们在normal loader阶段棘手的关于css-loader返回值是一个js脚本的问题通过import语句我们交给了webpack去编译。
webpack会将本次import style from "!!${remainingRequest}"重新编译称为另一个module，当我们运行编译后的代码时候:

首先分析const styles = require('./index.css');，style-loader pitch处理./index.css并且返回一个脚本。

webpack会将返回的js脚本编译称为一个module，同时分析这个module中的依赖语句进行递归编译。

由于style-loader pitch阶段返回的脚本中存在import语句，那么此时webpack就会递归编译import语句的路径模块。

webpack递归编译style-loader返回脚本中的import语句时，我们在编译完成就会通过import style from "!!${remainingRequest}"，在style-loader pitch返回的脚本阶段获得css-loader返回的js脚本并执行它，获取到它的导出内容。

这里有一点需要强调的是：我们在使用import语句时使用了 !!(双感叹号) 拼接remainingRequest，表示对于本次引入仅仅有inline loader生效。否则会造成死循环。



# 真实Pitch应用场景总结
当我们希望将左侧的loader并联使用的时候使用pitch方式无疑是最佳的设计方式。通过pitch loader中import someThing from !!${remainingRequest}剩余loader,从而实现上一个loader的返回值是js脚本，将脚本交给webpack去编译执行，这就是pitch loader的实际应用场景。简单来说，如果在loader开发中你的需要依赖loader其他loader，但此时上一个loader的normal函数返回的并不是处理后的资源文件内容而是一段js脚本，那么将你的loader逻辑设计在pitch阶段无疑是一种更好的方式。

需要额外注意的是需要额外将 remainingRequest 绝对路径处理成为相对 process.cwd(loaderContext.context) 的路径，这是因为 webpack 中的模块生成机制生成的模块ID(路径)都是相对于process.cwd生成的。所以需要保证 require(import) 到对应的模块 ID 所以需要处理为相对路径。



# file-loader

[原文地址](https://zhuanlan.zhihu.com/p/86171506)

简单来说，file-loader 就是在 JavaScript 代码里 import/require 一个文件时，会将该文件生成到输出目录，并且在 JavaScript 代码里返回该文件的地址。


# url-loader

[原文地址](https://zhuanlan.zhihu.com/p/85917267)
一般来说，我们会发请求来获取图片或者字体文件。如果图片文件较多时（比如一些 icon），会频繁发送请求来回请求多次，这是没有必要的。此时，我们可以考虑将这些较小的图片放在本地，然后使用 url-loader 将这些图片通过 base64 的方式引入代码中。这样就节省了请求次数，从而提高页面性能。



