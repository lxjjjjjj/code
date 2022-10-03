[definePlugin](https://juejin.cn/post/6844903458974203911)

# 用途
这个插件用来定义全局变量，在webpack打包的时候会对这些变量做替换。
```
//webpack.config.js
var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
        index: "./js/index.js"
    },
    output: {
        path: "./dist/",
        filename: "js/[name].js",
        chunkFilename: "js/[name].js"
    },
    plugins: [
        new webpack.DefinePlugin({
            SOMETHINE: 'This is something we needed.'
        })
    ]
};

//index.js
console.log(SOMETHINE);
```
编译完的结果如下：
```
function(module, exports, __webpack_require__) {
   console.log((This Is The Test Text.));
}
```

可以看到代码中 SOMETHINE 被直接替换为 This is something we needed. 但是我们的本意中 SOMETHINE 是一个字符串，而直接替换后却不是一个字符串。怎么办呢？
方法一：可以将 SOMETHINE 的值写成  SOMETHINE: '"This is something we needed."'复制代码
方法二： 借助 JSON.tringify ,转为字符串 SOMETHINE: JSON.stringify('This is something we needed.')

推荐使用方法二，它不仅可以处理字符串，还可以处理Object中的字符串和Array。如下：
```
//webpack.config.js

 plugins: [
    new webpack.DefinePlugin({
        OBJ: JSON.stringify({"key1": "this is value"}),
        OBJ2: {"key1": "this is value"},
        OBJ3: {"key1": "'this is value'"},
        ARRAY: JSON.stringify(["value1", "value2"]),
        ARRAY2: ["value1", "value2"],
        ARRAY3: ["'value1'", "'value2'"]
    })
]

//index.js
console.log(OBJ);
console.log(OBJ2);
console.log(OBJ3);
console.log(ARRAY);
console.log(ARRAY2);
console.log(ARRAY3);
```
编译结果
```
console.log(({"key1":"this is value"})); // OBJ 正确
console.log(({"key1":this is value})); // OBJ2 this is value 被直接替换了，而非字符串
console.log(({"key1":'this is value'})); // OBJ3 正确
console.log((["value1","value2"])); // ARRAY 正确
console.log(({"0":value1,"1":value2})); // ARRAY2 直接写[]的形式，会被替换为object的类型，value1 和 value2 不是字符串
console.log(({"0":'value1',"1":'value2'})); // ARRAY3 正确
```
还剩下 Number 和 Boolean 两种变量类型，对于这两种类型，就不像上面介绍的这么麻烦了，直接写就行
```
//webpack.config.js

 plugins: [
    new webpack.DefinePlugin({
        NUMBER: 12,
        BOOL: true
    })
]

//index.js
console.log(NUMBER);
console.log(BOOL);
```
# 实际运用

介绍了这么多，在实际使用中， DefinePlugin 最为常用的用途就是用来处理我们开发环境和生产环境的不同。比如一些 debug 的功能在生产环境中需要关闭、开发环境中和生产环境中 api 地址的不同。以 vue-cli 生成的打包文件为例子，来看看在实际中的使用。
vue-cli 生成的目录中编译、打包相关的有两个文件夹 build 和 config 。
build 文件夹中找到 wbepack.dev.conf.js 和 webpack.prod.conf.js ，这两个文件中都通过 DefinePlugin 插件定义了 process.env 这个变量

```
// webpack.dev.conf.js
var config = require('../config')
...
new webpack.DefinePlugin({
  'process.env': config.dev.env
})

// webpack.prod.conf.js
var config = require('../config')
var env = config.build.env
...
new webpack.DefinePlugin({
  'process.env': env
})
```
config 中对 env 的定义分别放在 config/dev.env.js 和 config/prod.env.js 中
```
//config/index.js
module.exports = {
  build: {
    env: require('./prod.env'),
    ...
  },
  dev: {
    env: require('./dev.env'),
    ...
  }
}

//config/prod.env.js

module.exports = {
  NODE_ENV: '"production"'
}

//config/dev.env.js

var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"'
})
```
到此可以看到，在 wbepack.dev.conf.js 中最终为  'process.env': {NODE_ENV: '"development"'}复制代码
在 webpack.prod.conf.js 中最终为  'process.env': {NODE_ENV: '"production"'}复制代码
在我们的代码中，如果部分只是在开发环境下才执行的逻辑，那么可以通过下面的方式
```
if ('development' === process.env.NODE_ENV) {
 // 开发环境下的逻辑
} else {
 // 生产环境下
}

```