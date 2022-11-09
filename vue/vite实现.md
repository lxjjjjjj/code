[原文链接](https://juejin.cn/post/7161672525666058276)
# vite 优点
极速的服务启动，使用原生的 ESM 文件，无需打包。
轻量快速的热重载，无论应用程序大小如何，都始终极快的模块热替换（HMR）。
丰富的功能，对 TypeScript、JSX、CSS 等支持开箱即用。
优化构建，可选 “多页应用” 或 “库” 模式的预配置 Rollup 构建
通用的插件， 在开发和构建之间共享 Rollup-superset 插件接口。
完全类型化的API，灵活的 API 和完整的 TypeScript 类型。

Vite，基于浏览器原生 ES imports 的开发服务器。利用浏览器去解析 imports，在服务器端按需编译返回，完全跳过了打包这个概念，服务器随起随用。同时不仅有 Vue 文件支持，还搞定了热更新，而且热更新的速度不会随着模块增多而变慢。

# Vite 总结一下，最大的特点就是：

* 基础 ESM，实现快速启动和模块热更新。
* 在服务端实现按需编译。
* vite依赖预构建

开发者在代码中写到的 ESM 导入语法会直接发送给服务器，而服务器也直接将 ESM 模块内容运行处理后，下发给浏览器。接着，现代浏览器通过解析 script module，对每一个 import 到的模块进行 HTTP 请求，服务器继续对这些 HTTP 请求进行处理并响应。

## vite依赖预构建
[原文链接](https://juejin.cn/post/7158393635828924429)
介绍: 我们知道vite之所以能够做到毫秒级热更新、快速冷启动、按需编译、无需等待编译执行完成才能启动项目，一方面归功于浏览器对于模块化的支持，可以通过<script type="module"></script>支持模块化的导入。而另一方面的自然归功于对于第三方模块的依赖预构建。
功能: 为什么vite需要依赖预构建呢？ 它的主要功能有两个。

我们知道浏览器支持的模块化，只支持ESModule、对于CJS规范是不支持的，但是某些第三方库发布采用的可能是UMD、CJS。这样将会造成浏览器无法识别，所以预构建的第一个作用就是转化非ESM规范的第三方依赖为ESM规范。
如果你在项目中采用了原生的ESM支持，那么浏览器监测到一个import语句将会向服务器发送一个请求，如果我们不采用esbuild进行预构建打包，而你又在使用类似loadsh这样分割成几十个甚至上百个文件的第三方库，那么就会发送几百个http请求。而浏览器最多只支持同时发送六个http请求，这样就会造成页面显示缓慢。所以vite需要对第三方依赖进行预构建打包。为了让大家理解依赖预构建的源码实现，这里我通过几行代码简单解释:

1.对入口文件进行依赖扫描: 这个插件意思很简单，过滤掉相对路径，找到第三方包的包名放入依赖数组中，当然了，我这个只是最简单的处理。
```
//下面我们假设入口文件为index.js
const {build} = require("esbuild")
//用于存放扫描到的第三方依赖包名称
const deps = []
function depScanPlugin(deps){
  return {
    name:'esbuild-plugin-dep-scan'
    setup(build){
      //不能以.开头 "./index.js"不行
      //"react"可以
      build.onResolve({filter:/^[^\.]/},({path})=>{
        //将收集到的路径放入deps中即可
        deps.push(path)
        return {
          path
        }
      })
    }
  }
}
//进行依赖扫描
build({
  //依赖预构建扫描不需要写入文件
  write:false,
  entryPoints:["./index.js"],
  plugins:[depScanPlugin(deps)]
})
```
然后将获取的数组进行预构建打包。特别提示: 对于esbuild来说，如果你正在打包第三方库，那么你只需要在entryPoints中指定包名就可以了。
```
const path = require('path')
build({
  entryPoints:deps,
  witre:true,
  bundle:true,
  format:"esm",
  outfile:path.resolve(
    process.cwd(),
    "./node_modules/.vite/deps_temp"
  ),
  splitting:true,
})
```
这样我们就完成了vite的依赖预构建。是的，依赖预构建的核心就是这么简单。但是如果说引入的第三方包是import package from "react-dom/client"这样的形式呢？那是不是说，我们在deps中收集到的就应该是["react-dom/client"]了，如果这样直接传递给esbuild能不能打包呢？答案是肯定的，但是这将会导致产物目录的非扁平化。但是我们又希望打包出来的产物应当是扁平化的。例如:"react-dom/client"打包后应该生成react-dom_client.js文件。这该如何解决呢？

```
build({
  entryPoints:['react'],
  outdir:'./dist'
})
/*
  这样打包出的产物结构将会是
  -dist
   -react.js
*/
build({
  entryPoints:['react-dom/client'],
  outdir:'./dist'
})
/*
  这样打包出的产物结构将会是
  -dist
   -react-dom
    -client.js
*/
```
要解决这个问题，首先要知道esbuild产物结构跟什么有关系。显然他跟entryPoints中传递的包有密切关系。如果传递一个不含有/字符的包那么它将是扁平化的。但是如果含有/那么就是非扁平化的。那么我们设想一下假如我给entryPoints中传递的"react-dom/client"变成"react-dom_client"。这不就可以了吗？但是这会导致esbuild无法识别这个路径。那就写插件吧！

我们先将收集到的依赖进行扁平化处理，然后找到这个第三方包的真实位置，将扁平化后的名称与真实位置做映射。
```
//假设这是收集到的依赖
const deps = ['react-dom/client',...其他依赖]
const flattenDeps = new Array(deps.length)
const flattenDepsMapEntries = {}
const depEntries = new Array(deps.length)
function flattenId(id){
  return id.replace(/\//g,"_")
}
const getEntry = ()=>{/*省略它的实现*/}
deps.forEach(dep=>{
  if(dep.includes("/")){
    //获取这个包的入口文件路径
    const entry = getEntry(dep),
    //扁平化路径
    const flattenDep = flattenId(dep)
    flattenDeps.push(flattenDep)
    flattenDepsMapEntries[flattenDep] = entry
  }
})
//flattenDeps = ["react-dom_client"]
//flattenDepsMapEntries = {"react-dom_client":'入口路径'}
```
我们在写一个esbuild的插件进行处理: 因为esbuild无法识别"react-dom_client"这样的路径，所以我们在这个插件内部将这样的路径处理为入口绝对路径，然后交给esbuild，esbuild就能识别了。
```
function preBundlePlugin(flattenDepsMapEntries){
  return {
    name:"esbuild-plugin-pre-bundle",
    setup(build){
      //接受所有的路径
      build.onResolve(
        {filter:/.*/},
        ({path,importer})=>{
         //没有importer表示是顶层模块，也就是传递
         //的flattenDeps
         if(!importer){
           const entry = flattenDepsMapEntries[path]
           if(entry){
             return {path:entry}
           }
         }
         return {path}
      })
    }
  }
}
```
应用这个插件
```
const path = require('path')
build({
  entryPoints:deps,
  witre:true,
  bundle:true,
  format:"esm",
  outfile:path.resolve(
    process.cwd(),
    "./node_modules/.vite/deps_temp"
  ),
  splitting:true,
+ plugins:[preBundlePlugin(flattenDepsMapEntries)]
})
```
那么到这里，你是不是就以为这个问题完美解决了呢？实际上esbuild又开始作妖了。我们刚才返回的路径是一个绝对路径，那么对于esbuild来说，你这样做就相当于entryPoints:["入口绝对路径"]，也就是说你传递了一个E://xxx//xxx//node_modules/react-dom/client.js这样的路径给它，这样做的结果就是它生成的产物结构依旧是非扁平化的。这个插件相当于无效了。那又该怎么办呢？


那该如何破坏他的产物生成结构呢？创建虚拟模块。
我们在onLoad钩子中自己去读取文件，然后返回里面的内容。那么esbuild就将会当做这是一个代理模块，这样打包出来的产物就将与路径无关。而是使用传递的文件名。例如"react-dom/client=>client.js"。

```
function preBundlePlugin(flattenDepsMapEntries){
  return {
    name:"esbuild-plugin-pre-bundle",
    setup(build){
      //接受所有的路径
      build.onResolve(
        {filter:/.*/},
        ({path,importer})=>{
         //没有importer表示是顶层模块，也就是传递
         //的flattenDeps
         if(!importer){
           const entry = flattenDepsMapEntries[path]
           if(entry){
             return {
              path:entry,
+            namespace:"dep"
             }
           }
         }
         return {path}
      })
+      build.onLoad({filter:/.*/,namespace:"dep"},async ({path})=>{
+        return {
+          contents:await fs.promises.readFile(path,"utf-8"),
+          loader:"js",
+          resolveDir:process.cwd()
+        }
+     })
    }
  }
}
```

好了，但是你以为到这里就结束了吗？ 不不不，这才是本文的关键之处。假设现在找到的依赖有两个，react-dom、scheduler,我们知道react-dom依赖scheduler，而我们都做了代理模块，那么对于打包scheduler的时候，作为代理模块打包、在react-dom中会遇到import {} from "scheduler这样的语句，而这里的scheduler将和代理模块没有任何关系，这就会导致打包两次。
我们来理理思绪，首先因为产物不是扁平化的，所以我们改变entryPoints:deps=>flattenDeps，但是这样没有效果，所以创建代理模块，断开esbuild自己的处理逻辑，作为一个全新的模块打包。但是这样会导致二次打包。这又该怎么办呢？
方法也很简单。我们改造代理模块，在打包react-dom的时候会遇到import {} from "scheduler这个语句。那么我们修改代理模块内容。也让他去引入，然后重导出。但是我怎么知道scheduler暴露了那些方法呢？这就需要用到es-module-lexer，这个库可以分析文件的import和export语句。我们只需要用这个库去分析包的入口文件就能得到导出了那些文件。就可以改造代理模块了。

//假设A库导出了a方法
//重导出代码
import {a} from "A"
export {a}


这样做就相当于代理模块也去引入了scheduler模块，react-dom也是引入了scheduler，这样就让scheduler摆脱了代理模块的限制。
我们看看源码中对于这一段代码的解释：对于入口文件，我们将会读取他本身，然后构造一个代理模块来保留原始id而不是使用文件路径。以便esbuild输出所需的输出文件结构。有必要重新导出以将虚拟代理模块与实际模块分离，因为实际模块可能会通过相对导入引用-如果我们不分离代理和实际模块，esbuild将创建相同的副本单元。

```
// For entry files, we'll read it ourselves and construct a proxy module
// to retain the entry's raw id instead of file path so that esbuild
// outputs desired output file structure.
// It is necessary to do the re-exporting to separate the virtual proxy
// module from the actual module since the actual module may get
// referenced via relative imports - if we don't separate the proxy and
// the actual module, esbuild will create duplicated copies of the same
// module!
const root = path$n.resolve(config.root);
build.onLoad({ filter: /.*/, namespace: "dep" }, ({ path: id }) => {
  const entryFile = qualified[id];
  let relativePath = normalizePath$3(path$n.relative(root, entryFile));
  if (
    !relativePath.startsWith("./") &&
    !relativePath.startsWith("../") &&
    relativePath !== "."
  ) {
    relativePath = `./${relativePath}`;
  }
  let contents = "";
  const { hasImports, exports, hasReExports } = exportsData[id];
  if (!hasImports && !exports.length) {
    // cjs
    contents += `export default require("${relativePath}");`;
  } else {
    if (exports.includes("default")) {
      contents += `import d from "${relativePath}";export default d;`;
    }
    if (hasReExports || exports.length > 1 || exports[0] !== "default") {
      contents += `\nexport * from "${relativePath}"`;
    }
  }
  return {
    loader: "js",
    contents,
    resolveDir: root,
  };
});
```
可以发现，对于一些功能的实现，真的是很精妙，虽然改不了esbuild的源码，但是利用他的特性就是可以绕开这些问题，直达中心。

有了上面的铺垫，相信你就能很轻易的理解文章开头提出的问题了。他想表达的就是他发现直接更改路径并不会出现二次打包问题。

例如在插件当中直接这样硬核改变路径，esbuild依然不会使用返回的文件路径作为输出目录，他与传递的entryPoints强相关。例如传递的entryPoints:["react-dom_client"]那么无论如何在onResolve中修改路径最终产生的文件都是react-dom_client.js。这就有意思了，那么这就意味着代理模块的存在是没有必要的。我测试了这种情况下是否会出现二次打包的问题，答案是并不会。想想这确实符合常规思维逻辑，在一个第三方模块内引入另外一个第三方模块，本质上还是要解析另外一个第三方模块的入口文件，而我在onResolve钩子中将这个路径改成与另外一个第三方模块的入口路径相同，那么他们就应该是同一个模块所以不应该被打包两次。
但是这样就不能解释，为什么作者要大费周章的搞这么复杂的东西呢？我的心中出现了两种可能：


我理解这部分的源码出错了，作者这样做并不是我理解的这个意思。
因为某种原因导致作者当时不得不这么做。


对于第一种情况，我实在是想不到，还有没有其他什么可能。那到底是什么原因导致作者当时不得不那么做呢？明明有更简单的方法。我突然想到了，有没有可能是版本问题。vite的初始版本是在几年前开发的。那么那个时候的esbuild版本就不会是现在这个版本，那会不会当时的esbuild并不能像现在这样智能以至于它并不能识别上述情况，所以一定会二次打包所以不得不使用重导出来处理这个问题。
有了这样的思路，我立刻下载了老版本的esbuild进行测试。测试结果如下:

打包结果显示:果然两年前的版本直接修改路径会出现非扁平化产物。

我们继续添加代理模块处理，观察添加代理模块后是不是就不出现非扁平化产物了。

```
//0.8.34版本(两年前)
const {build} = require("esbuild")
const path = require('path')
build({
  entryPoints:["react-dom","myScheduler_jsx"],
  plugins:[
   {
     name:"resolveMyScheduler",
     setup(build){
       build.onResolve({filter:/myScheduler_jsx/},()=>{
         return {
           path:path.resolve(
             process.cwd(),
             "./node_modules/scheduler/cjs/scheduler.development.js"
           ),
+         namespace:'dep'
         }
       })
+     build.onLoad({filter:/.*/,namespace:'dep'},({path:p})=>{
+       return {
+         contents:await fs.promises.readFile(p,"utf-8"),
+         loader:'js',
+         resolveDir:path.dirname(p)
+       }
+     })
     }
   }
  ]
})
```
最后我们测试最新版本的esbuild。
```
//0.15.10(当前版本)
const {build} = require("esbuild")
const path = require('path')
build({
  entryPoints:["react-dom","myScheduler_jsx"],
  plugins:[
   {
     name:"resolveMyScheduler",
     setup(build){
       build.onResolve({filter:/myScheduler_jsx/},()=>{
         return {
           path:path.resolve(
             process.cwd(),
             "./node_modules/scheduler/cjs/scheduler.development.js"
           )
         }
       })
     }
   }
  ]
})

```
产物依旧是扁平化的，并且与传递的entryPoints属性成强相关。
好啦！终于弄清楚了为什么作者当初一定要用代理模块和重导出来处理。那么这个结果也表明，目前的vite不再需要代理模块和重导出了，这部分的代码可以删除。得到这个结果后，我立刻向vite提交了这个pr。

