```
import React from 'react'
class ComponentOne extends React.Component{
    constructor(){
        super()
    }
  handleAlertClick() {
    debugger
    console.log('handleAlertClick',this) // bind了所以有值
  }
  handleAlertClick = () => {
    debugger
    console.log('handleAlertClick',this) // 不需要bind
  }
  render(){
    return (<div>
    <button onClick={this.handleAlertClick.bind(this)}>
      Click me
    </button>
  </div>)
  }
}


export default ComponentOne;
```

类比下面例子的this
```
const obj = { 
    bbb: 1,
    aaa: function(p){
        console.log(p,this)
    }
};
const ab = obj.aaa;
ab('aaaa')

```
js的this是运行时确定的

```
const obj = { 
    bbb: 1,
    aaa: function(p){
        console.log(p,this)
    }
};
const ab = obj.aaa.bind(obj); // 此时输出的是obj对象
ab('aaaa')
```
因为类是在严格模式下所以this是undefined

因为React不是单纯的被类调用自己本身的方法，需要将方法给react-dom中的统一事件处理方法执行，所以在赋值的时候再次调用就会失去this指向。