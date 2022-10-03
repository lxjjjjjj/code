[原文链接](https://juejin.cn/post/7025237833543581732)
[babel7](https://juejin.cn/post/6844904008679686152#heading-5)

# babel是什么
Babel 是一个 JS 编译器，Babel 是一个工具链，主要用于将 ECMAScript 2015+ 版本的代码转换为向后兼容的 JavaScript 语法，以便能够运行在当前和旧版本的浏览器或其他环境中。

# babel能做什么
1、语法转换 解析语法然后编译成向后兼容的语法
2、通过 Polyfill 方式在目标环境中添加缺失的特性(@babel/polyfill模块) polyfill会启动某些语法解析
3、源码转换(codemods)

# polyfill

最新ES Api，比如Promise、最新ES实例/静态方法，比如String.prototype.include、语法层面的转化preset-env完全可以胜任。但是一些内置方法模块，仅仅通过preset-env的语法转化是无法进行识别转化的

babel内置的polyfill包

```
@babel/polyfill

@babel/runtime

@babel/plugin-transform-runtime
```
# babel-core

```
babel在编译代码过程中核心的库就是@babel/core。babel-core其实相当于@babel/parse和@babel/generator这两个包的合体
```
大概做的事情
```
const core = require('@babel/core');

/**
 *
 * @param sourceCode 源代码内容
 * @param options babel-loader相关参数
 * @returns 处理后的代码
 */
function babelLoader(sourceCode, options) {
  // 通过transform方法编译传入的源代码
  core.transform(sourceCode, {
    presets: ['babel-preset-env'],
    plugins: [...]
  });
  return targetCode;
}
```

# 常见plugin和Preset
所谓Preset就是一些Plugin组成的合集,你可以将Preset理解称为就是一些的Plugin整合称为的一个包。

## 插件顺序
如果两个转换插件都将处理“程序（Program）”的某个代码片段，则将根据转换插件或 preset 的排列顺序依次执行。
* 插件在 Presets 前运行。
* 插件顺序从前往后排列。
* Preset 顺序是颠倒的（从后往前）。
  
```
例如:
{
    "plugins": ["@babel/plugin-proposal-class-properties", "@babel/plugin-syntax-dynamic-import"]
}

先执行 @babel/plugin-proposal-class-properties，后执行 @babel/plugin-syntax-dynamic-import
{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}

preset 的执行顺序是颠倒的，先执行 @babel/preset-react， 后执行 @babel/preset-env。

```
### @babel/preset-env

preset-env内部集成了绝大多数plugin（State > 3）的转译插件，它会根据对应的参数进行代码转译。不会包含任何低于 Stage 3 的 JavaScript 语法提案。如果需要兼容低于Stage 3阶段的语法则需要额外引入对应的Plugin进行兼容。babel-preset-env仅仅针对语法阶段的转译，比如转译箭头函数，const/let语法。@babel/preset-env 主要作用是对我们所使用的并且目标浏览器中缺失的功能进行代码转换和加载 polyfill，在不进行任何配置的情况下，@babel/preset-env 所包含的插件将支持所有最新的JS特性(ES2015,ES2016等，不包含 stage 阶段)，将其转换成ES5代码。例如，如果你的代码中使用了可选链(目前，仍在 stage 阶段)，那么只配置 @babel/preset-env，转换时会抛出错误，需要另外安装相应的插件。针对一些Api或者Es 6内置模块的polyfill，preset-env是无法进行转译的。

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


### @babel/polyfill

通过babelPolyfill通过往全局对象上添加属性以及直接修改内置对象的Prototype上添加方法实现polyfill。比如说我们需要支持String.prototype.include，在引入babelPolyfill这个包之后，它会在全局String的原型对象上添加include方法从而支持我们的Js Api。我们说到这种方式本质上是往全局对象/内置对象上挂载属性，所以这种方式难免会造成全局污染。从 Babel 7.4.0 开始，这个包已经被弃用，单独安装 core-js 和 regenerator-runtime 模块。（以填充 ECMAScript 特性）

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
不过，很多时候，我们未必需要完整的 @babel/polyfill，这会导致我们最终构建出的包的体积增大，@babel/polyfill的包大小为89K (当前 @babel/polyfill 版本为 7.7.0)。
我们更期望的是，如果我使用了某个新特性，再引入对应的 polyfill，避免引入无用的代码。

应用@babel/polyfill

有一点需要注意：配置此参数的值为 usage ，必须要同时设置 corejs (如果不设置，会给出警告，默认使用的是"corejs": 2) 首先说一下使用 core-js@3 的原因，core-js@2 分支中已经不会再添加新特性，新特性都会添加到 core-js@3。例如你使用了 Array.prototype.flat()，如果你使用的是 core-js@2，那么其不包含此新特性。为了可以使用更多的新特性，建议大家使用 core-js@3。

#### useBuiltIns的值为false
```
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": false
        }]
    ]
}

false  它表示仅仅会转化最新的ES语法，并不会转化任何Api和方法。

```
#### useBuiltIns的值为entry
```
// 项目入口文件中需要额外引入polyfill

import "@babel/polyfill"

// babel
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "entry",
            "corejs": 3
        }]
    ]
}

当传入entry时，需要我们在项目入口文件中手动引入一次core-js，它会根据我们配置的浏览器兼容性列表(browserList)然后全量引入不兼容的polyfill
```
#### useBuiltIns的值为usage
```
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "usage",
            "core-js": 3
        }]
    ]
}

```
当我们配置useBuintIns:usage时，会根据配置的浏览器兼容，以及代码中 使用到的Api 进行引入polyfill按需添加。

它仅仅会为我们引入目标浏览器中不支持并且我们在代码中使用到的内容，会剔除没有使用到的 polyfill 内容
在 useBuiltIns 参数值为 usage 时，仍然需要安装 @babel/polyfill，虽然我们上面的代码转换中看起来并没有使用到，但是，如果我们源码中使用到了 async/await，那么编译出来的代码需要 require("regenerator-runtime/runtime")，在 @babel/polyfill 的依赖中，当然啦，你也可以只安装 regenerator-runtime/runtime 取代安装 @babel/polyfill。

#### 带有browserList的配置
```
// https://babeljs.io/docs/en/configuration
const presets = [
  [
    '@babel/env',
    {
      // https://babeljs.io/docs/en/babel-preset-env#targets
      // TODO: how to compatibilite with ie 8
      targets: {
        ie: '8',
        edge: '17',
        firefox: '60',
        chrome: '67',
        safari: '11.1'
        /**
         * you can also set browsers in package.json
         * "browserslist": ["last 3 versions"]
         * relative links:
         * https://github.com/browserslist/browserslist
         */
      },
      corejs: '3',
      // corejs: { version: 3, proposals: true },
      /**
       * https://babeljs.io/docs/en/usage#polyfill
       * https://github.com/zloirock/core-js#babelpreset-env
       * "usage" will practically apply the last optimization mentioned above where you only include the polyfills you need
       */
      useBuiltIns: 'usage'
    }
  ]
]
const plugins = []

if (process.env['ENV'] === 'prod') {
  // plugins.push(...);
}
module.exports = { presets, plugins }
```

#### 关于usage和entry存在一个需要注意的本质上的区别

当我们配置useBuintInts:entry时，仅仅会在入口文件全量引入一次polyfill。你可以这样理解:
```
// 当使用entry配置时
...
// 一系列实现polyfill的方法
global.Promise = promise

// 其他文件使用时
const a = new Promise()
```
而当我们使用useBuintIns:usage时，preset-env只能基于各个模块去分析它们使用到的polyfill从而进入引入。

```
// a. js 中
import "core-js/modules/es.promise";

// b.js中

import "core-js/modules/es.promise";

```
在usage情况下，如果我们存在很多个模块，那么无疑会多出很多冗余代码(import语法)。

同样在使用usage时因为是模块内部局部引入polyfill所以按需在模块内进行引入，而entry则会在代码入口中一次性引入。
### @babel/plugin-transform-runtime
Babel 会使用很小的辅助函数来实现类似 _createClass 等公共方法。默认情况下，它将被添加(inject)到需要它的每个文件中。
```
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    };
    getX() {
        return this.x;
    }
}

let cp = new ColorPoint(25, 8);
```
编译后的文件
```
"use strict";

require("core-js/modules/es.object.define-property");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Point =
    /*#__PURE__*/
    function () {
        function Point(x, y) {
            _classCallCheck(this, Point);

            this.x = x;
            this.y = y;
        }

        _createClass(Point, [{
            key: "getX",
            value: function getX() {
                return this.x;
            }
        }]);

        return Point;
    }();

var cp = new ColorPoint(25, 8);
```
看起来，似乎并没有什么问题，但是你想一下，如果你有10个文件中都使用了这个 class，是不是意味着 _classCallCheck、_defineProperties、_createClass 这些方法被 inject 了10次。这显然会导致包体积增大，最关键的是，我们并不需要它 inject 多次。
这个时候，就是 @babel/plugin-transform-runtime 插件大显身手的时候了，使用 @babel/plugin-transform-runtime 插件，所有帮助程序都将引用模块 @babel/runtime，这样就可以避免编译后的代码中出现重复的帮助程序，有效减少包体积。@babel/plugin-transform-runtime 是一个可以重复使用 Babel 注入的帮助程序，以节省代码大小的插件。

注意：诸如 Array.prototype.flat() 等实例方法将不起作用，因为这需要修改现有的内置函数(可以使用 @babel/polyfill 来解决这个问题) ——> 对此需要说明的是如果你配置的是corejs3， core-js@3 现在已经支持原型方法，同时不污染原型。

@babel/plugin-transform-runtime 通常仅在开发时使用，但是运行时最终代码需要依赖 @babel/runtime，所以 @babel/runtime 必须要作为生产依赖被安装

**使用@babel/plugin-transform-runtime不是直接将函数 inject 到代码中，而是从 @babel/runtime 中引入。前文说了使用 @babel/plugin-transform-runtime 可以避免全局污染，我们来看看是如何避免污染的。引入@babel/runtime-corejs3包会发现@babel/plugin-transform-runtime会从@babel/runtime-corejs3中引入方法，而不是直接修改全局方法**

### @babel/runtime

@babel/polyfill是存在污染全局变量的副作用，在实现polyfill时Babel还提供了另外一种方式去让我们实现这功能，那就是@babel/runtime。

@babel/runtime更像是一种按需加载的解决方案，比如哪里需要使用到Promise，@babel/runtime就会在他的文件顶部添加import promise from 'babel-runtime/core-js/promise'。

对于preset-env的useBuintIns配置项，我们的polyfill是preset-env帮我们智能引入。
而babel-runtime则会将引入方式由智能完全交由我们自己，我们需要什么自己引入什么。
它的用法很简单，只要我们去安装npm install --save @babel/runtime后，在需要使用对应的polyfill的地方去单独引入就可以了


```
// a.js 中需要使用Promise 我们需要手动引入对应的运行时polyfill
import Promise from 'babel-runtime/core-js/promise'

const promsies = new Promise()
```
**存在的问题**

babel-runtime存在的问题
babel-runtime在我们手动引入一些polyfill的时候，它会给我们的代码中注入一些类似_extend()， classCallCheck()之类的工具函数，这些工具函数的代码会包含在编译后的每个文件中。如果我们项目中存在多个文件使用了class，那么无疑在每个文件中注入这样一段冗余重复的工具函数将是一种灾难。
```
class Circle {}
// babel-runtime 编译Class需要借助_classCallCheck这个工具函数
function _classCallCheck(instance, Constructor) { //... } 
var Circle = function Circle() { _classCallCheck(this, Circle); };
```
所以针对上述提到的两个问题:

- babel-runtime无法做到智能化分析，需要我们手动引入。
- babel-runtime编译过程中会重复生成冗余代码。

### @babel/plugin-transform-runtime

所以@babel/plugin-transform-runtime可以解决@babel/runtime一起使用


```
@babel/plugin-transform-runtime插件会智能化的分析我们的项目中所使用到需要转译的js代码，从而实现模块化从babel-runtime中引入所需的polyfill实现。

@babel/plugin-transform-runtime插件提供了一个helpers参数。具体你可以在这里查阅它的所有配置参数。
这个helpers参数开启后可以将上边提到编译阶段重复的工具函数，比如classCallCheck, extends等代码转化称为require语句。此时，这些工具函数就不会重复的出现在使用中的模块中了

// @babel/plugin-transform-runtime会将工具函数转化为require语句进行引入
// 而非runtime那样直接将工具模块代码注入到模块中
var _classCallCheck = require("@babel/runtime/helpers/classCallCheck"); 
var Circle = function Circle() { _classCallCheck(this, Circle); };
```
基本配置


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

## 使用polyfill的总结

```
我们可以看到针对polyfill其实我耗费了不少去将它们之间的区别和联系，让我们来稍微总结一下吧。
在babel中实现polyfill主要有两种方式：


一种是通过@babel/polyfill配合preset-env去使用，这种方式可能会存在污染全局作用域。

Preset-env 下使用方式的entry和usage的最佳实践

entry 方式不是一无是处，我们在使用 Babel 时会将 Babel 编译排除 node_modules 目录（第三方模板）。
此时如果使用 usage 参数，如果我们依赖的一些第三方包中使用到了一些比较新的 ES 内置模块，比如它使用了Promise。但此时我们的代码中并没有使用 Promise ，如果使用 usage 参数那么问题就来了
使用 Babel 编译第三方模块强烈不推荐的，编译慢而且可能会造成重复编译造成体积过大的问题。

这两种方式都是在全局挂载方法，会污染作用域。



一种是通过@babel/runtime配合@babel/plugin-transform-runtime去使用，这种方式并不会污染作用域。

@babel/runtime 在转译会在每个模块中各自实现一遍一些 _extend()， classCallCheck() 之类的辅助工具函数，当我们项目中的模块比较多时每个项目中都实现一次这些方法，这无疑是一种噩梦。
@babel/plugin-transform-runtime 这个插件正式基于 @babel/runtime 可以更加智能化的分析我们的代码，同时 @babel/plugin-transform-runtime 支持一个 helper 参数默认为 true 它会提取 @babel/runtime 编译过程中一些重复的工具函数变成外部模块引入的方式。

全局引入会污染全局作用域，但是相对于局部引入来说。它会增加很多额外的引入语句，增加包体积。


@babel/runtime 配合 @babel/plugin-transform-runtime 的确可以解决 usage 污染全局作用域的问题，使用它来开发类库看起来非常完美。但是它不适合业务，因为@babel/runtime配合@babel/plugin-transform-runtime不会因为我们的页面的目标浏览器动态调整 polyfill 的内容，而 useBuiltIns 则会根据配置的目标浏览器而决定是否需要引入相应的 polyfill。

在日常业务开发中，对于全局环境污染的问题往往并不是那么重要。而业务代码最终的承载大部分是浏览器端，所以如果针对不同的目标浏览器支持度从而引入相应的 polyfill 无疑会对我们的代码体积产生非常大的影响，此时选择 preset-env 开启 useBuiltIns 的方式会更好一些。
所以简单来讲，我个人强烈推荐在日常业务中尽可能使用 @babel/preset-env 的 useBuiltIns 配置配合需要支持的浏览器兼容性来提供 polyfill 。
同时关于业务项目中究竟应该选择 useBuiltIns 中的 entry 还是 usage ，我在上边已经和大家详细对比过这两种方式。究竟应该如何选择这两种配置方案，在不同的业务场景下希望大家可以根据场景来选择最佳方案。而不是一概的认为 entry 无用无脑使用 usage 。

开发类库在我们开发类库时往往和浏览器环境无关所以在进行 polyfill 时最主要考虑的应该是不污染全局环境，此时选择 @babel/runtime 无疑更加合适。
在类库开发中仅仅开启 @babel/preset-env 的语法转化功能配合 @babel/runtime 提供一种不污染全局环境的 polyfill 可能会更加适合你的项目场景。参考如下代码的配置

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

## 开发babel插件用到的内容

```
@babel/core:上边我们说过babel/core是babel的核心库，核心的api都在这里。比如上边我们讲到的transform，parse方法。


@babel/parser:babel解析器。


@babel/types: 这个模块包含手动构建 AST 和检查 AST 节点类型的方法(比如通过对应的api生成对应的节点)。


@babel/traverse: 这个模块用于对Ast的遍历，它维护了整棵树的状态(需要注意的是traverse对于ast是一种深度遍历)。


@babel/generator: 这个模块用于代码的生成，通过AST生成新的代码返回。

```
[一张图声明babel编译流程](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/787ab733a63c4314b6ce01b3812ba04f~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image?)

## 业务babel的最佳实践

[原文链接](https://juejin.cn/post/7051355444341637128)

我们通过一系列插件在打包过程中通过 Babel 将我们高版本 ECMAScrpit 转换成为兼容性更加良好的低版本语法，从而提供给生产环境使用
```

```
## 基于babel实现tree-shaking
js代码的执行过程，需要经历以下三个步骤:

- V8通过源码进行词法分析，语法分析生成AST和执行上下文。
- 
- 根据AST生成计算机可执行的字节码。
- 
- 执行生成的字节码。

ES Module在js编译阶段就可以确定模块之间的依赖关系(import)以及模块的导出(export)，所以我们并不需要代码执行就可以根据ESM确定模块之间的规则从而实现Tree Shaking，我们称之为静态分析特性

Tree Shaking必须基于Es Module模块

所以如果我们项目中使用到babel-preset-env时需要将它的modules配置为false:相当于告诉babel，"嘿，Babel请保留我代码中的ESM模块规范"。
配置为auto,默认情况下，@babel/preset-env使用caller数据来确定是否import()应转换ES 模块和模块功能（例如）。

关于如何理解这段话，比如: 如果我们使用Babel-Loader调用Babel，那么modules将设置为False，因为WebPack支持es模块。


首先，在老版本的webpack中是不支持将代码编译成为Es module模块的，所有就会导致一些组件库编译后的代码无法使用Tree Shaking进行处理。(因为它编译出来的代码压根就不是ES Module呀！)

所以老版本组件库中，比如element-ui中借用babel-plugin-component，老版本ant-design使用babel-plugin-import进行分析代码从而实现Tree Shaking的效果


为什么要有一个解决基于commonjs规范打包的代码的babel插件实现tree shaking呢

因为项目中的代码可能不是基于es module规范打包的，不能支持tree shaking


```
比如我们以为lodash为例子:
import { cloneDeep } from 'lodash'

// ... 业务代码
复制代码
当你这样使用lodash时，由于打包出来的lodash并不是基于esm模块规范的。所以我们无法达到Tree Shaking的效果。
import cloneDeep from 'lodash/cloneDeep'

// ... 业务代码
复制代码
此时，由于lodash中的cloneDeep方法存在的位置是一个独立的文件--lodash/cloneDeep文件。
当我们这样引入时，相当于仅仅引入了一个js文件而已。就可以显著的减少引入的体积从而删除无用的代码。

// index.js
const core = require('@babel/core');
const babelPluginImport = require('./babel-plugin-import');

const sourceCode = `
  import { Button, Alert } from 'hy-store';
`;

const parseCode = core.transform(sourceCode, {
  plugins: [
    babelPluginImport({
      libraryName: 'hy-store',
    }),
  ],
});

console.log(sourceCode, '输入的Code');
console.log(parseCode.code, '输出的结果');
```

是我们配置文件名称并且没有默认导出AST节点，说明符合我们的按需引入
```
const t = require('@babel/types');

function babelPluginImport(options) {
  const { libraryName = 'hy-store' } = options;
  return {
    visitor: {
      // 匹配ImportDeclaration时进入
      ImportDeclaration(nodePath) {
        // checked Validity
        if (checkedDefaultImport(nodePath) || checkedLibraryName(nodePath)) {
          return;
        }
        const node = nodePath.node;
        // 获取声明说明符
        const { specifiers } = node;
        // 遍历对应的声明符
        const importDeclarations = specifiers.map((specifier, index) => {
          // 获得原本导入的模块
          const moduleName = specifier.imported.name;
          // 获得导入时的重新命名
          const localIdentifier = specifier.local;
          return generateImportStatement(moduleName, localIdentifier);
        });
        if (importDeclarations.length === 1) {
          // 如果仅仅只有一个语句时
          nodePath.replaceWith(importDeclarations[0]);
        } else {
          // 多个声明替换
          nodePath.replaceWithMultiple(importDeclarations);
        }
      },
    },
  };

  // 检查导入是否是固定匹配库
  function checkedLibraryName(nodePath) {
    const { node } = nodePath;
    return node.source.value !== libraryName;
  }

  // 检查语句是否存在默认导入
  function checkedDefaultImport(nodePath) {
    const { node } = nodePath;
    const { specifiers } = node;
    return specifiers.some((specifier) =>
      t.isImportDefaultSpecifier(specifier)
    );
  }

  // 生成导出语句 将每一个引入更换为一个新的单独路径默认导出的语句
  function generateImportStatement(moduleName, localIdentifier) {
    return t.importDeclaration(
      [t.ImportDefaultSpecifier(localIdentifier)],
      t.StringLiteral(`${libraryName}/${moduleName}`)
    );
  }
}

module.exports = babelPluginImport;
```
