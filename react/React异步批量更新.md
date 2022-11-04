[原文链接](https://juejin.cn/post/6970191426214690823)

在 React 里面称之为批量更新。如果在一次调用的过程中多次触发 state 的更新，则会做成 render 函数的多次触发，从而导致页面被迫渲染了多次，此时性能会大受影响。而在大多数情况下，一个事件调用了多次 setState ,其实我们只需要它渲染一次就足够了，所以这个类异步的操作，是 React 是内部性能优化的一种手段。而为什么在 setTimeout 里面调用，又是同步操作，继续学习。

首先，看到 setTimeout 的时候，熟悉 js 事件循环机制的同学第一反应可能会以为它是采用了微任务的方式去处理，但其实不然，React 使用了一种在操作数据库中非常常用的机制去实现，该机制叫做事务机制，这个机制比直接使用微任务有更好的操控度.
# case1
```
import React, { useState } from 'react'
class Counter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        number: 0,
        };
    }
    // 每次都只+1
    handleClick = (event) => {
        this.setState({ number: this.state.number + 1 });
        console.log(this.state); // 1
        this.setState({ number: this.state.number + 1 });
        console.log(this.state); // 2
    };

    render() {
        return (
        <div>
            <p>{this.state.number}</p>
            <button onClick={this.handleClick}>+</button>
        </div>
        );
    }
}

export default Counter
```
# case2
```
import React, { useState } from 'react'
class Counter extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        number: 0,
        };
    }
    // 每次都+2
    handleClick = (event) => {
        setTimeout(() => {
            this.setState({ number: this.state.number + 1 });
            console.log(this.state); // 1
            this.setState({ number: this.state.number + 1 });
            console.log(this.state); // 2
        }, 0)
    };

    render() {
        return (
        <div>
            <p>{this.state.number}</p>
            <button onClick={this.handleClick}>+</button>
        </div>
        );
    }
}

export default Counter
```

# 事务锁实现批量更新

事务的实例
```
const transaction = {
    perform(fn) {
        this.initialAll()
        fn.call(app);
        this.close();
    },
    initialAll() {
        app.isBatchingUpdate = true;
        // do something
    },
    close() {
        app.isBatchingUpdate = false;
        app.updateState();
        // do something
    }
}
```
模拟React实现isBatchingUpdate控制setState
```
// 记录有变化的组件
const dirtyComponent = new Set();
// 基类
class Component {
    // 批量更新的标识 也可称之为 变量锁，放这里是为了方便  大家不要太纠结细节，先弄懂原理
    isBatchingUpdate = false
    // 预处理状态 先默认 a 为 1
    preState = {
        a: 1
    }
    state = {
        a: 1
    }
    setState(changeState) {
        if (!this.isBatchingUpdate) {
            this.updateNow(changeState);
        } else {
            this.queueUpdate(changeState)
        }
    }
    // 最终版 更新状态
    updateState() {
        Object.assign(this.state, this.preState);
    }
    // 立刻更新
    updateNow(changeState) {
        Object.assign(this.preState, changeState);
        Object.assign(this.state, this.preState);
        this.render();
    }
    // 这里其实还可以传入函数  先展示最基本原理，后续再加上
    queueUpdate(changeState) {
        Object.assign(this.preState, changeState);
        dirtyComponent.add(this);
    }
}
```
模拟建一个React Component实例
```
// 类组件
class App extends Component {
    state = {
        a: 1
    }
    onClick() {
        this.setState({ a: this.state.a + 1 });
        console.log('点击时 a 的值', this.state.a)
        this.setState({ a: this.state.a + 1 });
        console.log('点击时 a 的值', this.state.a);
        this.test();
    }
    test() {
        this.setState({ a: this.state.a + 1 });
        console.log('点击时 a 的值', this.state.a);
    }
    // 渲染函数 这里简单介绍哈，我们写的jsx，其实会经过这个过程：jsx -> React.createElement -> vnode  为了方便直接显示虚拟 dom 的最终数据结构
    render() {
        console.log('渲染时a的值', this.state.a);
        return {
            type: 'div',
            props: {
                id: "btn",
                children: [],
                onClick: () => this.onClick()
            }
        }
    }
}
```
setState 和 transaction 都模拟好了，就还差一步，就是模拟一下 React 的事件代理，这里就不做事件委托了，直接监听点击的按钮
```
// 构建实例 为了方便展示先挂载在window ，源码有另外保存的地方
window.app = new App();
// 获取虚拟 dom 节点
const vnode = app.render();
// 监听原生点击事件，react 自身实现了事件委托，但这里为了方便展示，直接在 dom 节点上监听事件
document.getElementById('btn').addEventListener('click', () => {
    // 事务包裹点击函数  react内部还有个找vnode的方法 和 匹配事件的方法 这里先省略
    transaction.perform(vnode.props.onClick);
    if (dirtyComponent.size !== 0) {
        dirtyComponent.forEach(component => component.render());
        dirtyComponent.clear();
    }
    // do something
})
```
React 会先找到我们注册的 vnode 和 vnode 内的对应事件，然后事务实例套着我们的 onClick 方法，从而在执行前，先把 isBatchingUpdate 这个变量锁打开。只要我们的方法没完成，由于变量锁的存在，就会一直让我们的修改只停留在 preState 内，一直不会更新到实际的 state 上。直到我们的方法执行完，事务的后置函数就会关闭我们的 isBatchingUpdate，同时把 preState 覆盖到我们实际的 state 上并执行渲染操作，至此整个批量更新就完成了。

## Q: setTimeout 内为什么又会同步？
A: 前文说到 setTimeout 里面会同步是由于 setTimeout 会把里面的函数放到下一个宏任务内，这样就刚好跳出了事务的控制，就会显示出同步更新的情况。
## Q: 为什么不用Promise.resolve().then() 去替代事务机制?
A: 我也看到很多文章直接用 Promise.resolve().then() 来模拟，但我觉得应该是不对的，在我看来这两者有本质的差异。Promise.resolve().then 是利用了微任务的原理进行延迟执行，这个延迟更新的时间就不太好控制了，如果当前宏任务内有一些耗时任务执行？如果又插入了其他微任务呢？而React 倡导的是函数式编程，函数式编程的思想是一切透明，可控，可预测。放入微任务明显颗粒度不足，可控性不强，我猜这才是 React 方面实现事务机制的根本原因。

