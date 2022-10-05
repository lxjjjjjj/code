[plugin机制](https://juejin.cn/post/7046360070677856292)
[plugin](https://juejin.cn/post/7047777251949019173)


本质上在 Webpack 编译阶段会为各个编译对象初始化不同的 Hook ，开发者可以在自己编写的 Plugin 中监听到这些 Hook ，在打包的某个特定时间段触发对应 Hook 注入特定的逻辑从而实现自己的行为。Webpack Plugin 的核心机制就是基于 tapable 产生的发布订阅者模式，在不同的周期触发不同的 Hook 从而影响最终的打包结果。

# Plugin 中的常用对象
首先让我们先来看看 Webpack 中哪些对象可以注册 Hook :
compiler Hook
compilation Hook
ContextModuleFactory Hook
JavascriptParser Hooks
NormalModuleFactory Hooks

# 插件的基本构成
我们先来看这样一个最简单的插件，它会在 compilation（编译）完成时执行输出 done :
```
class DonePlugin {
  apply(compiler) {
    // 调用 Compiler Hook 注册额外逻辑
    compiler.hooks.done.tap('Plugin Done', () => {
      console.log('compilation done');
    });
  }
}

module.exports = DonePlugin;
```
我们可以看到一个 Webpack Plugin 主要由以下几个方面组成:

* 首先一个 Plugin 应该是一个 class，当然也可以是一个函数。
* 其次 Plugin 的原型对象上应该存在一个 apply 方法，当 webpack 创建 compiler 对象时会调用各个插件实例上的 apply 方法并且传入 compiler 对象作为参数。
* 同时需要指定一个绑定在 compiler 对象上的 Hook ， 比如 compiler.hooks.done.tap 在传入的 compiler 对象上监听 done 事件。
* 在 Hook 的回调中处理插件自身的逻辑，这里我们简单的做了 console.log。
* 根据 Hook 的种类，在完成逻辑后通知 webpack 继续进行。

# 插件的构建对象

## compiler 对象
compiler 在 Webpack 启动打包时创建，保存着本次打包的所有初始化配置信息。在每一次进行打包过程中它会创建 compilation 对象进行模块打包。关于如何理解每一次比方说我们在 watch (devServer) 模式中，每当文件内容发生变化时都会产生一个 compilation 对象进行打包，而 compiler 对象永远只有一个，除非你终止打包命令重新调用 webpack 。

在 compiler 对象中保存着完整的 Webpack 环境配置，它通过 CLI 或 者 Node API传递的所有选项创建出一个 compilation 实例。这个对象会在首次启动 Webpack 时创建，我们可以通过 compiler 对象上访问到 Webapck 的主环境配置，比如 loader 、 plugin 等等配置信息。compiler 你可以认为它是一个单例，每次启动 webpack 构建时它都是一个独一无二，仅仅会创建一次的对象。

### 关于 compiler 对象存在以下几个主要属性：

通过 compiler.options , 我们可以访问编译过程中 webpack 的完整配置信息。在 compiler.options 对象中存储着本次启动 webpack 时候所有的配置文件，包括但不限于 loaders 、 entry 、 output 、 plugin 等等完整配置信息。
#### inputFileSystem/outputFileSystem
通过 compiler.inputFileSystem（获取文件相关 API 对象）、outputFileSystem（输出文件相关 API 对象） 可以帮助我们实现文件操作，你可以将它简单的理解为 Node Api 中的 fs 模块的拓展。**如果我们希望自定义插件的一些输入输出行为能够跟 webpack 尽量同步，那么最好使用 compiler 提供的这两个变量。**需要额外注意的是当 compiler 对象运行在 watch 模式通常是 devServer 下，outputFileSystem 会被重写成内存输出对象，换句话来说也就是在 watch 模式下 webpack 构建并非生成真正的文件而是保存在了内存中。如果你的插件对于文件操作存在对应的逻辑，那么接下里请使用 compiler.inputFileSystem/outputFileSystem 更换掉代码中的 fs 吧。

#### hooks
同时 compiler.hooks 中也保存了扩展了来自 tapable 的不同种类 Hook ，监听这些 Hook 从而可以在 compiler 生命周期中植入不同的逻辑。

#### 备注
关于 compiler 对象的属性你可以在 webpack/lib/Compiler.js中进行查看所有属性。

## compilation 对象
```
class DonePlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(
      'Plugin Done',
      (compilation, callback) => {
        console.log(compilation, 'compilation 对象');
      }
    );
  }
}

module.exports = DonePlugin;
```
所谓 compilation 对象代表一次资源的构建，compilation 实例能够访问所有的模块和它们的依赖。一个 compilation 对象会对构建依赖图中所有模块，进行编译。 在编译阶段，模块会被加载(load)、封存(seal)、优化(optimize)、 分块(chunk)、哈希(hash)和重新创建(restore)。在 compilation 对象中我们可以获取/操作本次编译当前模块资源、编译生成资源、变化的文件以及被跟踪的状态信息，同样 compilation 也基于 tapable 拓展了不同时机的 Hook 回调。简单来说比如在 devServer 下每次修改代码都会进行重新编译，此时你可以理解为每次构建都会创建一个新的 compilation 对象。

### 关于 compilation 对象存在以下几个主要属性：

#### modules

它的值是一个 Set 类型，关于 modules 。简单来说你可以认为一个文件就是一个模块，无论你使用 ESM 还是 Commonjs 编写你的文件。每一个文件都可以被理解成为一个独立的 module。

#### chunks
所谓 chunk 即是多个 modules 组成而来的一个代码块，当 Webapck 进行打包时会首先根据项目入口文件分析对应的依赖关系，将入口依赖的多个 modules 组合成为一个大的对象，这个对象即可被称为 chunk 。所谓 chunks 当然是多个 chunk 组成的一个 Set 对象。

#### assets
assets 对象上记录了本次打包生成所有文件的结果。
#### hooks
同样在 compilation 对象中基于 tapable 提供给一系列的 Hook ，用于在 compilation 编译模块阶段进行逻辑添加以及修改。

在 Webpack 5 之后提供了一系列 compilation API 替代直接操作 moduels/chunks/assets 等属性，从而提供给开发者来操作对应 API 影响打包结果。具体你可以在[这里查看到](https://webpack.js.org/api/compilation-object/)，比如一些常见的输出文件工作，现在使用 compilation.emitAsset API 来替代直接操作 compilation.assets 对象。


## ContextModuleFactory Hook
```
class DonePlugin {
  apply(compiler) {
    compiler.hooks.contextModuleFactory.tap(
      'Plugin',
      (contextModuleFactory) => {
        // 在 require.context 解析请求的目录之前调用该 Hook
        // 参数为需要解析的 Context 目录对象
        contextModuleFactory.hooks.beforeResolve.tapAsync(
          'Plugin',
          (data, callback) => {
            console.log(data, 'data');
            callback();
          }
        );
      }
    );
  }
}

module.exports = DonePlugin;
```
compiler.hooks 对象上同样存在一个 contextModuleFactory ,它同样是基于 tapable 进行衍生了一些列的 hook 。contextModuleFactory 提供了一些列的 hook ,正如其名称那样它主要用来使用 Webpack 独有 API require.context 解析文件目录时候进行处理。比如在文件打包中使用require.context会触发此hook

## NormalModuleFactory Hook
```
class DonePlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap(
      'MyPlugin',
      (NormalModuleFactory) => {
        NormalModuleFactory.hooks.beforeResolve.tap(
          'MyPlugin',
          (resolveData) => {
            console.log(resolveData, 'resolveData');
            // 仅仅解析目录为./src/index.js 忽略其他引入的模块
            return resolveData.request === './src/index.js';
          }
        );
      }
    );
  }
}

module.exports = DonePlugin;
```
Webpack compiler 对象中通过 NormalModuleFactory 模块生成各类模块。换句话来说，从入口文件开始，NormalModuleFactory 会分解每个模块请求，解析文件内容以查找进一步的请求，然后通过分解所有请求以及解析新的文件来爬取全部文件。在最后阶段，每个依赖项都会成为一个模块实例。我们可以通过 NormalModuleFactory Hook 来注入 Plugin 逻辑从而控制 Webpack 中对于默认模块引用时的处理，比如 ESM、CJS 等模块引入前后时注入对应逻辑。关于 NormalModuleFactory Hook 可以用于在 Plugin 中处理 Webpack 解析模块时注入特定的逻辑从而影影响打包时的模块引入内容，具体 Hook 种类你可以在[这里查看](https://webpack.js.org/api/contextmodulefactory-hooks/)。

## JavascriptParser Hook

```
const t = require('@babel/types');
const g = require('@babel/generator').default;
const ConstDependency = require('webpack/lib/dependencies/ConstDependency');

class DonePlugin {
  apply(compiler) {
    // 解析模块时进入
    compiler.hooks.normalModuleFactory.tap('pluginA', (factory) => {
      // 当使用javascript/auto处理模块时会调用该hook
      const hook = factory.hooks.parser.for('javascript/auto');

      // 注册
      hook.tap('pluginA', (parser) => {
        parser.hooks.statementIf.tap('pluginA', (statementNode) => {
          const { code } = g(t.booleanLiteral(false));
          const dep = new ConstDependency(code, statementNode.test.range);
          dep.loc = statementNode.loc;
          parser.state.current.addDependency(dep);
          return statementNode;
        });
      });
    });
  }
}

module.exports = DonePlugin;
```
上边我们提到了 compiler.normalModuleFactory 钩子用于 Webpack 对于解析模块时候触发，而 JavascriptParser Hook 正是基于模块解析生成 AST 节点时注入的 Hook 。
webpack使用 Parser 对每个模块进行解析，我们可以在 Plugin 中注册 JavascriptParser Hook 在 Webpack 对于模块解析生成 AST 节点时添加额外的逻辑。
上述的 DonePlugin 会将模块中所有的 statementIf 节点的判断表达式修改称为 false 。

## NormalModuleFactory 与 JavaScriptParser
```
// index.js 入口文件
import module1 from './module1'
import module2 from './module2'
```
首先 webpack 会进入入口文件，在此时首先会涉及到 NormalModuleFactory hook 上注册的相关 hook ，它是针对于模块资源请求的处理 hook 。
只有在进入入口文件后，通过 NormalModuleFactory hook 该依赖文件需要进行编译时，才会进入 JavascriptParser Hooks 通过 AST 来分析模块内容。
如果在 NormalModuleFactory hook 开头判断该模块不需要编译那么自然也不会进入依赖模块的 parser 阶段。
以上方的为例：
在运行编译命令时首先分析入口文件 index.js 模块请求，调用 NormalModuleFactory Hook 部分钩子。
之后会编译 index.js 文件（它也是一个 module ），会进行 AST 分析此时就是 Parser 实例对象的作用，接下来分析该模块（index.js）时会触发一系列 JavascriptParser Hooks 。
# 开发自己的插件

## CompressAssetsPlugin

需求: 众所周知在使用 Webpack 打包项目时，通常我们会将所有资源打包在 dist 文件目录内，分别存放对应的 html、css 以及 js 文件。此时，假使我需要在每次打包结束后将本次打包生成出的所有资源打包成为一个 zip 包。
```
const path = require('path');
const CompressAssetsPlugin = require('./plugins/CompressAssetsPlugin');

module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, './src/entry1.js'),
  },
  devtool: false,
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
  },
  plugins: [
    new CompressAssetsPlugin({
      output: 'result.zip',
    }),
  ],
};
```
CompressAssetsPlugin
```
const JSZip = require('jszip');
const { RawSource } = require('webpack-sources');
/* 
  将本次打包的资源都打包成为一个压缩包
  需求:获取所有打包后的资源
*/
 
const pluginName = 'CompressAssetsPlugin';

class CompressAssetsPlugin {
  constructor({ output }) {
    this.output = output;
  }

  apply(compiler) {
    // AsyncSeriesHook 将 assets 输出到 output 目录之前调用该钩子
    compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
      // 创建zip对象
      const zip = new JSZip();
      // 获取本次打包生成所有的assets资源
      const assets = compilation.getAssets();
      // 循环每一个资源
      assets.forEach(({ name, source }) => {
        // 调用source()方法获得对应的源代码 这是一个源代码的字符串
        const sourceCode = source.source(); // 的到string/buffer
        // 往 zip 对象中添加资源名称和源代码内容
        zip.file(name, sourceCode);
      });
      // 调用 zip.generateAsync 生成 zip 压缩包
      zip.generateAsync({ type: 'nodebuffer' }).then((result) => {
        // 通过 new RawSource 创建压缩包 这个库是一个 webpack 内置库，它的内部包含了 Source 等一系列基于 Source 的子类对象。
        // 并且同时通过 compilation.emitAsset 方法将生成的 Zip 压缩包输出到 this.output
        compilation.emitAsset(this.output, new RawSource(result));
        // 调用 callback 表示本次事件函数结束
        callback();
      });
    });
  }
}

module.exports = CompressAssetsPlugin;
```

## ExternalWebpackPlugin

### 存在的问题
Webpack 中存在一个 externals 的配置选项，所谓 externals 即是说「从输出的 bundle 中排除依赖」。比如使用上方的配置 Webpack 在进行模块编译时如果发现依赖模块 jqery 时，此时并不会将 jquery 打包进入模块依赖中，而是当作外部模块依赖使用全局对象上的 jQuery 赋值给 jquery 模块。
```
比如使用上方配置文件，代码中存在这样的模块依赖：
import $ from 'jquery'

当 Webpack 碰到 jquery 的模块引入时，并不会将 jquery 这个模块依赖代码打包进入业务代码，而是会根据 externals 配置将 jquery 作为外部模块去名为 jQuery 的变量上去寻找。

针对于 jquery 模块 Webpack 将它处理成为了 module.exports = jQuery。
```
源生 externals 配置方式
通常如果在业务代码中，如果我们需要将某些内部依赖模块不进行打包而是使用 externals 形式作为 CDN 进行引入，我们需要经历一下二个步骤：1、webpack 配置中进行 externals 配置。比如我们代码中如果使用到了 Vue 和 lodash 这两个库，此时我们并不想在业务代码中打包这两个库而是希望通过 CDN 的形式在生成的 html 文件中引入，2、生成的 html 文件中注入 externals 中的 CDN 配置外部链接。需要这样做:
```
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, './src/entry1.js'),
  },
  devtool: false,
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
  },
  externals: {
    vue: 'Vue',
    lodash: '_',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: '../public/index.html',
    }),
  ],
}
我们在 webpack.config.js 中配置了 externals 选项告诉 webpack 在打包时如果遇到引入 vue 或者 lodash 模块时不需要将这两个模块的内容打包到最终输出的代码中。
而在在将全局环境下的 Vue 变量赋值给 vue 模块，将 _ 赋值给 lodash 模块。

```
此时我们已经完成了 externals 的配置，但这还远远不够。因为此时我们打包编译后的代码中并不存在 Vue 和 _ 这两个全局变量，我们需要在最终生成的 html 文件中添加这两个模块对应的 CDN 链接。上边的配置中我们使用了 HtmlWebpackPlugin 指定了生成的 html 文件的模板，接下来让我们来看看这个 html 文件 public/index.html：

```

<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Webpack App</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- 手动引入对应的模块CDN -->
  <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>
</head>

<body>
</body>

</html>
```
上述步骤存在的问题：
```
1.首先，配置步骤在我看来应该尽量的简单化。我们使用需要将依赖模块转变为 CDN 形式的话每次都要在 externals 和生成的 html 文件中进行同步修改，这无疑增加了步骤的繁琐。
2.可能会存在 CDN 冗余加载的问题。可能我并没有使用 lodash 但是并没法保证该项目内其他开发者有没有使用 lodash，但是我们在 html 中仍然冗余的引入了它的 CDN 
```
### 配置文件的书写格式
```
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExternalsWebpackPlugin = require('./plugins/externals-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: path.resolve(__dirname, './src/entry1.js'),
  },
  devtool: false,
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].js',
  },
  externals: {
    vue: 'Vue',
    lodash: '_',
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new ExternalsWebpackPlugin({
      lodash: {
        // cdn链接
        src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
        // 替代模块变量名
        variableName: '_',
      },
      vue: {
        src: 'https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js',
        variableName: 'vue',
      },
    }),
  ],
};
```
### 原理梳理
1、我们需要通过 NormalModuleFactory Hook 注册事件函数，当 webpack 处理模块内部的依赖模块引入时会触发对应的 hook 从而判断：如果即将引入的模块匹配插件传入需要作为外部依赖模块的话，那么此时就不行编译直接当作外部模块处理。
2、这里插件内部会使用 JavaScriptParser Hook 分析引入模块的依赖模块引入语句，在生成 AST 时进行判断，保存使用到的外部依赖模块。
3、HtmlWebpackPlugin 通过 HtmlWebpackPlugin.getHooks(compilation) 方法拓展了一些列 hook 方便别的插件开发者在生成 html 文件中注入逻辑
### 代码
```
const HtmlWebpackPlugin = require('html-webpack-plugin');
const pluginName = 'ExternalsWebpackPlugin'

class ExternalsWebpackPlugin {
  constructor(options) {
    // 保存参数
    this.options = options
    // 保存参数传入的所有需要转化CDN外部externals的库名称
    this.transformLibrary = Object.keys(options)
    // 分析依赖引入 保存代码中使用到需要转化为外部CDN的库
    this.usedLibrary = new Set()
    
  }

  apply() {
    // normalModuleFactory 创建后会触发该事件监听函数
    compiler.hooks.normalModuleFactory.tap(
      pluginName,
      (normalModuleFactory) => {
        // 在初始化解析模块之前调用
        normalModuleFactory.hooks.factorize.tapAsync(
          pluginName,
          (resolveData, callback) => {
            // 获取引入的模块名称
            const requireModuleName = resolveData.request;
            if (this.transformLibrary.includes(requireModuleName)) {
              // 如果当前模块需要被处理为外部依赖
              // 首先获得当前模块需要转位成为的变量名
              const externalModuleName =
                this.options[requireModuleName].variableName;
              callback(
                null,
                new ExternalModule(
                  externalModuleName,
                  'window',
                  externalModuleName
                )
              );
            } else {
              // 正常编译 不需要处理为外部依赖 什么都不做
              callback();
            }
          }
        );
      }
    );
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // 获取HTMLWebpackPlugin拓展的compilation Hooks
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap(
        pluginName,
        (data) => {
          // 额外添加scripts
          const scriptTag = data.assetTags.scripts
          this.usedLibrary.forEach((library) => {
            scriptTag.unshift({
              tagName: 'script',
              voidTag: false,
              meta: { plugin: pluginName },
              attributes: {
                defer: true,
                type: undefined,
                src: this.options[library].src,
              },
            });
          });
        }
      );
    });
    // ...
  }
}

module.exports = ExternalsWebpackPlugin;

```