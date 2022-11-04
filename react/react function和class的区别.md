[Dan函数组件和class组件的区别](https://overreacted.io/zh-hans/how-are-function-components-different-from-classes/)

# function 和 class 的区别

对于一个场景，你将看到一个当前账号选择框以及两个上面 ProfilePage 的实现 —— 每个都渲染了一个 Follow 按钮。

尝试按照以下顺序来分别使用这两个按钮：

* 点击 其中某一个 Follow 按钮。
* 在3秒内 切换 选中的账号。
* 查看 弹出的文本。
* 你将看到一个奇特的区别:
[示例代码](https://codesandbox.io/s/pjqnl16lm7?file=/src/ProfilePageFunction.js)
当使用 函数式组件 实现的 ProfilePage, 当前账号是 Dan 时点击 Follow 按钮，然后立马切换当前账号到 Sophie，弹出的文本将依旧是 'Followed Dan'。当使用 类组件 实现的 ProfilePage, 弹出的文本将是 'Followed Sophie'：

在这个例子中，第一个行为是正确的。如果我关注一个人，然后导航到了另一个人的账号，我的组件不应该混淆我关注了谁。 在这里，类组件的实现很明显是错误的。

这个类方法从 this.props.user 中读取数据。在 React 中 Props 是不可变(immutable)的，所以他们永远不会改变。然而，this是，而且永远是，可变(mutable)的。事实上，这就是类组件 this 存在的意义。React本身会随着时间的推移而改变，以便你可以在渲染方法以及生命周期方法中得到最新的实例。如果函数组件不存在如何解决

```
class ProfilePage extends React.Component {
  showMessage = (user) => {
    alert('Followed ' + user);
  };

  handleClick = () => {
    const {user} = this.props;
    setTimeout(() => this.showMessage(user), 3000);
  };

  render() {
    return <button onClick={this.handleClick}>Follow</button>;
  }
}
```

# 对副作用的理解不同了

hooks是函数式编程理念的诠释，将之前一个class组件维护的多个状态拆分，可以将一个相同的state改变产生的副作用放到相同的hooks中，这样可以集中更新。不仅可以使代码更好维护，更可以在react做diff算法过程中优化性能。

# 使用起来要注意的事情
class组件中由于this这个引用对象的存在可以使react在异步中也能正确拿到新的状态值

但是hooks是每次渲染都会重新创建新的函数。所以导致hooks在异步中如果不通过ref或者函数调用的方式是拿不到最新状态的，只能拿到属于那一次渲染的状态。同时使用useReducer也可以拿到新的状态，因为useReducer的状态是脱离每次函数的渲染的。reducer在每次渲染执行时只是记住那一次渲染的操作。state是独立于渲染之外的对象。

# react是自顶向下更新的，对于hooks和class组件的更新渲染有不同的优化方案

useCallback & useMemo React.memo（传回调更新）

pureComponent & shouldComponentUpdate

对于useCallback的使用其实对于渲染开销不大的组件。如果滥用useCallback可能对于浏览器来说创建闭包销毁闭包的性能开销更大

# 一些api的不同
context啊 useReducer啊
