HotModuleReplacement 生成 manifest(JSON)命名为hash.hot-update.json文件，包含本次编译和上次编译更改的chunk名和更改的chunk文件的hash值的内容。还有updated chunk (JavaScript)命名为chunk名字.本次编译生成的hash.hot-update.js。
给打包编译生成的文件添加hot属性，hot对象包含accept函数和check函数，accept函数内添加的依赖文件更新，触发引入该module的父module的render函数更新。check函数负责拉取manifest文件。（对应客户端的2）

webpack-dev-server负责更改entry、监听webpack done事件发送hash和ok事件）、创建webserver服务器和websocket服务器让浏览器和服务端建立通信（对应服务端的1.3.4和客户端的1）

webpack-dev-middleware负责本地文件的监听、启动webpack编译和设置文件系统为内存文件系统3.实现了一个express中间件，将编译的文件返回（对应服务端的2）

整个流程分为服务端和客户端两部分

服务端主要四个重要点

1.通过webpack创建compiler实例，webpack在watch模式下编译compiler实例：监听本地文件的变化、文件改变自动编译、编译输出。更改config中的entry属性：将lib/client/index.js、lib/client/hot/dev-server.js注入到打包输出的chunk文件中。往compiler.hooks.done钩子（webpack编译完成后触发）注册事件：里面会向客户端发射hash和ok事件

2.调用webpack-dev-middleware：启动编译、设置文件为内存文件系统、里面有一个中间件负责返回编译的文件

3.创建webserver静态服务器：让浏览器可以请求编译生成的静态资源

4.创建websocket服务：建立本地服务和浏览器的双向通信；每当有新的编译，立马告知浏览器执行热更新逻辑


客户端主要分为两个关键点

1.创建一个 websocket客户端 连接 websocket服务端，websocket客户端监听 hash 和 ok 事件。

2.主要的热更新客户端实现逻辑，浏览器会接收服务器端推送的消息，如果需要热更新，浏览器发起http请求去服务器端获取新的模块资源解析并局部刷新页面，这本是HotModuleReplacementPlugin帮我们做了，他将HMR 运行时代码注入到chunk中