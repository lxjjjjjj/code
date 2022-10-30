# getDerivedStateFromProps
这个生命周期的意思就是从props中获取派生state。这个生命周期的功能实际上就是将传入的props映射到state上面，基本上就是直接替换了原来的componentWillReceiveProps。getDerivedStateFromProps 的存在只有一个目的：让组件在 props 变化时更新 state。新的生命周期：static getDerivedStateFromProps()是个纯函数，不能执行副作用（如异步调用数据等）。很大程度上避免了误操作。
[官网解释派生state](https://react.docschina.org/blog/2018/06/07/you-probably-dont-need-derived-state.html)
```
import React from 'react'
export default class Parent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: 0,
        };
    }

    handleClick = () => {
        this.setState({
            number: this.state.number + 1,
        });
    };

    render() {
        const { number } = this.state;
        return (
            <div>
                <Child number={number} />
                <button onClick={this.handleClick}>add one(outer)</button>
            </div>
        );
    }
}

class Child extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: props.number,
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.number !== state.number) {
            // 即使是setState引发的变化这里return的也是props，所以setState不会引发组件重新渲染
            return { number: props.number };
        }
        return null;
    }

    handleClick = () => {
        this.setState({
            number: this.state.number + 1,
        });
    };

    render() {
        const { number } = this.state;
        return (
            <div>
                <div>number is: {number}</div>
                {/* 这个按钮点击无效 */}
                <button onClick={this.handleClick}>add one(inner)</button>
            </div>
        );
    }
}

```

和componentWillReceiveProps有什么区别？
16.4之前的版本setState并不会进入getDerivedStateFromProps，这个函数会在每次re-rendering之前被调用，意味着即使你的props没有任何变化，而是本身的state发生了变化，导致子组件发生了re-render，这个生命周期函数依然会被调用。看似一个非常小的修改，却可能会导致很多隐含的问题。

```
export default class Demo1 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: 0,
        };
    }

    static getDerivedStateFromProps(props, state) {
        console.log('getDerivedStateFromProps');
    }

    handleClick = () => {
        this.setState({
            number: this.state.number + 1,
        });
    };

    render() {
        console.log('render');
        const { number } = this.state;
        return (
            <div>
                <div>{number}</div>
                <button onClick={this.handleClick}>add one</button>
            </div>
        );
    }
}
```
这个例子中一开始就会打印一次getDerivedStateFromProps，每点击一次button，都会先打印getDerivedStateFromProps，然后打印render。说明getDerivedStateFromProps这个生命周期已经和我们对componentWillReceiveProps的理解不一样了，只要有重新渲染都会进来（包括第一次渲染的时候）。

## 解决

```
export default class Parent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: 0,
        };
    }

    handleClick = () => {
        this.setState({
            number: this.state.number + 1,
        });
    };

    render() {
        const { number } = this.state;
        return (
            <div>
                <Child number={number} />
                <button onClick={this.handleClick}>add one(outer)</button>
            </div>
        );
    }
}

class Child extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: props.number,
        };
    }

    static getDerivedStateFromProps(props, state) {
       // 只有props引发的变化才会进入这里
        if (props.number !== state.prevNumber) {
            return {
                number: props.number,
                prevNumber: props.number,
            };
        }
        console.log('change from setState');
        return null;
    }

    handleClick = () => {
        this.setState({
            number: this.state.number + 1,
        });
    };

    render() {
        const { number } = this.state;
        return (
            <div>
                <div>number is: {number}</div>
                <button onClick={this.handleClick}>add one(inner)</button>
            </div>
        );
    }
}
```

## 总结
通过保存一个之前 的prop 值，我们就可以在只有 prop 变化时才去修改 state。这样就解决上述的问题。出现的另外一个问题是，当我们通过Child组件的setState改变number之后，再通过父组件的props改变，number会被重置，这问题其实就是由于数据源的多样性所导致的，父组件和子组件都在控制这个状态，而两边的状态是不一致的。
注意：这里有一个比较容易令人迷惑的点，当prop引发的变化进入该生命周期时，如果return null，表示不进行重新渲染，当state引发的变化进入该生命周期时，如果return null，表示按照既有state重新渲染。其实归根到底就是将return的state与之前的state进行合并后，再交由componentShouldUpdate进行对比，决定是否要重新渲染。

# componentDidMount
该方法只会运行一次，在首次渲染时页面将真实DOM挂载完毕之后运行。通常在这里做一些异步操作，比如开启定时器、发起网络请求、获取真实DOM等。在该方法中，可以大胆使用setState，因为页面已经渲染完成。执行完该钩子函数后，组件正式进入到活跃状态。

# react16版本后生命周期的改动
这些生命周期方法经常被误解和滥用所以16之后变成unsafe
componentWillMount
componentWillReceiveProps
componentWillUpdate

# componentWillReceiveProps

在componentWillReceiveProps中想作任何变更最好都将两个状态进行比较，假如状态有异才执行下一步。不然容易造成组件的多次渲染
[原文链接](https://juejin.cn/post/6844903539391594509)

# componentWillMount
componentWillMount 在 render 之前被调用。故在该方法中进行同步 setState 不会触发重新渲染。
这也是是唯一在服务器端渲染调用的生命周期钩子。是否可以使用setState(): 可以但不建议 。
React生命周期ComponentWillMount可否使用ajax,为什么？
答：如果要强行使用Ajax的话是可以的，但不推荐。原因：
（1）可能DOM还未准备好接收数据导致错误
（2）这样不利于同构（SSR与前端公用一套代码），因为后端无法使用传统Ajax。
（3）最好将Ajax写在ComponentDidMount，因为服务端不会执行这一函数，有利于同构。当然，强行使用fetch也是可行的。
在 componentWillMount 中获取数据可以避免第一次渲染为空的状态。实际上，这是不对的，因为 React 总是在 componentWillMount 之后立即执行 render。如果在 componentWillMount 触发时数据不可用，那么第一次 render 仍然会显示加载的状态，而不管你在哪里初始化获取数据。这就是为什么在绝大多数情况下，将获取数据移到 componentWillMount 没有明显效果的原因。

在componentWillMount订阅了外部事件，这可能导致服务器渲染（永远不会调用 componentWillUnmount）和异步渲染（在渲染完成之前可能被中断，导致不调用 componentWillUnmount）的内存泄漏。人们通常认为 componentWillMount 和 componentWillUnmount 是成对出现的，但这并不能保证。只有调用了 componentDidMount 之后，React 才能保证稍后调用 componentWillUnmount 进行清理。

例如：页面展示2
```
import React from 'react'
export default class Child extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            number: 1,
        };
    }

    componentWillMount(){
        this.setState({number: this.state.number + 1})
    }

    render() {
        const { number } = this.state;
        return (
            <div>
                <div>number is: {number}</div>
            </div>
        );
    }
}
```
# componentWillUpdate
在异步模式下使用 componentWillUpdate 都是不安全的，因为外部回调可能会在一次更新中被多次调用。相反，应该使用 componentDidUpdate 生命周期，因为它保证每次更新只调用一次。

# componentWillReceiveProps 
可能在一次更新中被多次调用。因此，避免在此方法中产生副作用非常重要。相反，应该使用 componentDidUpdate，因为它保证每次更新只调用一次。将副作用操作放到componentDidUpdate，保证每次更新只调用一次，而不是不管是不是更新完成了，进行了多次调用，出现卡死等问题。

# getSnapshotBeforeUpdate
在最近一次渲染输出（提交到 DOM 节点）之前调用。它使得组件能在发生更改之前从 DOM 中捕获一些信息（例如，滚动位置）。此生命周期的任何返回值将作为参数传递给 componentDidUpdate()。应返回 snapshot 的值（或 null）。
```
class ScrollingList extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    // 我们是否在 list 中添加新的 items ？
    // 捕获滚动位置以便我们稍后调整滚动位置。
    if (prevProps.list.length < this.props.list.length) {
      const list = this.listRef.current;
      return list.scrollHeight - list.scrollTop;
    }
    return null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // 如果我们 snapshot 有值，说明我们刚刚添加了新的 items，
    // 调整滚动位置使得这些新 items 不会将旧的 items 推出视图。
    //（这里的 snapshot 是 getSnapshotBeforeUpdate 的返回值）
    if (snapshot !== null) {
      const list = this.listRef.current;
      list.scrollTop = list.scrollHeight - snapshot;
    }
  }

  render() {
    return (
      <div ref={this.listRef}>{/* ...contents... */}</div>
    );
  }
}
```

挂载
当组件实例被创建并插入 DOM 中时，其生命周期调用顺序如下：

constructor()
static getDerivedStateFromProps()
render()
componentDidMount()

更新
当组件的 props 或 state 发生变化时会触发更新。组件更新的生命周期调用顺序如下：

static getDerivedStateFromProps()
shouldComponentUpdate()
render()
getSnapshotBeforeUpdate()
componentDidUpdate()

卸载
当组件从 DOM 中移除时会调用如下方法：

componentWillUnmount()

错误处理
当渲染过程，生命周期，或子组件的构造函数中抛出错误时，会调用如下方法：

static getDerivedStateFromError()
componentDidCatch()



