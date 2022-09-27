# 常见plugin和Preset
所谓Preset就是一些Plugin组成的合集,你可以将Preset理解称为就是一些的Plugin整合称为的一个包。

[原文链接](https://juejin.cn/post/7025237833543581732)
### @babel/preset-env
```
preset-env内部集成了绝大多数plugin（State > 3）的转译插件，它会根据对应的参数进行代码转译。不会包含任何低于 Stage 3 的 JavaScript 语法提案。如果需要兼容低于Stage 3阶段的语法则需要额外引入对应的Plugin进行兼容。babel-preset-env仅仅针对语法阶段的转译，比如转译箭头函数，const/let语法。针对一些Api或者Es 6内置模块的polyfill，preset-env是无法进行转译的。

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
### @babel/plugin-transform-runtime

```
polyfill
```
### @babel/register

```
它会改写require命令，为它加上一个钩子。此后，每当使用require加载.js、.jsx、.es和.es6后缀名的文件，就会先用Babel进行转码。
```
### babel-loader

```
babel-loader的本质就是一个函数，我们匹配到对应的jsx?/tsx?的文件交给babel-loader处理。babel-loader仅仅是识别匹配文件和接受对应参数的函数。
```
### babel-core

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
### polyfill

```
最新ES语法，比如：箭头函数，let/const。
最新ES Api，比如Promise
最新ES实例/静态方法，比如String.prototype.include

babel-prest-env仅仅只会转化最新的es语法，并不会转化对应的Api和实例方法,比如说ES 6中的Array.from静态方法。babel是不会转译这个方法的，如果想在低版本浏览器中识别并且运行Array.from方法达到我们的预期就需要额外引入polyfill进行在Array上添加实现这个方法。
```

```
语法层面的转化preset-env完全可以胜任。但是一些内置方法模块，仅仅通过preset-env的语法转化是无法进行识别转化的
```

babel内置的polyfill包

```
@babel/polyfill

@babel/runtime

@babel/plugin-transform-runtime
```
### @babel/polyfill

```
通过babelPolyfill通过往全局对象上添加属性以及直接修改内置对象的Prototype上添加方法实现polyfill。比如说我们需要支持String.prototype.include，在引入babelPolyfill这个包之后，它会在全局String的原型对象上添加include方法从而支持我们的Js Api。我们说到这种方式本质上是往全局对象/内置对象上挂载属性，所以这种方式难免会造成全局污染。从 Babel 7.4.0 开始，这个包已经被弃用，取而代之的是直接包含core-js/stable（以填充 ECMAScript 特性）
```
应用@babel/polyfill

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

```
// 项目入口文件中需要额外引入polyfill
// core-js 2.0中是使用"@babel/polyfill" core-js3.0版本中变化成为了上边两个包
import "@babel/polyfill"

// babel
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "entry"
        }]
    ]
}

当传入entry时，需要我们在项目入口文件中手动引入一次core-js，它会根据我们配置的浏览器兼容性列表(browserList)然后全量引入不兼容的polyfill
```

```
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "usage",
            "core-js": 3
        }]
    ]
}

当我们配置useBuintIns:usage时，会根据配置的浏览器兼容，以及代码中 使用到的Api 进行引入polyfill按需添加。

它仅仅会为我们引入目标浏览器中不支持并且我们在代码中使用到的内容，会剔除没有使用到的 polyfill 内容
```
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
