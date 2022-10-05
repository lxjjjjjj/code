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

