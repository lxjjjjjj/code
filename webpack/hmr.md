[原文链接](https://juejin.im/post/5df36ffd518825124d6c1765#heading-58)
[第二个webpack热更新原理文章](https://juejin.cn/post/7148075486403362846)
[流程图更清晰](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/13/16eff1c393a42bd0~tplv-t2oaga2asx-image.image)
# HotModuleReplacementPlugin

## 1、注入运行时代码
hotCreateRequire方法在代码中注入客户端和本地server的socket通信代码监听来自服务端的webpackHotUpdate事件
然后调用编译生成的chunk文件多一个hot属性，给打包编译生成的文件添加hot属性，hot是否有值支持热更新，hot对象包含accept函数和check函数，accept函数内添加的依赖文件更新，触发引入该module的父module的render函数更新。check函数负责拉取manifest文件。（对应客户端的2）。accept就是往hot._acceptedDependencies对象存入局部更新回调函数，当模块文件改变的时候，我们会调用acceptedDependencies搜集的回调，没错，他就是将模块改变时，要做的事进行了搜集，搜集到_acceptedDependencies中，以便当content.js模块改变时，他的父模块index.js通过_acceptedDependencies知道要干什么。

socket通信代码监听来自服务端的webpackHotUpdate事件window.webpackHotUpdate方法里拉取mainfest.json代码获取到moduleid找到旧的module的代码替换代码，并且根据旧的module的parent，利用父module的parentModule.hot._acceptedDependencies里的依赖收集的accept函数，然后执行在父组件dependences里每个module中存储的callback更新函数
### accept使用
```
if (module.hot) {
    module.hot.accept(["./content.js"], render);
}
```
function hotCreateModule() {
    var hot = {
        accept: function (dep, callback) {
            for (var i = 0; i < dep.length; i++)
                hot._acceptedDependencies[dep[i]] = callback;
        },
    };
    return hot;
} 
var module = installedModules[moduleId] = {
    // ...
    hot: hotCreateModule(moduleId),
};
accept就是往hot._acceptedDependencies对象存入 局部更新回调函数，_acceptedDependencies什么时候会用到呢？（当模块文件改变的时候，我们会调用acceptedDependencies搜集的回调）

```
if (module.hot) {
    module.hot.accept(["./content.js"], render);
    // 等价于module.hot._acceptedDependencies["./content.js"] = render
    // 没错，他就是将模块改变时，要做的事进行了搜集，搜集到_acceptedDependencies中
    // 以便当content.js模块改变时，他的父模块index.js通过_acceptedDependencies知道要干什么
}
```
## 2、生成两个补丁文件
HotModuleReplacement 生成 manifest(JSON)命名为hash.hot-update.json文件，包含本次编译和上次编译更改的chunk名和更改的chunk文件的hash值的内容。还有updated chunk (JavaScript)命名为chunk名字.本次编译生成的hash.hot-update.js。

# webpack-hot-middleware
将热更新的代码插入hot相关逻辑可以热更新

# webpack-dev-server

1、创建webpack实例，更改entry、向客户端打包的代码中添加HotModuleReplacementPlugin生成的监听webpack done事件发送hash和ok事件的代码

2、创建webserver服务器和websocket服务器让浏览器和服务端建立通信（对应服务端的1.3.4和客户端的1）

【node-express[启动服务] + webpack-dev-middleware + webpack-hot-middleware】的集成封装

# webpack-dev-middleware
1、负责本地文件的监听、启动webpack编译
2、设置文件系统为内存文件系统
3、实现了一个express中间件，将编译的文件返回（对应服务端的2）

将webpack编译产物提交给服务器，并且他将产物放置在内存中【这也是为啥我们在开发过程中在文件夹中找不到我们的打包代码】

整个流程分为服务端和客户端两部分

# 服务端主要四个重要点

1.通过webpack创建compiler实例，webpack在watch模式下编译compiler实例：监听本地文件的变化、文件改变自动编译、编译输出。更改config中的entry属性：将lib/client/index.js、lib/client/hot/dev-server.js注入到打包输出的chunk文件中。往compiler.hooks.done钩子（webpack编译完成后触发）注册事件：里面会向客户端发射hash和ok事件

2.调用webpack-dev-middleware：启动编译、设置文件为内存文件系统、里面有一个中间件负责返回编译的文件

3.创建webserver静态服务器：让浏览器可以请求编译生成的静态资源

4.创建websocket服务：建立本地服务和浏览器的双向通信；每当有新的编译，立马告知浏览器执行热更新逻辑


# 客户端主要分为两个关键点

1.创建一个 websocket客户端 连接 websocket服务端，websocket客户端监听 hash 和 ok 事件。

2.主要的热更新客户端实现逻辑，浏览器会接收服务器端推送的消息，如果需要热更新，浏览器发起http请求去服务器端获取新的模块资源解析并局部刷新页面，这本是HotModuleReplacementPlugin帮我们做了，他将 HMR 运行时代码注入到chunk中

# 总结

环境准备做的事情

引入 HotModuleReplacementPlugin 生成 manifest.json 和 js 文件，其中 manifest.json 文件存放的是更改的文件的 hash 值，以便于客户端拉取新的文件。js 文件就是更改的新文件。同时 HotModuleReplacementPlugin 也会生成在客户端运行可以接收服务端socket消息通信的代码。webpack-dev-server负责将通信代码在webpack编译流程中通过更改entry达到将文件打包到客户端文件中让客户端执行。同时它也会创建本地server服务用来给客户端发送消息，webpack-dev-middleware负责监听webpack编译获取文件系统的变化并且将文件发送给客户端。HotModuleReplacementPlugin在webpack编译的 mainTemplate 的 module 中加入hot属性，hot对象包含accept函数和check函数，check函数负责拉取manifest文件。accept函数内添加的依赖文件更新，触发引入该module的父module的render函数更新。

为什么使用JSONP获取最新代码？主要是因为JSONP获取的代码可以直接执行

webpack 只会在 mainTemplate 也就是主入口文件中加入hot属性，所以加入到client的dev-server代码中也直接判断module.hot是否有这个属性进行热更新代码拉取mainfest.json 以及更改的 js 文件。

webpack编译完生成新的hash -> 服务端socket发送编译hash -> 客户端socket 收到hash 保存hash -> 服务端发送ok -> 客户端收到ok -> 通过hotEventemitter发送给client更新事件监听 -> 执行reloadApp的操作 -> 执行hot的check函数 拉取mainfest.json 和 js 文件 -> 执行hot的accept函数处理引用了变化的文件的父module执行render函数重新引入依赖文件

