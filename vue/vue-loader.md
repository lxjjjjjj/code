# vue-loader
[原文链接](https://juejin.cn/post/6937125495439900685)

vue-loader要配合vueloaderPlugin一起使用
[style代码的三个阶段](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/2/21/1690f6d4e5b01478~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)
[template代码的三个阶段](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/2/21/1690f6d95599feef~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)

vue-loader 主要包含三部分：

lib/index.js 定义的 normal loader
lib/loaders/pitcher.js 定义的 pitcher loader
lib/plugin.js 定义的插件

预处理阶段：在插件 apply 函数动态修改 webpack 配置，注入 vue-loader 专用的 rules
内容处理阶段：normal loader 配合 pitcher loader 完成文件内容转换
# vue-loader-plugin 注册 pitcher loader --- 预处理阶段
更改module.rules添加pitch loader, plugin 中遍历 compiler.options.module.rules 数组，也就是用户提供的webpack配置中的 module.rules 项，对每个rule执行 cloneRule 方法复制规则对象。之后，将webpack 配置修改为 [pitcher, ...clonedRules, ...rules] 。cloneRule 内部定义的 resourceQuery 函数对应 module.rules.resourceQuery 配置项，与我们经常用的 test 差不多，都用于判断资源路径是否适用这个rule。这里 resourceQuery 核心逻辑就是取出路径中的lang参数，伪造一个以 lang 结尾的路径，传入rule的condition中测试路径名对该rule是否生效，例如下面这种会命中 /.js$/i 规则：import script from "./index.vue?vue&type=script&lang=js&"
```
class VueLoaderPlugin {
  apply (compiler) {
    // ...

    const rules = compiler.options.module.rules
    // ...
    // plugin 中遍历 compiler.options.module.rules 数组，
    // 也就是用户提供的webpack配置中的 module.rules 项，
    // 对每个rule执行 cloneRule 方法复制规则对象。
    // 之后，将webpack 配置修改为 [pitcher, ...clonedRules, ...rules] 。
    const clonedRules = rules
      .filter(r => r !== rawVueRules)
      .map((rawRule) => cloneRule(rawRule, refs))

    // ...

    // global pitcher (responsible for injecting template compiler loader & CSS
    // post loader)
    // 初始化pitcher,定义pitcher对象，指定loader路径为 require.resolve('./loaders/pitcher') ，并将pitcher注入到 rules 数组首位。
    const pitcher = {
      loader: require.resolve('./loaders/pitcher'),
      resourceQuery: query => {
        if (!query) { return false }
        const parsed = qs.parse(query.slice(1))
        return parsed.vue != null
      }
      // ...
    }

    // replace original rules
    compiler.options.module.rules = [
      pitcher,
      ...clonedRules,
      ...rules
    ]
  }
}

function cloneRule (rawRule, refs) {
    // ...
}

module.exports = VueLoaderPlugin
```
# SFC 内容处理阶段 

插件处理完配置，webpack 运行起来之后，vue SFC 文件会被多次传入不同的loader，经历多次中间形态变换之后才产出最终的js结果，大致上可以分为如下步骤：

路径命中 /.vue$/i 规则，调用 vue-loader 生成中间结果A
结果A命中 xx.vue?vue 规则，调用 vue-loader pitcher 生成中间结果B
结果B命中具体loader，直接调用loader做处理

*   第一次执行 vue-loader 在运行阶段，根据配置规则， webpack 首先将原始的SFC内容传入vue-loader 
    调用 @vue/component-compiler-utils 包的parse函数，将SFC 文本解析为AST对象
    遍历 AST 对象属性，转换为特殊的引用路径
    返回转换结果注意，这里并没有真的处理 block 里面的内容，而是简单地针对不同类型的内容块生成import语句：
    ```
    Script："./index.vue?vue&type=script&lang=js&"
    Template: "./index.vue?vue&type=template&id=2964abc9&scoped=true&"
    Style: "./index.vue?vue&type=style&index=0&id=2964abc9&scoped=true&lang=css&"
    ```
*  执行pitcher 
   如前所述，vue-loader-plugin 会在预处理阶段插入带 resourceQuery 函数的 pitcher 对象
   resourceQuery 函数命中 xx.vue?vue 格式的路径，也就是说上面vue-loader 转换后的import 路径会被pitcher命中，做进一步处理。pitcher 的逻辑比较简单，做的事情也只是转换import路径。
   核心功能是遍历用户定义的rule数组，拼接出完整的行内引用路径。在 pitcher 中解读loader数组的配置，并将路径转换成完整的行内路径格式
   
*  第二次执行vue-loader
   import mod from "-!../../node_modules/babel-loader/lib/index.js??clonedRuleSet-2[0].rules[0].use!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=script&lang=js&";
   以这个import语句为例，之后webpack会按照下述逻辑运行：
   调用 vue-loader 处理 index.js 文件
   调用 babel-loader 处理上一步返回的内容
   第二次运行vue-loader时由于路径已经带上了 type 参数，会命中上面第26行的判断语句，进入 selectBlock 函数。就只是根据type参数返回不同内容。

```
// 原始代码
import xx from './index.vue';
// 第一步，命中 vue-loader，转换为：
import { render, staticRenderFns } from "./index.vue?vue&type=template&id=2964abc9&scoped=true&"
import script from "./index.vue?vue&type=script&lang=js&"
export * from "./index.vue?vue&type=script&lang=js&"
import style0 from "./index.vue?vue&type=style&index=0&id=2964abc9&scoped=true&lang=css&"

// 第二步，命中 pitcher，转换为：
export * from "-!../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=template&id=2964abc9&scoped=true&"
import mod from "-!../../node_modules/babel-loader/lib/index.js??clonedRuleSet-2[0].rules[0].use!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=script&lang=js&"; 
export default mod; export * from "-!../../node_modules/babel-loader/lib/index.js??clonedRuleSet-2[0].rules[0].use!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=script&lang=js&"
export * from "-!../../node_modules/mini-css-extract-plugin/dist/loader.js!../../node_modules/css-loader/dist/cjs.js!../../node_modules/vue-loader/lib/loaders/stylePostLoader.js!../../node_modules/vue-loader/lib/index.js??vue-loader-options!./index.vue?vue&type=style&index=0&id=2964abc9&scoped=true&lang=css&"

// 第三步，根据行内路径规则按序调用loader
```
然后交给webpack处理request

我们看到通过 vue-loader 处理到得到的 module path 上的 query 参数都带有 vue 字段。这里便涉及到了我们在文章开篇提到的 VueLoaderPlugin 加入的 pitcher loader。如果遇到了 query 参数上带有 vue 字段的 module path，那么就会把 pitcher loader 加入到处理这个 module 的 loaders 数组当中。因此这个 module 最终也会经过 pitcher loader 的处理。此外在 loader 的配置顺序上，pitcher loader 为第一个，因此在处理 Vue SFC 模块的时候，最先也是交由 pitcher loader 来处理。
