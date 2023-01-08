[原文链接](https://juejin.cn/post/7100640780301107231)
# npm
## 包版本介绍
三位数字分别代表的含义

第一位 重大更新 重新设计、功能重构

第二位 次要更新 新增组件、特性升级

第三位 补丁小bug修复、细节优化

## 符号含义

^3.9.2 实际版本3.*.* 向后兼容的新功能、废弃特性暂时保留、特性更新、bug修复

～3.9.2 实际版本3.9.* bug修复

## 执行工程自身 preinstall 钩子
npm 跟 git 一样都有完善的钩子机制散布在 npm 运行的各个阶段，当前 npm 工程如果定义了 preinstall 钩子此时会在执行 npm install 命令之前被执行。

```
// 如何定义钩子：直接在 scripts 中定义即可
// package.json
{
  // ...
	"scripts": {
    "preinstall": "echo \"preinstall hook\"",
    "install": "echo \"install hook\"",
    "postinstall": "echo \"postinstall hook\""
    // ...
  },
  "husky": {
    "hooks": {
      "pre-commit": "",
      "pre-push": "sh ./pre-push.sh"
    }
  },
	// ...
}
```

## 获取 package.json 中依赖数据构建依赖树
首先需要做的是确定工程中的首层依赖，也就是 dependencies 和 devDependencies、peerDependences（当一个依赖项 c 被列在某个包 b 的 peerDependency 中时，它就不会被自动安装。取而代之的是，包含了 b 包的代码库 a 则必须将对应的依赖项 c 包含为其依赖。） 属性中直接指定的模块（假设此时没有添加 npm install的其他参数）。

工程本身是整棵依赖树的根节点，每个首层依赖模块都是根节点下面的一棵子树，npm 会开启多进程从每个首层依赖模块开始逐步寻找更深层级的节点。确定完首层依赖后，就开始获取各个依赖的模块信息，获取模块信息是一个递归的过程，分为以下几步：

* 获取模块信息。在下载一个模块之前，首先要确定其版本，这是因为 package.json 中往往是语义化版本。此时如果版本描述文件（npm-shrinkwrap.json 或 package-lock.json）中有该模块信息直接拿即可，如果没有则从仓库获取。如 packaeg.json 中某个包的版本是 ^1.1.0，npm 就会去仓库中获取符合 1.x.x 形式的最新版本。

* 获取模块实体。上一步会获取到模块的压缩包地址（resolved 字段），npm 会用此地址检查本地缓存，缓存中有就直接拿，如果没有则从仓库下载。

* 查找该模块依赖，如果有依赖则回到第1步，如果没有则停止。

如果项目中存在 npm 的 lock 文件（例如package-lock.json），则不会从头开始构建依赖树，而是对 lock 中依赖树中存储冲突的依赖进行调整即可。

## 依赖树扁平化

上一步获取到的是一棵完整的依赖树，其中可能包含大量重复模块。比如 foo 模块依赖于 loadsh，bar 模块同样依赖于 lodash。在 npm3 以前会严格按照依赖树的结构进行安装，也就是方便在 foo 和 bar 的 node_modules 中各安装一份，因此会造成模块冗余。
​
从 npm3 开始默认加入了一个 dedupe 的过程。它会遍历所有节点，逐个将模块放在根节点下面，也就是 node_modules 的第一层。当发现有重复模块时，则将其丢弃。

[npm3之前](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f6d737a4cbdc4c139f630a4ccc19ba6d~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

[npm3](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/147c0b424f094ee585f87f9bbf5b13be~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

lock 文件中存储的正是这颗被优化后的依赖树。

这里需要对重复模块进行一个定义，它指的是模块名相同且语义化版本兼容。每个语义化版本都对应一段版本允许范围，如果两个模块的版本允许范围存在交集，那么就可以得到一个兼容版本，而不必版本号完全一致，这可以使更多冗余模块在 dedupe 过程中被去掉。

比如 node_modules 下 foo 模块依赖 lodash@^1.0.0，bar 模块依赖 lodash@^1.1.0，则 >=1.1.0 的版本都为兼容版本。
而当 foo 依赖 lodash@^2.0.0，bar 依赖 lodash@^1.1.0，则依据 semver 的规则，二者不存在兼容版本。会将一个版本放在首层依赖中，另一个仍保留在其父项（foo或者bar）的依赖树里。

```
举个栗子🌰，假设一个依赖树原本是这样：
node_modules
|--foo
   |-- lodash@version1
|--bar
   |-- lodash@version2

假设 version1 和 version2 是兼容版本，则经过 dedupe 会成为下面的形式：
node_modules
|--foo
|--bar
|--lodash（保留的版本为兼容版本）

假设 version1 和 version2 为非兼容版本，则后面的版本保留在依赖树中：
node_modules
|--foo
|--lodash@version1
|--bar
   |-- lodash@version2

```
[安装模块流程细节图](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b970ef4c7f4d4fd0b15f16095c98bbac~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

## npm ci

npm ci 命令可以完全安装 lock 文件描述的依赖树来安装依赖，可以用它来避免扁平化造成的 node_modules 结构不确定的问题。
npm ci 和 npm i 不仅仅是是否使用 package-lock.json 的区别，npm ci 会删除 node_modules 中所有的内容并且毫无二心的按照package-lock.json 的结构来安装和保存包，他的目的是为了保证任何情况下产生的node_modules结构都一致的。而 npm i 不会删除 node_modules（如果node_modules已经存在某个包就不会重新下载了）、并且安装过程中可能还会调整并修改 package-lock.json 的内容

## npm有哪些问题
1. **依赖结构不确定**
2. **扁平化导致可以非法访问没有声明过依赖的包（幽灵依赖）**
   “幽灵依赖” 指的是项目代码中使用了一些没有被定义在其 package.json 文件中的包。
   ```
   // package.json
    {
        "name": "demo4",
        "main": "index.js",
        "dependencies": {
        "minimatch": "^3.0.4"
        },
        "devDependencies": {
             "rimraf": "^2.6.2"
        }
    }
    但假设代码是这样：
    // index.js
    var minimatch = require("minimatch")
    var expand = require("brace-expansion");  // ???
    var glob = require("glob")  // ???

    // （更多使用那些库的代码)
   ```
    稍等一下下… 有两个库根本没有被作为依赖定义在 package.json 文件中。那这到底是怎么跑起来的呢？
    原来 brace-expansion 是 minimatch 的依赖，而 glob 是 rimraf 的依赖。在安装的时候，NPM 会打平他们的文件夹到 node_modules 。NodeJS 的 require() 函数能够在依赖目录找到它们，因为 require() 在查找文件夹时 根本不会受 package.json 文件 影响。
    这是很不安全的，当未来 minimatch 中不再依赖 brace-expansion 时将会导致项目报错，因为那时整个项目可能没有如何包依赖了 brace-expansion，也就不会在顶层依赖树中有 brace-expansion，所以项目一定会因为找不到 brace-expansion 这个包而报错。

3. **又慢又大**
   npm 在分析依赖树的时候会先并行发出项目顶级的依赖解析请求，当某一个请求回来时，在去请求起所有的子依赖，直到不存在依赖为止，由于每一个树都需要根节点的依赖解析请求后才能开始解析其子树，如果依赖树深度比较深就会导致等待时间过长。递归的分析依赖树需要非常大量的http请求，这也会导致依赖树构建时间过长。

4. **依然可能存在大量重复包**
   扁平化只能会在首次遇到一个包时才会将其提升到顶部，如果项目中有A、B、C三个包分别依赖了D@1.0.0、D@2.0.0、D@2.0.0，那么可能会产生D@1.0.0被提升，D@2.0.0出现在B、C的node_modelus的情况。


# pnpm 依赖管理
安装任何一个包都会生成在.pnpm下一个软链的形式<package-name>@version/node_modules/<package-name>
.pnpm/express@4.17.1/node_modules/express

将 包本身 和 依赖 放在同一个node_module下面，与原生 Node 完全兼容，又能将 package 与相关的依赖很好地组织到一起，设计十分精妙。

[本地包和全局缓存的关系](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7192edd0d444f5fbdfad5ecff540453~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

现在我们回过头来看，根目录下的 node_modules 下面不再是眼花缭乱的依赖，而是跟 package.json 声明的依赖基本保持一致。即使 pnpm 内部会有一些包会设置依赖提升，会被提升到根目录 node_modules 当中，但整体上，根目录的node_modules比以前还是清晰和规范了许多。
pnpm 使用类似 maven 一样将所有的包都存放在一个 .pnpm 缓存目录中，然后在 node_modules 中创建一个软链接链接到缓存目录中对应的包上，解决了重复依赖的问题。而 .pnpm 中的文件又是通过硬链接来链接到一个全局的包存放地址中，也就是说同一个包的某个版本在你的电脑上只会出现一份代码，无论你有多少个项目使用了多少次这个包。因为每一个项目中的 .pnpm 中都只是通过一个硬链接指向同一份代码。

## 如何做到项目隔离？

因为 .pnpm 中都是通过硬链接来链接到同一份源码文件，当我们在某个项目中修改了这个包的文件时，所有项目中这个包都会被修改，这导致无法做到修改的项目隔离。
好在我们有 webstorm ，webstorm 以及对此作了优化，当你在修改其 node_modules 中的内容时，不会直接修改到这个硬链接到目标文件，而是将目标文件 copy 一份到当前项目下，然后对其进行修改，这样就不会影响到其他项目。很遗憾 vscode 目前好像没有这功能。

## 再谈安全

pnpm 这种依赖管理的方式也很巧妙地规避了 幽灵依赖 的问题，也就是只要一个包未在 package.json 中声明依赖，那么在项目中是无法访问的。但在 npm/yarn 当中是做不到的
npm 也有想过去解决这个问题，指定 --global-style 参数即可禁止扁平化，但这样做相当于回到了当年嵌套依赖的时代，一夜回到解放前，前面提到的嵌套依赖的缺点仍然暴露无遗。
npm/yarn 本身去解决依赖提升的问题貌似很难完成，不过社区针对这个问题也已经有特定的解决方案: dependency-check，地址: github.com/dependency-…
但不可否认的是，pnpm 做的更加彻底，独创的一套依赖管理方式不仅解决了依赖提升的安全问题，还大大优化了时间和空间上的性能。

