[babel polyfill的计算](https://juejin.cn/post/7025237833543581732)
[不同业务场景下的babel](https://juejin.cn/post/7051355444341637128)
[babel7](https://juejin.cn/post/6844904008679686152)

# babel是什么
Babel 是一个 JS 编译器，Babel 是一个工具链，主要用于将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

# babel能做什么
1、babel-present-env 语法转换 解析语法然后编译成向后兼容的语法
2、通过 Polyfill 方式在目标环境中添加缺失的特性(@babel/polyfill模块) polyfill会启动某些语法解析
3、babel-core 源码转换

# babel 编译

babel在编译代码过程中核心的库就是@babel/core。babel-core其实相当于@babel/parse和@babel/generator这两个包的合体

@babel/parser:babel解析器。

@babel/types: 这个模块包含手动构建 AST 和检查 AST 节点类型的方法(比如通过对应的api生成对应的节点)。

@babel/traverse: 这个模块用于对Ast的遍历，它维护了整棵树的状态(需要注意的是traverse对于ast是一种深度遍历)。

@babel/generator: 这个模块用于代码的生成，通过AST生成新的代码返回。

# 三个概念

最新ES语法，比如：箭头函数，let/const。
最新ES Api，比如Promise
最新ES实例/静态方法，比如String.prototype.include

babel-prest-env仅仅只会转化最新的es语法，并不会转化对应的Api和实例方法,比如说ES 6中的Array.from静态方法。babel是不会转译这个方法的，如果想在低版本浏览器中识别并且运行Array.from方法达到我们的预期就需要额外引入polyfill进行在Array上添加实现这个方法。
其实可以稍微简单总结一下，语法层面的转化preset-env完全可以胜任。但是一些内置方法模块，仅仅通过preset-env的语法转化是无法进行识别转化的，所以就需要一系列类似”垫片“的工具进行补充实现这部分内容的低版本代码实现。这就是所谓的polyfill的作用。

# @babel/preset-env

preset-env内部集成了绝大多数plugin（State > 3）的转译插件，它会根据对应的参数进行代码转译。不会包含任何低于 Stage 3 的 JavaScript 语法提案。如果需要兼容低于Stage 3阶段的语法则需要额外引入对应的Plugin进行兼容。babel-preset-env仅仅针对语法阶段的转译，比如转译箭头函数，const/let语法。@babel/preset-env 主要作用是对我们所使用的并且**目标浏览器中缺失的功能进行代码转换和加载 polyfill**，在不进行任何配置的情况下，@babel/preset-env 所包含的插件将支持所有最新的JS特性(ES2015,ES2016等，不包含 stage 阶段)，将其转换成ES5代码。例如，如果你的代码中使用了可选链(目前，仍在 stage 阶段)，那么只配置 @babel/preset-env，转换时会抛出错误，需要另外安装相应的插件。针对一些Api或者Es 6内置模块的polyfill，preset-env是无法进行转译的。

需要说明的是，@babel/preset-env 会根据你配置的目标环境，生成插件列表来编译。对于基于浏览器或 Electron 的项目，官方推荐使用 .browserslistrc 文件来指定目标环境。默认情况下，如果你没有在 Babel 配置文件中(如 .babelrc)设置 targets 或 ignoreBrowserslistConfig，@babel/preset-env 会使用 browserslist 配置源。
如果你不是要兼容所有的浏览器和环境，推荐你指定目标环境，这样你的编译代码能够保持最小。
例如，仅包括浏览器市场份额超过0.25％的用户所需的 polyfill 和代码转换（忽略没有安全更新的浏览器，如 IE10 和 BlackBerry）:
```
//.browserslistrc
> 0.25%
not dead
```

例如，你将 .browserslistrc 的内容配置为: 
```
last 2 Chrome versions
```

然后再执行 npm run compiler，你会发现箭头函数不会被编译成ES5，因为 chrome 的最新2个版本都能够支持箭头函数。现在，我们将 .browserslistrc 仍然换成之前的配置。


[更多browserlist的判断](https://github.com/browserslist/browserslist)

```
"presets": [
    [
      "@babel/env",
      {
        "modules": false,
        "shippedProposals": true
      }
    ]
  ],
因为写在了presets里所以@babel/env也就是@babel/preset-env

同理

"plugins": [
    [
      "@babel/transform-runtime",
      {
        "corejs": 3,
        "version": "^7.10.4"
      }
    ]
  ],
  
也就是@babel/plugin-transform-runtime

@babel/preset-env里会加上@babel/plugin-transform-arrow-functions、 @babel/plugin-transform-block-scoping
```

# polyfill

## babel内置的polyfill包

* @babel/polyfill
* @babel/runtime
* @babel/plugin-transform-runtime


## @babel/polyfill

通过babelPolyfill通过往全局对象上添加属性以及直接修改内置对象的Prototype上添加方法实现polyfill。
比如说我们需要支持String.prototype.include，在引入babelPolyfill这个包之后，它会在全局String的原型对象上添加include方法从而支持我们的Js Api。我们说到这种方式本质上是往全局对象/内置对象上挂载属性，所以这种方式难免会造成全局污染。

### 应用@babel/polyfill

我们需要将完整的 polyfill 在代码之前加载，修改我们的 src/index.js:
```
import '@babel/polyfill';

const isHas = [1,2,3].includes(2);

const p = new Promise((resolve, reject) => {
    resolve(100);
});
```
@babel/polyfill 需要在其它代码之前引入，我们也可以在 webpack 中进行配置。例如:
```
entry: [
    require.resolve('./polyfills'),
    path.resolve('./index')
]
```
不过，很多时候，我们未必需要完整的 @babel/polyfill，这会导致我们最终构建出的包的体积增大，@babel/polyfill的包大小为89K (当前 @babel/polyfill 版本为 7.7.0)。我们更期望的是，如果我使用了某个新特性，再引入对应的 polyfill，避免引入无用的代码。


有一点需要注意：配置此参数的值为 usage ，必须要同时设置 corejs (如果不设置，会给出警告，默认使用的是"corejs": 2) 首先说一下使用 core-js@3 的原因，core-js@2 分支中已经不会再添加新特性，新特性都会添加到 core-js@3。例如你使用了 Array.prototype.flat()，如果你使用的是 core-js@2，那么其不包含此新特性。为了可以使用更多的新特性，建议大家使用 core-js@3。

**在babel-preset-env中存在一个useBuiltIns参数，这个参数决定了如何在preset-env中使用@babel/polyfill。**

{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": false
        }]
    ]
}


useBuiltIns--"usage"| "entry"| false

#### false
当我们使用preset-env传入useBuiltIns参数时候，默认为false。它表示仅仅会转化最新的ES语法，并不会转化任何Api和方法。

#### entry
当传入entry时，需要我们在项目入口文件中手动引入一次core-js，它会根据我们配置的浏览器兼容性列表(browserList)然后全量引入不兼容的polyfill。

Tips:  在Babel7.4。0之后，@babel/polyfill被废弃它变成另外两个包的集成。"core-js/stable"; "regenerator-runtime/runtime";。你可以在这里看到变化，但是他们的使用方式是一致的，只是在入口文件中引入的包不同了。

同时需要注意的是，在我们使用useBuiltIns:entry/usage时，需要额外指定core-js这个参数。默认为使用core-js 2.0，所谓的core-js就是我们上文讲到的“垫片”的实现。它会实现一系列内置方法或者Promise等Api。

core-js 2.0版本是跟随preset-env一起安装的，不需要单独安装哦～

#### usage
上边我们说到配置为entry时，perset-env会基于我们的浏览器兼容列表进行全量引入polyfill。所谓的全量引入比如说我们代码中仅仅使用了Array.from这个方法。但是polyfill并不仅仅会引入Array.from，同时也会引入Promise、Array.prototype.include等其他并未使用到的方法。这就会造成包中引入的体积太大了。
此时就引入出了我们的useBuintIns:usage配置。
当我们配置useBuintIns:usage时，会根据配置的浏览器兼容，以及代码中 使用到的Api 进行引入polyfill按需添加。
当使用usage时，我们不需要额外在项目入口中引入polyfill了，它会根据我们项目中使用到的进行按需引入。
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "usage",
            "core-js": 3
        }]
    ]
}

### 关于usage和entry存在一个需要注意的本质上的区别。
我们以项目中引入Promise为例。
当我们配置useBuintInts:entry时，仅仅会在入口文件全量引入一次polyfill。你可以这样理解:
// 当使用entry配置时
...
// 一系列实现polyfill的方法
global.Promise = promise

// 其他文件使用时
const a = new Promise()

而当我们使用useBuintIns:usage时，preset-env只能基于各个模块去分析它们使用到的polyfill从而进入引入。preset-env会帮助我们智能化的在需要的地方引入，比如:

// a. js 中
import "core-js/modules/es.promise";

...

// b.js中

import "core-js/modules/es.promise";
...

在usage情况下，如果我们存在很多个模块，那么无疑会多出很多冗余代码(import语法)。

同样在使用usage时因为是模块内部局部引入polyfill所以按需在模块内进行引入，而entry则会在代码入口中一次性引入。

usageBuintIns不同参数分别有不同场景的适应度，具体参数使用场景还需要大家结合自己的项目实际情况找到最佳方式。

## @babel/runtime

上边我们讲到@babel/polyfill是存在污染全局变量的副作用，在实现polyfill时Babel还提供了另外一种方式去让我们实现这功能，那就是@babel/runtime。

Babel/runtime 会使用很小的辅助函数来实现类似 _createClass 等公共方法。默认情况下，它将被添加(inject)到需要它的每个文件中。

简单来讲，@babel/runtime更像是一种按需加载的解决方案，比如哪里需要使用到Promise，@babel/runtime就会在他的文件顶部添加import promise from 'babel-runtime/core-js/promise'。

同时上边我们讲到对于preset-env的useBuintIns配置项，我们的polyfill是preset-env帮我们智能引入。
而babel-runtime则会将引入方式由智能完全交由我们自己，我们需要什么自己引入什么。
它的用法很简单，只要我们去安装npm install --save @babel/runtime后，在需要使用对应的polyfill的地方去单独引入就可以了。比如：

```
// a.js 中需要使用Promise 我们需要手动引入对应的运行时polyfill
import Promise from 'babel-runtime/core-js/promise'

const promsies = new Promise()
```
总而言之，babel/runtime你可以理解称为就是一个运行时“哪里需要引哪里”的工具库。

针对babel/runtime绝大多数情况下我们都会配合@babel/plugin-transfrom-runtime进行使用达到智能化runtime的polyfill引入。


## @babel/plugin-transform-runtime

**babel-runtime存在的问题**

babel-runtime在我们手动引入一些polyfill的时候，它会给我们的代码中注入一些类似_extend()， classCallCheck()之类的工具函数，这些工具函数的代码会包含在编译后的每个文件中，比如：

```
class Circle {}
// babel-runtime 编译Class需要借助_classCallCheck这个工具函数
function _classCallCheck(instance, Constructor) { //... } 
var Circle = function Circle() { _classCallCheck(this, Circle); };
```
如果我们项目中存在多个文件使用了class，那么无疑在每个文件中注入这样一段冗余重复的工具函数将是一种灾难。
所以针对上述提到的两个问题:

**babel-runtime无法做到智能化分析，需要我们手动引入。**
**babel-runtime编译过程中会重复生成冗余代码。**

@babel/plugin-transform-runtime插件的作用恰恰就是为了解决上述我们提到的run-time存在的问题而提出的插件。

babel-runtime无法做到智能化分析，需要我们手动引入。

@babel/plugin-transform-runtime插件会智能化的分析我们的项目中所使用到需要转译的js代码，从而实现模块化从babel-runtime中引入所需的polyfill实现。

babel-runtime编译过程中会重复生成冗余代码。

@babel/plugin-transform-runtime插件提供了一个helpers参数。具体你可以在这里查阅它的所有配置参数。
这个helpers参数开启后可以将上边提到编译阶段重复的工具函数，比如classCallCheck, extends等代码转化称为require语句。此时，这些工具函数就不会重复的出现在使用中的模块中了。比如这样：

```
// @babel/plugin-transform-runtime会将工具函数转化为require语句进行引入
// 而非runtime那样直接将工具模块代码注入到模块中
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck"); 
var Circle = function Circle() { _classCallCheck(this, Circle); };

```
使用 @babel/plugin-transform-runtime 插件，所有帮助程序都将引用模块 @babel/runtime，这样就可以避免编译后的代码中出现重复的帮助程序，有效减少包体积。@babel/plugin-transform-runtime 是一个可以重复使用 Babel 注入的帮助程序，以节省代码大小的插件。@babel/plugin-transform-runtime 通常仅在开发时使用，但是运行时最终代码需要依赖 @babel/runtime，所以 @babel/runtime 必须要作为生产依赖被安装。

**使用@babel/plugin-transform-runtime不是直接将函数 inject 到代码中，而是从 @babel/runtime 中引入。前文说了使用 @babel/plugin-transform-runtime 可以避免全局污染，我们来看看是如何避免污染的。引入@babel/runtime-corejs3包会发现@babel/plugin-transform-runtime会从@babel/runtime-corejs3中引入方法，而不是直接修改全局方法**

配置@babel/plugin-transform-runtime
```
{
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "absoluteRuntime": false,
        "corejs": false,
        "helpers": true,
        "regenerator": true,
        "version": "7.0.0-beta.0"
      }
    ]
  ]
}
```

## 总结polyfill
在babel中实现polyfill主要有两种方式：


### 一种是通过@babel/polyfill配合preset-env去使用，这种方式可能会存在污染全局作用域。

Preset-env 下使用方式的 entry 和 usage 的最佳实践

entry 方式不是一无是处，我们在使用 Babel 时会将 Babel 编译排除 node_modules 目录（第三方模板）。
此时如果使用 usage 参数，如果我们依赖的一些第三方包中使用到了一些比较新的 ES 内置模块，比如它使用了Promise。但此时我们的代码中并没有使用 Promise ，如果使用 usage 参数那么问题就来了。使用 Babel 编译第三方模块强烈不推荐的，编译慢而且可能会造成重复编译造成体积过大的问题。这两种方式都是在全局挂载方法，会污染作用域。

### 一种是通过@babel/runtime配合@babel/plugin-transform-runtime去使用，这种方式并不会污染作用域。

全局引入会污染全局作用域，但是相对于局部引入来说。它会增加很多额外的引入语句，增加包体积。


在 useBuintIns:usage 情况下其实和@babel/plugin-transform-runtime情况下是类似的作用，
通常我个人选择是会在开发类库时遵守不污染全局为首先使用@babel/plugin-transform-runtime而在业务开发中使用@babel/polyfill。

@babel/runtime 在转译会在每个模块中各自实现一遍一些 _extend()， classCallCheck() 之类的辅助工具函数，当我们项目中的模块比较多时每个项目中都实现一次这些方法，这无疑是一种噩梦。
@babel/plugin-transform-runtime 这个插件正式基于 @babel/runtime 可以更加智能化的分析我们的代码，同时 @babel/plugin-transform-runtime 支持一个 helper 参数默认为 true 它会提取 @babel/runtime 编译过程中一些重复的工具函数变成外部模块引入的方式。

全局引入会污染全局作用域，但是相对于局部引入来说。它会增加很多额外的引入语句，增加包体积。


@babel/runtime 配合 @babel/plugin-transform-runtime 的确可以解决 usage 污染全局作用域的问题，使用它来开发类库看起来非常完美。但是它不适合业务，因为@babel/runtime配合@babel/plugin-transform-runtime不会因为我们的页面的目标浏览器动态调整 polyfill 的内容，而 useBuiltIns 则会根据配置的目标浏览器而决定是否需要引入相应的 polyfill。

在日常业务开发中，对于全局环境污染的问题往往并不是那么重要。而业务代码最终的承载大部分是浏览器端，所以如果针对不同的目标浏览器支持度从而引入相应的 polyfill 无疑会对我们的代码体积产生非常大的影响，此时选择 preset-env 开启 useBuiltIns 的方式会更好一些。所以简单来讲，我个人强烈推荐在日常业务中尽可能使用 @babel/preset-env 的 useBuiltIns 配置配合需要支持的浏览器兼容性来提供 polyfill 。

同时关于业务项目中究竟应该选择 useBuiltIns 中的 entry 还是 usage ，我在上边已经和大家详细对比过这两种方式。究竟应该如何选择这两种配置方案，在不同的业务场景下希望大家可以根据场景来选择最佳方案。而不是一概的认为 entry 无用无脑使用 usage 。

开发类库在我们开发类库时往往和浏览器环境无关所以在进行 polyfill 时最主要考虑的应该是不污染全局环境，此时选择 @babel/runtime 无疑更加合适。在类库开发中仅仅开启 @babel/preset-env 的语法转化功能配合 @babel/runtime 提供一种不污染全局环境的 polyfill 可能会更加适合你的项目场景。参考如下代码的配置

关于提供 polyfill 的方法，我强烈建议大家不要同时开启两种polyfill，这两个东西完全是 Babel 提供给不同场景下的不同解决方案。

它不仅会造成重复打包的问题还有可能在某些环境下直接造成异常，具体你可以参考这个 Issue。
当然，你同样可以在业务项目中配合 @babel/preset-env 的 polyfill 同时使用 @babel/plugin-transform-runtime 的 helper 参数来解决多个模块内重复定义工具函数造成冗余的问题。
但是切记设置 runtime 的 corejs:false 选项，关闭 runtime 提供的 polyfill 的功能，仅保留一种 polyfill 提供方案。
最后，无论是哪一种 polyfill 的方式，我强烈推荐你使用 corejs@3 版本来提供 polyfill。

```
```
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/main.js',
  output: {
    file: 'build/bundle.js',
    format: 'esm',
    strict: false,
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      babelrc: false,
      babelHelpers: 'runtime',
      presets: [
        [
          '@babel/preset-env',
          {
            // 其实默认就是false，这里我为了和大家刻意强调不要混在一起使用
            useBuiltIns: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            absoluteRuntime: false,
            // polyfill使用的corejs版本
            // 需要注意这里是@babel/runtime-corejs3 和 preset-env 中是不同的 npm 包
            corejs: 3,
            // 切换对于 @babel/runtime 造成重复的 _extend() 之类的工具函数提取
            // 默认为true 表示将这些工具函数抽离成为工具包引入而不必在每个模块中单独定义
            helpers: true,
            // 切换生成器函数是否污染全局 
            // 为true时打包体积会稍微有些大 但生成器函数并不会污染全局作用域
            regenerator: true,
            version: '7.0.0-beta.0',
          },
        ],
      ],
    }),
  ],
};

这里我关闭了 preset-env 的 useBuiltIns ，仅仅使用 preset-env 转译 ES 语法。
而对于一些 ES API 和对应的内置模板，使用 @babel/plugin-transform-runtime 配合 @babel/runtime 来提供 polyfill 
```
```

### @babel/register

```
它会改写require命令，为它加上一个钩子。此后，每当使用require加载.js、.jsx、.es和.es6后缀名的文件，就会先用Babel进行转码。
```
### babel-loader

```
babel-loader的本质就是一个函数，我们匹配到对应的jsx?/tsx?的文件交给babel-loader处理。babel-loader仅仅是识别匹配文件和接受对应参数的函数。
```
### babel-preset-react

```
babel-preset-react这个预设起到的就是将jsx进行转译的作用。
```
### babel-preset-typescript

```
对于TypeScript代码，我们有两种方式去编译TypeScript代码成为JavaScript代码。
使用tsc命令，结合cli命令行参数方式或者tsconfig配置文件进行编译ts代码。
使用babel，通过babel-preset-typescript代码进行编译ts代码。

```



# 探索不同场景下Babel最佳实践方案---业务babel最佳实践
[原文链接](https://juejin.cn/post/7051355444341637128)

## present/env + babel/polyfill

### entry方式
```
// rollup.config.js
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/main.js',
  output: {
    file: 'build/bundle.js',
    format: 'esm',
    strict: false,
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      babelrc: false,
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: '> 0.5%, ie >= 11',
            },
            useBuiltIns: 'entry',
            corejs: 3,
          },
        ],
      ],
    }),
  ],
};

// 项目入口文件
import 'core-js/stable';
import 'regenerator-runtime/runtime';

const arr = [1];

// 使用了 Array.protototype.includes 方法
const result = arr.includes(2);

console.log(result, 'result');
```

corejs 版本2目前已经不被维护了，关于 corejs 的作用你可以将它理解称为上边我们讲到的 polyfill 中关于 ES API 以及内置模块的核心实现内容。
换句话说，corejs 内部帮我们实现了一系列低版本浏览器不支持的 API 内置模块等方法。

项目入口文件中

import 'core-js/stable';
import 'regenerator-runtime/runtime';

当使用 useBuiltIns: 'entry' 时需要额外在项目的入口文件引入这两个包。

在 babel@7.4 版本之前使用 entry 配置时需要在入口引入@babel/polyfill，在7.4 版本之后@babel/polyfill被废弃了，更换为我们上边提到的两个包。

打包结果：这里我仅仅截图出了部分的打包结果，可以看到输出的打包结果其实有10000多行代码。
这是因为当我们使用 useage:entry 配置时，babel 会根据配置的 targets 浏览器兼容性列表来决定。从而将目标浏览器下不支持的内容在项目入口处进行全量引入，分别挂载在对应全局对象上从而达到 polyfill 的作用。

**总结使用 preset-env 的 useBuiltIns: entry**

这种方式需要两个步骤的配置：

首先在 preset-env 中配置 useBuiltIns: 'entry' 。

其次需要在项目的入口文件中引入相应的包。

如此之后，Babel 就会根据我们配置需要支持的浏览器列表，将目标浏览器中不支持的 polyfill 进行全量引入并且实现。

### usage方式

针对于 useBuiltIns:entry 配置的方式，存在一个比较致命的问题：
使用 entry 的方式，假使我们代码中仅使用到了 Array.prototype.includes 方法但是它会将目标浏览器中所有不兼容的 polyfill 全部实现并且引入进项目，造成包体积过大。
针对这种情况，Babel-Preset-Env useBuiltIns 提供了另一种配置方式:usage。
所谓 usage 即是表示它会分析我们的源代码，判断如果目标浏览器不支持并且我们代码中使用到的情况下才会在模块内进行引入对应的 polyfil。

```
// rollup.config.js
// ...

export default {
  // ...
  plugins: [
    commonjs(),
    resolve(),
    babel({
      // exclude: ['node_modules/core-js/**', '/core-js/'],
      babelrc: false,
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: '> 0.5%, ie >= 11',
            },
            // 修改entry为usage
            useBuiltIns: 'usage',
            corejs: 3,
          },
        ],
      ],
    }),
  ],
};

// ./src/main.js
// 不需要在入口文件引入这两个库了
// import 'core-js/stable';
// import 'regenerator-runtime/runtime';

const arr = [1];

const result = arr.includes(2);

console.log(result, 'result');
```
此时可以看到，打包出来的代码仅仅剩下 4K 多行。这即是因为我们仅仅使用了 Array.prototype.includes 。
使用 usage 时，代码中仅仅会引入使用到的 Array.prototype.includes 对应的 polyfill 内容。

**usage 简单总结**

我们可以看到配合 Preset-Env 的 usage 参数，Babel 会智能的分析源代码中使用到的内容。
它仅仅会为我们引入目标浏览器中不支持并且我们在代码中使用到的内容，会剔除没有使用到的 polyfill 内容。
针对于一些虽然目标浏览器不支持的内容，比如 Promise 但是这里我们代码中并没有使用，它不会将相应的 polyfill 内容打包到最终结果中。相对于 entry 选项，usage 看起来更加智能化也更加的轻量。

### Preset-env 两种方式最佳实践
通常，我们在使用 Babel 时会将 Babel 编译排除 node_modules 目录（第三方模板）。此时如果使用 usage 参数，如果我们依赖的一些第三方包中使用到了一些比较新的 ES 内置模块，比如它使用了Promise。但此时我们的代码中并没有使用 Promise ，如果使用 usage 参数那么问题就来了。

代码中没有使用 Promise 自然 Promise 的 polyfill 并不会编译到最终的输出目录中，而第三种模块依赖了 Promise 但此时没有 Polyfill 浏览器并不认识这个东西。

也许你会强调，那么我使用 babel 编译我的第三方模块呢，又或者我在入口处额外单独引入 Promise 的 polyfill 总可以吧。

首先，在入口文件中单独引入 Promise 是假设在已知前提下既是说我了解第三方库代码中使用 Promise 而我的代码中没有 Promise 我需要 polyfil。

这样的情况在多人合作的大型项目下只能说一种理想情况。

其次使用 Babel 编译第三方模块我个人是强烈不推荐的，抛开编译慢而且可能会造成重复编译造成体积过大的问题。

这种情况下，使用 entry 配置它不香吗？

usage 相比 entry 固然更加轻量和智能，但是针对于业务场景下如果对于包体积没有强烈的要求下，我更加推荐你使用 entry 配合在入口处引入项目中所需 polyfill 因为这会避免很多第三方模块没有对应 polyfill 的造成的奇怪问题。

**无论是 entry 还是 usage 本质上都是通过注入浏览器不支持的 polyfill 在对应的全局对象上增加功能实现，这样无疑是会污染全局环境。**

假如此时你在开发一款类库，使用 useBuiltIns 在库的编译上实现 polyfill ，当你开发完毕提交 Github 看似大功告成时。
此时一位印度小哥使用了你的库，但小哥在自己的代码中重新定义了 Array.prototype.includes 方法的实现，额外填充了一些逻辑。
OK，小哥安装你开发的库。运行代码，不出意外代码报错了。因为你库中的 Array.prototype.includes polyfill 实现污染了全局，影响了印度小哥自己定义的代码。


## @babel/runtime + @babel/plugin-transform-runtime

@babel/plugin-transform-runtime 这个插件正式基于 @babel/runtime 可以更加智能化的分析我们的代码，同时 @babel/plugin-transform-runtime 支持一个 helper 参数默认为 true 它会提取 @babel/runtime 编译过程中一些重复的工具函数变成外部模块引入的方式。

babel-runtime无法做到智能化分析，需要我们手动引入。

@babel/plugin-transform-runtime插件会智能化的分析我们的项目中所使用到需要转译的js代码，从而实现模块化从babel-runtime中引入所需的polyfill实现。@babel-runtime编译过程中会重复生成冗余代码。

@babel/plugin-transform-runtime插件提供了一个helpers参数。

这个helpers参数开启后可以将上边提到编译阶段重复的工具函数，比如classCallCheck, extends等代码转化称为require语句。此时，这些工具函数就不会重复的出现在使用中的模块中了
```
// @babel/plugin-transform-runtime会将工具函数转化为require语句进行引入
// 而非runtime那样直接将工具模块代码注入到模块中
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck"); 
var Circle = function Circle() { _classCallCheck(this, Circle); };
```
@babel/plugin-transform-runtime 的使用方式

```
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';

export default {
  input: 'src/main.js',
  output: {
    file: 'build/bundle.js',
    format: 'esm',
    strict: false,
  },
  plugins: [
    commonjs(),
    resolve(),
    babel({
      babelrc: false,
      babelHelpers: 'runtime',
      presets: [
        [
          '@babel/preset-env',
          {
            // 其实默认就是false，这里我为了和大家刻意强调不要混在一起使用
            useBuiltIns: false,
          },
        ],
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            absoluteRuntime: false,
            // polyfill使用的corejs版本
            // 需要注意这里是@babel/runtime-corejs3 和 preset-env 中是不同的 npm 包
            corejs: 3,
            // 切换对于 @babel/runtime 造成重复的 _extend() 之类的工具函数提取
            // 默认为true 表示将这些工具函数抽离成为工具包引入而不必在每个模块中单独定义
            helpers: true,
            // 切换生成器函数是否污染全局 
            // 为true时打包体积会稍微有些大 但生成器函数并不会污染全局作用域
            regenerator: true,
            version: '7.0.0-beta.0',
          },
        ],
      ],
    }),
  ],
};
```
仅仅抽离保留我们代码中使用到的新语法提供 polyfill 实现，但是 @babel/runtime 相对于 usage 而言还存在一个更加值得注意的点它并不会污染全局作用域。
可以看到最终打包后的代码，之前 usage 是使用 $({target:'Array',proto:true}) ... 直接在 Array.prototype 上定义对应的 polyfill 实现。
而 @babel/runtime 打包后的结果可以明显的看到我们是借助引入的 _includesInstanceProperty 方来调用的。


## @babel/runtime 为什么不适合业务项目
说了这么多，那么 transform runtime 真的如我们想象中的那么完美无瑕嘛？
@babel/runtime 配合 @babel/plugin-transform-runtime 的确可以解决 usage 污染全局作用域的问题，使用它来开发类库看起来非常完美。
有些小伙伴可能就会想到，既然它提供和 usage 一样的智能化按需引入同时还不会污染全局作用域。
那么，为什么我不能直接在业务项目中直接使用 @babel/runtime ，这样岂不是更好吗？
答案肯定是否定的，任何事情都存在它的两面性。
需要额外注意的是 transform runtime 与环境无关，它并不会因为我们的页面的目标浏览器动态调整 polyfill 的内容，而 useBuiltIns 则会根据配置的目标浏览器而决定是否需要引入相应的 polyfill。

## 业务
在日常业务开发中，对于全局环境污染的问题往往并不是那么重要。而业务代码最终的承载大部分是浏览器端，所以如果针对不同的目标浏览器支持度从而引入相应的 polyfill 无疑会对我们的代码体积产生非常大的影响，此时选择 preset-env 开启 useBuiltIns 的方式会更好一些。
所以简单来讲，我个人强烈推荐在日常业务中尽可能使用 @babel/preset-env 的 useBuiltIns 配置配合需要支持的浏览器兼容性来提供 polyfill 。
同时关于业务项目中究竟应该选择 useBuiltIns 中的 entry 还是 usage ，我在上边已经和大家详细对比过这两种方式。究竟应该如何选择这两种配置方案，在不同的业务场景下希望大家可以根据场景来选择最佳方案。而不是一概的认为 entry 无用无脑使用 usage 。
## 类库
在我们开发类库时往往和浏览器环境无关所以在进行 polyfill 时最主要考虑的应该是不污染全局环境，此时选择 @babel/runtime 无疑更加合适。
在类库开发中仅仅开启 @babel/preset-env 的语法转化功能配合 @babel/runtime 提供一种不污染全局环境的 polyfill 可能会更加适合你的项目场景。
## Tips
关于提供 polyfill 的方法，我强烈建议大家不要同时开启两种polyfill，这两个东西完全是 Babel 提供给不同场景下的不同解决方案。
它不仅会造成重复打包的问题还有可能在某些环境下直接造成异常，具体你可以参考这个 Issue。
当然，你同样可以在业务项目中配合 @babel/preset-env 的 polyfill 同时使用 @babel/plugin-transform-runtime 的 helper 参数来解决多个模块内重复定义工具函数造成冗余的问题。
但是切记设置 runtime 的 corejs:false 选项，关闭 runtime 提供的 polyfill 的功能，仅保留一种 polyfill 提供方案。
最后，无论是哪一种 polyfill 的方式，我强烈推荐你使用 corejs@3 版本来提供 polyfill。

# 插件顺序
插件在 Presets 前运行。
插件顺序从前往后排列。
Preset 顺序是颠倒的（从后往前）。

例如:
{
    "plugins": ["@babel/plugin-proposal-class-properties", "@babel/plugin-syntax-dynamic-import"]
}

先执行 @babel/plugin-proposal-class-properties，后执行 @babel/plugin-syntax-dynamic-import
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}

preset 的执行顺序是颠倒的，先执行 @babel/preset-react， 后执行 @babel/preset-env。



