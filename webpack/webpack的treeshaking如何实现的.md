# 在 Webpack4 中，启动 Tree Shaking 功能必须同时满足三个条件

使用 ESM 规范编写模块代码
配置 optimization.usedExports 为 true，启动标记功能
启动代码优化功能，可以通过如下方式实现：

webpack4需要配置 
配置 mode = production
配置 optimization.minimize = true
提供 optimization.minimizer 数组

// Base Webpack Config for Tree Shaking
const config = {
 mode: 'production',
 optimization: {
  usedExports: true,
  minimizer: [
   new TerserPlugin({...})
  ]
 }
};

# webpack5 的配置
webpack5自带tree-shaking功能 无需下面的配置 但是 optimization.usedExports 还是要改成 true

1. 开发环境下的配置
// webpack.config.js
module.exports = {
  // ...
  mode: 'development',
  optimization: {
    usedExports: true,
  }
};

2. 生产环境下的配置
// webpack.config.js
module.exports = {
  // ...
  mode: 'production',
};

## 如何避免css样式的tree-shaking
```
// main.js
import "./styles/reset.css"
```
这样的代码，在打包后，打开页面，你就会发现样式并没有应用上，原因在于：上面我们将 sideEffects 设置为 false 后，所有的文件都会被 Tree Shaking，通过 import 这样的形式引入的 CSS 就会被当作无用代码处理掉。
为了解决这个问题，可以在 loader 的规则配置中，添加 sideEffects: true ，告诉 Webpack 这些文件不要 Tree Shaking。
```
// webpack.config.js
module.exports = {
  // ...
    module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
        sideEffects: true
      }
    ]
  },
};
```
## sideEffects
告知 webpack 要不要去识别该项目代码中是否有副作用，从而为Tree-shaking提供更大的压缩空间。
开启了 optimization.sideEffects 配置后，webpack在打包时就会先检查需要打包的项目的 package.json 中有没有sideEffects的标识，以此来判断这个模块是不是有副作用。如果这个模块没有副作用，这些没被用到的代码就会被删除。（这个特性在production模式下会自动开启）

例如：在package.json中配置以下"sideEffects":false 表示整个项目没有副作用，那项目实际出现的一些未使用代码，webpack就会删除代码。

如果您的代码确实有一些副作用，则可以提供一个数组：

{
  "name": "your-project",
  "sideEffects": ["./src/some-side-effectful-file.js"]
}

该数组接受相关文件的简单 glob 模式。它在底层使用glob-to-regexp（支持：*、、、、**）。不包含 a 的模式 like将被视为 like 。{a,b}[a-z]*.css/**/*.css

请注意，任何导入的文件都会受到 tree shaking 的影响。这意味着如果你在你的项目中使用类似的东西css-loader并导入一个 CSS 文件，它需要被添加到副作用列表中，这样它就不会在生产模式下被无意中删除：

{
  "name": "your-project",
  "sideEffects": ["./src/some-side-effectful-file.js", "*.css"]
}
最后，"sideEffects"也可以从module.rules配置选项中设置。

**澄清tree shaking和sideEffects**

sideEffects和（更广为人知的 usedExports 是 tree shaking）优化是两个不同的东西。

sideEffects更有效，因为它允许跳过整个模块/文件和完整的子树。

usedExports依赖简洁来检测语句中的副作用。这在 JavaScript 中是一项艰巨的任务，并且不如简单的sideEffects标志有效。它也不能跳过子树/依赖项，因为规范说需要评估副作用。虽然导出函数工作正常，但 React 的高阶组件 (HOC) 在这方面存在问题。比如var Button$1 = withAppProvider()(Button);如果Button$1没有被用，是否可以删除withAppProvider和Button的代码。Terser并不会删除这段代码，因为withAppProvider也用了 Button也用了。可以改成var Button$1 = /*#__PURE__*/ withAppProvider()(Button);这样。为了解决这个问题，我们使用"sideEffects".package.json
它类似于/*#__PURE__*/但在模块级别而不是语句级别。它说（"sideEffects"属性）：“如果没有使用标记有 no-sideEffects 的模块的直接导出，则捆绑器可以跳过评估模块的副作用。”。

/*#__PURE__*/通过使用注解可以告诉 webpack 一个函数调用是无副作用的（纯的） 。它可以放在函数调用的前面，以将它们标记为无副作用。传递给函数的参数没有被注释标记，可能需要单独标记。当未使用变量的变量声明中的初始值被视为无副作用（纯）时，它会被标记为死代码，不会被最小化器执行和删除。optimization.innerGraph设置为时启用此行为true。

[webpack官网介绍](https://webpack.js.org/guides/tree-shaking/)
# 理论基础

在 CommonJs、AMD、CMD 等旧版本的 JavaScript 模块化方案中，导入导出行为是高度动态，难以预测的，例如：
```
if(process.env.NODE_ENV === 'development'){
  require('./bar');
  exports.foo = 'foo';
}
```
而 ESM 方案则从规范层面规避这一行为，它要求所有的导入导出语句只能出现在模块顶层，且导入导出的模块名必须为字符串常量，这意味着下述代码在 ESM 方案下是非法的：
```
if(process.env.NODE_ENV === 'development'){
  import bar from 'bar';
  export const foo = 'foo';
}
```
所以，ESM 下模块之间的依赖关系是高度确定的，与运行状态无关，编译工具只需要对 ESM 模块做静态分析，就可以从代码字面量中推断出哪些模块值未曾被其它模块使用，这是实现 Tree Shaking 技术的必要条件。\

# 总结过程
[原文链接](https://juejin.cn/post/7002410645316436004)

综上所述，Webpack 中 Tree Shaking 的实现分为如下步骤：

1.收集导出阶段，在 FlagDependencyExportsPlugin 插件中根据模块的 dependencies 列表收集模块导出值，并记录到 ModuleGraph 体系的 exportsInfo 中

2.标记阶段，在 FlagDependencyUsagePlugin 插件中收集模块的导出值的使用情况，并记录到 exportInfo._usedInRuntime 集合中

3.在 HarmonyExportXXXDependency.Template.apply 方法中根据导出值的使用情况生成不同的导出语句，用到的变量包裹在webpack_require_.xx方法中，没有用到的变量只是单纯的写入这个变量。

4.模块导出列表中未被使用的值都不会定义在 __webpack_exports__ 对象中，形成一段不可能被执行的 Dead Code 效果，利用插件Terser、UglifyJS完成删除代码。

[标记图片示例](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64044294f29e449e9c6016e724a93fdd~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)
# 实现原理
Webpack 中，Tree-shaking 的实现一是先标记出模块导出值中哪些没有被用过，二是使用 Terser 删掉这些没被用到的导出语句。标记过程大致可划分为三个步骤：

1.Make 阶段，收集模块导出变量并记录到模块依赖关系图 ModuleGraph 变量中

2.Seal 阶段，遍历 ModuleGraph 标记模块导出变量有没有被使用  
  标记功能需要配置 optimization.usedExports = true 开启，如果被标记了的话，会在模块导出时标注/* unused harmony export foo*/。

3.生成产物时，若变量没有被其它模块使用则删除对应的导出语句

标记阶段，foo 变量对应的代码 const foo='foo' 都还保留完整，这是因为标记功能只会影响到模块的导出语句，真正执行“Shaking”操作的是 Terser 插件。例如在上例中 foo 变量经过标记后，已经变成一段 Dead Code —— 不可能被执行到的代码，这个时候只需要用 Terser 提供的 DCE 功能就可以删除这一段定义语句，以此实现完整的 Tree Shaking 效果。

[标记图片示例](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/64044294f29e449e9c6016e724a93fdd~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

## 收集模块导出 --- make阶段
[dependencies深度解析](https://mp.weixin.qq.com/s/kr73Epnn6wAx9DH7KRVUaA)

make 阶段将模块的所有 ESM 导出语句转换为 Dependency 对象，并记录到 module 对象的 dependencies 集合，转换规则：

* 具名导出转换为 HarmonyExportSpecifierDependency 对象
* default 导出转换为 HarmonyExportExpressionDependency 对象

```
export const bar = 'bar'; // HarmonyExportSpecifierDependency
export const foo = 'foo'; // HarmonyExportSpecifierDependency

export default 'foo-bar' // HarmonyExportExpressionDependency
```

2.所有模块都编译完毕后，触发 compilation.hooks.finishModules 钩子，开始执行 FlagDependencyExportsPlugin 插件回调
3.FlagDependencyExportsPlugin 插件从 entry 开始读取 ModuleGraph 中存储的模块信息，遍历所有 module 对象
4.遍历 module 对象的 dependencies 数组，找到所有 HarmonyExportXXXDependency 类型的依赖对象，将其转换为 ExportInfo 对象并记录到 ModuleGraph 体系中
5.经过 FlagDependencyExportsPlugin 插件处理后，所有 ESM 风格的 export 语句都会记录在 ModuleGraph 体系内，后续操作就可以从 ModuleGraph 中直接读取出模块的导出值。

## 标记模块导出 --- Seal 阶段

模块导出信息收集完毕后，Webpack 需要标记出各个模块的导出列表中，哪些导出值有被其它模块用到，哪些没有，这一过程发生在 Seal 阶段，主流程：

1.触发 compilation.hooks.optimizeDependencies 钩子，开始执行 FlagDependencyUsagePlugin 插件逻辑
2.在 FlagDependencyUsagePlugin 插件中，从 entry 开始逐步遍历 ModuleGraph 存储的所有 module 对象
3.遍历 module 对象对应的 exportInfo 数组
4.为每一个 exportInfo 对象执行 compilation.getDependencyReferencedExports 方法，确定其对应的 dependency 对象有否被其它模块使用
5.被任意模块使用到的导出值，调用 exportInfo.setUsedConditionally 方法将其标记为已被使用。
6.exportInfo.setUsedConditionally 内部修改 exportInfo._usedInRuntime 属性，记录该导出被如何使用

标记模块导出这一操作集中在 FlagDependencyUsagePlugin 插件中，执行结果最终会记录在模块导出语句对应的 exportInfo._usedInRuntime 字典中。

## 生成代码

经过前面的收集与标记步骤后，Webpack 已经在 ModuleGraph 体系中清楚地记录了每个模块都导出了哪些值，每个导出值又没那块模块所使用。接下来，Webpack 会根据导出值的使用情况生成不同的代码。

[生成文件结果图片](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00abb839325744fbb1fc3c85e3008528~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

例如：重点关注 bar.js 文件，同样是导出值，bar 被 index.js 模块使用因此对应生成了 __webpack_require__.d 调用 "bar": ()=>(/* binding */ bar)，作为对比 foo 则仅仅保留了定义语句，没有在 chunk 中生成对应的 export。

关于 Webpack 产物的内容及 __webpack_require__.d 方法的含义，可参考 Webpack 原理系列六： [彻底理解 Webpack 运行时](https://mp.weixin.qq.com/s/nkBvbwpzeb0fzG02HXta8A) 一文。

这一段生成逻辑均由导出语句对应的 HarmonyExportXXXDependency 类实现，大体的流程：

1.打包阶段，调用 HarmonyExportXXXDependency.Template.apply 方法生成代码
2.在 apply 方法内，读取 ModuleGraph 中存储的 exportsInfo 信息，判断哪些导出值被使用，哪些未被使用
3.对已经被使用及未被使用的导出值，分别创建对应的 HarmonyExportInitFragment 对象，保存到 initFragments 数组
遍历 initFragments 数组，生成最终结果

基本上，这一步的逻辑就是用前面收集好的 exportsInfo 对象未模块的导出值分别生成导出语句。

## 删除 Dead Code
经过前面几步操作之后，模块导出列表中未被使用的值都不会定义在 __webpack_exports__ 对象中，形成一段不可能被执行的 Dead Code 效果，如上例中的 foo 变量：在此之后，将由 Terser、UglifyJS 等 DCE 工具“摇”掉这部分无效代码，构成完整的 Tree Shaking 操作。

# 最佳实践

## 避免无意义的赋值
```
import { bar, foo } from './bar'
console.log(bar)
const f = foo
```
index.js 模块引用了 bar.js 模块的 foo 并赋值给 f 变量，但后续并没有继续用到 foo 或 f 变量，这种场景下 bar.js 模块导出的 foo 值实际上并没有被使用，理应被删除，但 Webpack 的 Tree Shaking 操作并没有生效，产物中依然保留 foo 导出。造成这一结果，浅层原因是 Webpack 的 Tree Shaking 逻辑停留在代码静态分析层面，只是浅显地判断：

1.模块导出变量是否被其它模块引用
2.引用模块的主体代码中有没有出现这个变量

没有进一步，从语义上分析模块导出值是不是真的被有效使用。更深层次的原因则是 JavaScript 的赋值语句并不纯，视具体场景有可能产生意料之外的副作用。

```
import { bar, foo } from "./bar";
let count = 0;
const mock = {}
Object.defineProperty(mock, 'f', {
    set(v) {
        mock._f = v;
        count += 1;
    }
})
mock.f = foo;
console.log(count);
```
在使用 Webpack 时开发者需要有意识地规避这些无意义的重复赋值操作。

## 使用 #pure 标注纯函数调用
与赋值语句类似，JavaScript 中的函数调用语句也可能产生副作用，因此默认情况下 Webpack 并不会对函数调用做 Tree Shaking 操作。不过，开发者可以在调用语句前添加 /*#__PURE__*/ 备注，明确告诉 Webpack 该次函数调用并不会对上下文环境产生副作用。
```
export const bar = 'bar'
const foo = (arg) => {
    console.log(bar + arg)
}
foo('be retained')
/* #__PURE__*/foo('be removed')
```
[图片链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/29307b1a9eef4b1096aed2c82d103af5~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)
示例中，foo('be retained') 调用没有带上 /*#__PURE__*/ 备注，代码被保留；作为对比，foo('be removed') 带上 Pure 声明后则被 Tree Shaking 删除。

## 禁止 Babel 转译模块导入导出语句
Babel 是一个非常流行的 JavaScript 代码转换器，它能够将高版本的 JS 代码等价转译为兼容性更佳的低版本代码，使得前端开发者能够使用最新的语言特性开发出兼容旧版本浏览器的代码。
但 Babel 提供的部分功能特性会致使 Tree Shaking 功能失效，例如 Babel 可以将 import/export 风格的 ESM 语句等价转译为 CommonJS 风格的模块化语句，但该功能却导致 Webpack 无法对转译后的模块导入导出内容做静态分析，示例：
[图解示例](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c334cc157ece44aa80ad32983830e0cb~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

示例使用 babel-loader 处理 *.js 文件，并设置 Babel 配置项 modules = 'commonjs'，将模块化方案从 ESM 转译到 CommonJS，导致转译代码(右图上一)没有正确标记出未被使用的导出值 foo。作为对比，右图 2 为 modules = false 时打包的结果，此时 foo 变量被正确标记为 Dead Code。所以，在 Webpack 中使用 babel-loader 时，建议将 babel-preset-env 的 moduels 配置项设置为 false，关闭模块导入导出语句的转译。

## 优化导出值的粒度
Tree Shaking 逻辑作用在 ESM 的 export 语句上，因此对于下面这种导出场景：
```
export default {
    bar: 'bar',
    foo: 'foo'
}
```
即使实际上只用到 default 导出值的其中一个属性，整个 default 对象依然会被完整保留。所以实际开发中，应该尽量保持导出值颗粒度和原子性，上例代码的优化版本：
```
const bar = 'bar'
const foo = 'foo'

export {
    bar,
    foo
}
```
## 使用支持 Tree Shaking 的包
如果可以的话，应尽量使用支持 Tree Shaking 的 npm 包，例如：使用 lodash-es 替代 lodash ，或者使用 babel-plugin-lodash 实现类似效果。不过，并不是所有 npm 包都存在 Tree Shaking 的空间，诸如 React、Vue2 一类的框架原本已经对生产版本做了足够极致的优化，此时业务代码需要整个代码包提供的完整功能，基本上不太需要进行 Tree Shaking。







