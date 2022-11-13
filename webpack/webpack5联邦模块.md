[原文链接](https://juejin.cn/post/6963326546606030856)

微前端的概念相信大家都不陌生，其本质是服务的拆分与隔离，最大程度地减少服务之间的冲突与碰撞。

webpack构建。一个独立项目通过webpack打包编译而产生资源包。
remote。一个暴露模块供其他webpack项目构建消费的webpack构建。
host。一个消费其他remote模块的webpack构建。

一言以蔽之，一个webpack构建可以是remote--即服务的提供方，也可以是host--即服务的消费方，也可以同时扮演服务提供者和服务消费者，完全看项目的架构。

## 实际操作
lib-appas remote,暴露了两个模块react和react-dom
component-app as remote and host,依赖lib-app,暴露了一些组件供main-app消费
main-app as host,依赖lib-app和component-app

```
lib-app暴露模块
//webpack.config.js
module.exports = {
    //...省略
    plugins: [
        new ModuleFederationPlugin({
            name: "lib_app",
            filename: "remoteEntry.js",
            exposes: {
                "./react":"react",
                "./react-dom":"react-dom"
            }
        })
    ],
    //...省略
}

```

生成的文件main.js、remoteEntry.js、...react_index.js、...react-dom_index.js；

第一个是本项目的入口文件（该项目只是暴露接口，所以该文件为空）
第二个是远程入口文件，其他webpack构建使用、访问本项目暴露的模块时，须通过它来加载
第三个和第四个是暴露的模块，供其他项目消费

component-app的配置
```
依赖lib-app,暴露三个模块组件Button、Dialog、Logo
//webpack.config.js
module.exports = {
    //...省略
    plugins:[
        new ModuleFederationPlugin({
            name: "component_app",
            filename: "remoteEntry.js",
            exposes: {
              "./Button":"./src/Button.jsx",
              "./Dialog":"./src/Dialog.jsx",
              "./Logo":"./src/Logo.jsx"
            },
            remotes:{
                "lib-app":"lib_app@http://localhost:3000/remoteEntry.js"
            }
        }),
    ]
}
```
三个暴露的组件：
```
//Button.jsx
import React from 'lib-app/react';
export default function(){
    return <button style={{color: "#fff",backgroundColor: "#409eff",borderColor: "#409eff"}}>按钮组件</button>
}
```
```
//Dialog.jsx
import React from 'lib-app/react';
export default class Dialog extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        if(this.props.visible){
            return (
                <div style={{position:"fixed",left:0,right:0,top:0,bottom:0,backgroundColor:"rgba(0,0,0,.3)"}}>
                    <button onClick={()=>this.props.switchVisible(false)} style={{position:"absolute",top:"10px",right:"10px"}}>X</button>
                    <div style={{ marginTop:"20%",textAlign:"center"}}>
                        <h1>
                            What is your name ?
                        </h1>
                        <input style={{fontSize:"18px",lineHeight:2}} type="text" />
                    </div>
                    
                </div>
                );
        }else{
            return null;
        }
        
    }
}
```
```
// Logo.jsx
import React from 'lib-app/react';
import pictureData from './MF.jpeg'
export default function(){
    return <img src={pictureData} style={{width:"500px",borderRadius:"10px"}}/>
}
```
main-app的配置
main-app依赖两个项目lin-app、component-app。
///webpack.config.js
module.exports = {
    //省略...
    plugins: [
        new ModuleFederationPlugin({
            name: "main_app",
            remotes:{
                "lib-app":"lib_app@http://localhost:3000/remoteEntry.js",
                "component-app":"component_app@http://localhost:3001/remoteEntry.js"
            },
        }),
        new HtmlWebpackPlugin({
          template: "./public/index.html",
        })
    ]
    //省略...
};
```
由于需要等待基础模块加载完毕，所以需要配置懒加载入口bootstrap.js.

webpack打包入口文件

import("./bootstrap.js")
```

bootstrap.js

import App from './App.jsx'
import ReactDOM from 'lib-app/react-dom';
import React from 'lib-app/react'
ReactDOM.render(<App />, document.getElementById("app"));
```

根组件App.jsx

import React from 'lib-app/react';
import Button from 'component-app/Button'
import Dialog from 'component-app/Dialog'
import Logo from 'component-app/Logo'
export default class App extends React.Component{
  constructor(props) {
    super(props)
    //省略...
  }
  //省略...
  render(){
    return (<div>
      //省略...
    </div>)
  }
}
```
运行并打开浏览器http://localhost:3002


