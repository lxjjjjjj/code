JSX是一种描述当前组件内容的数据结构

JSX在编译时会被Babel编译为React.createElement方法。

JSX编译 这也是为什么在每个使用JSX的JS文件中，你必须显式的声明

import React from 'react';
否则在运行时该模块内就会报未定义变量 React的错误。

在React17中，已经不需要显式导入React了。详见介绍全新的 JSX 转换

JSX并不是只能被编译为React.createElement方法，你可以通过@babel/plugin-transform-react-jsx (opens new window)插件显式告诉Babel编译时需要将JSX编译为什么函数的调用（默认为React.createElement）。

比如在preact (opens new window)这个类React库中，JSX会被编译为一个名为h的函数调用。