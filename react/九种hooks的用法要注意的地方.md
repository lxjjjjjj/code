# useState
## 产生闭包的问题
```
import React, { useState } from 'react'

const DemoState: React.FC = () => {
  const [count, setCount] = useState(0)

  const handleClickBtn = () => {
    setCount(count + 1)
  }

  const handleAlert = () => {
    setTimeout(() => {
      alert(count) // 3s后输出的值是0 
      // 当 DemoState 函数每次运行我们都称他为每一次渲染，每一次渲染函数内部都拥有自己独立的 props 和 state
      // 当在 jsx 中调用代码中的 state 进行渲染时，每一次渲染都会获得各自渲染作用域内的 props 和 state 。
    }, 3000)
  }

  return <div>
    <div style={{ margin: '20px' }}>
      <button onClick={handleClickBtn}>Click Me !</button>
    </div>
    <p onClick={handleAlert}>This is Count: {count}</p>
  </div>
}

export {
  DemoState
}
```
## 批量更新原则
[原文链接](https://juejin.cn/post/7000742887583383583)
state 的变化 React 内部遵循的是批量更新原则。所谓异步批量是指在一次页面更新中如果涉及多次 state 修改时，会合并多次 state 修改的结果得到最终结果从而进行一次页面更新。react什么时候会合并多次更新，什么时候并不会合并多次更新。

1.凡是React可以管控的地方，他就是异步批量更新。比如事件函数，生命周期函数中，组件内部同步代码。
2.凡是React不能管控的地方，就是同步批量更新。比如setTimeout,setInterval,源生DOM事件中，包括Promise中都是同步批量更新。
```
import React from 'react'
class Counter extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        number: 0,
      };
    }
    // 在事件处理函数中setState的调用会批量异步执行
    // 但是加了setTimeout之后，更新就是同步的 会一次加两个数
    // 但是如果不加异步的话 就是虽然执行了两次相加操作 但是只会加一次数
    handleClick = (event) => {
        // setTimeout(() => {
        //     this.setState({ number: this.state.number + 1 });
        //     console.log(this.state); // 1
        //     this.setState({ number: this.state.number + 1 });
        //     console.log(this.state); // 2
        // });
        Promise.resolve().then(() => {
			this.setState({ number: this.state.number + 1 });
			console.log(this.state); // 1
			this.setState({ number: this.state.number + 1 });
			console.log(this.state); // 2
		});
        // 这样能拿到值的原因是因为state是个队列 每次更新的时候都会把上一次的值传给一下个更新函数，所以能拿到上一次的值
        this.setState((state) => {
            console.log(state.number, 'number'); // 上一次是1
            return { number: state.number + 1 };
        })
        console.log(this.state); // 1
        this.setState((state) => {
            console.log(state.number, 'number'); // 上一次是1
            return { number: state.number + 1 };
        });
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
const element = <Counter></Counter>;
ReactDOM.render(element, document.getElementById('root'));

```
函数式这么写也拿不到新的值
```
function Counter(){
    const [number, setNumber] = useState(0)
    const handleClick = () => {
        setNumber(number + 1)
        console.log('number',number)
        setNumber(number + 1)
        console.log('number',number)
    }
    return (
        <div>
            <p>{number}</p>
            <button onClick={handleClick}>+</button>
        </div>
        );
}
```
在 React 18 中通过 createRoot 中对外部事件处理程序进行批量处理，换句话说最新的 React 中关于 setTimeout、setInterval 等不能管控的地方都变为了批量更新。


# useEffect

## 当useEffect中有setInterval这种函数(延迟)需要获取到新的值，就需要给useEffect新增依赖。如果不写依赖就获取不到新的count值[对应例子的eight]class中就不存在因为class的this的引用对象会变，除了加依赖，也可以使用useRef拿到新的值
```
useEffect(function() {
    const id = setInterval(function log() {
      console.log(`Count: ${count}`);
    }, 2000);
    return () => clearInterval(id);
  }, [count]);
```
## useEffect清理副作用
```
useEffect(() => {
    if (increase) {
      const id = setInterval(() => {
        setCount(count => count + 1)
      }, 1000);
      return () => clearInterval(id);
    }
  }, [increase]);
```

# useMemo & useCallback 配合 React.memo

非常常见的就是，父组件的更新引起子组件不必要的更新，因为父组件接收了一个参数，那个参数都是每次父组件渲染都会重新生成的参数，可以使用useMemo和useCallback和React.memo来避免不必要的渲染.[对应例子的three]

```
import React from 'react'
import ComponentThree from './ComponentThree'
export default function ParentThree (){
  const [ number , setNumber  ] = React.useState(0)
  const [ type , setType ] = React.useState('react')

  // 每次点击更改number值 都会导致子组件重新渲染 因为子组件上有个changeName函数 
  // 在父组件每次更新之后都会生成一个新的函数
  // 所以导致子组件会更新
  const changeName = React.useCallback((name) => {
      setType(name)
  },[])
  // 用 useCallback对changeName函数进行缓存，在每一次 Home 组件执行，
  // 只要useCallback中deps没有变，changeName内存空间还指向原来的函数，
  // 这样PureComponent/React.memo浅比较就会发现是相同changeName，从而不渲染组件，至此案件已破
  return <div>
      <span>{ number }</span><br/>
      <button onClick={ ()=> setNumber(number + 1) } >change number</button>
      <ComponentThree type={type}  changeType={ changeName } name="alien"  />
  </div>
}
```
## 关于性能优化
关于 useCallback 以及 useMemo 这两个 Hook 都是 React 提供给开发者作为性能优化手段的方法。
但是大多数时候，你不需要考虑去优化不必要的重新渲染。 React 是非常快的，我能想到你可以利用时间去做很多事情，比起做这些类似的优化要好得多。
对于 useCallback 和 useMemo 来说，我个人认为不合理的利用这两个 Hook 不仅仅会使代码更加复杂，同时有可能会通过调用内置的 Hook 防止依赖项和 memoized 的值被垃圾回收从而导致性能变差。
如果说，有些情况下比如交互特别复杂的图表、动画之类，使用这两个 Hook 可以使你获得了必要的性能收益，那么这些成本都是值得承担的，但最好使用之前先测量一下。

官方文档指出，[无需担心创建函数会导致性能问题](https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render)。我们上述提供的例子仅仅是为了向大家展示它们的用法，实际场景下非常不建议这样使用。


# useContext
Context 提供了一种在组件之间共享此类值的方式，而不必显式地通过组件树的逐层传递 props。

可以通过 React.createContext 创建 context 对象，在跟组件中通过 Context.Provider 的 value 属性进行传递 username ，从而在 Function Component 中使用 useContext(Context) 获取对应的值。


# useReducer
在useEffect中调用useReducer可以把依赖去掉，它可以把更新逻辑和描述发生了什么分开。reducer调用也不是在effect里。当你dispatch的时候，React只是记住了action - 它会在下一次渲染中再次调用reducer。
```
import React from 'react'
function Counter({ step }) {
    const [count, dispatch] = React.useReducer(reducer, 0);
  
    function reducer(state, action) {
      if (action.type === 'tick') {
        return state + step;
      } else {
        throw new Error();
      }
    }
    React.useEffect(() => {
      const id = setInterval(() => {
        dispatch({ type: 'tick' });
      }, 1000);
      return () => clearInterval(id);
    }, []);
  
    return <h1>{count}</h1>;
  }
  export default Counter
```
## 什么时候用useState,什么时候用useReducer呢

如果某个 state 下存在很多操作状态，每个操作都有很多逻辑，对于这样复杂的状态，使用 useState 拥有单独的功能管理相比 reducer 中单个函数中的多个不同动作也许会更加清晰一些。关于状态管理究竟是使用 useState 还是 useReducer 绝大多数文章会告诉你 useReducer 适用于复杂的状态逻辑。

### 使用 useReducer 还能给那些会触发深更新的组件做性能优化，因为你可以向子组件传递 dispatch 而不是回调函数
在某些场景下我们通常会将函数作为 props 传递到 child component 中去，这样的话，每次父组件 re-render 时即使我们并没有修改当作 props 的函数，子组件也会重新渲染。
```
// 父组件
import React from 'react';
import ChildComponent from './child';

function ParentComponent() {
    const [count, dispatch] = React.useReducer(reducer, 0);
  
    function reducer(state, action) {
      if (action.type === 'tick') {
        return state + 3;
      } else {
        throw new Error();
      }
    }
    const handleClick = () => {
        dispatch({ type: 'tick' })
    }
  return (
    <div>
      <h3>Hello This is Parent Component!</h3>
      <p>ParentCount: {count}</p>
      <button onClick={handleClick}>Click Me!</button>
      <br />
      <ChildComponent callback={dispatch} />
    </div>
  );
}

export default ParentComponent;

// 子组件
import React, { useEffect } from 'react';
const ChildComponent = ({ callback }) => {
  useEffect(() => {
    alert('child re-render');
  }, [callback]);

  return (
    <>
      <h1>Hello This is Child Component</h1>
    </>
  );
};

export default ChildComponent;
```
# useRef
useRef 会在所有的 render 中保持对返回值的唯一引用。因为所有对ref的赋值和取值拿到的都是最终的状态，并不会因为不同的 render 中存在不同的隔离。
```

```
# useImperativeHandle
useImperativeHandle 这个 Hook 很多同学日常可能用的不是很多，但是在某些情况下它会帮助我们实现一些意向不到的效果。
```
useImperativeHandle(ref, createHandle, [deps])
ref 表示需要被赋值的 ref 对象。
createHandle 函数的返回值作为 ref.current 的值。
deps 依赖数组，依赖发生变化会重新执行 createHandle 函数。
```
useImperativeHandle  可以让你在使用 ref 时自定义暴露给父组件的实例值。在大多数情况下，应当避免使用 ref 这样的命令式代码。useImperativeHandle 应当与 forwardRef 一起使用。

这个api可以让父组件调用子组件暴露出来的方法

# useLayoutEffect
useLayoutEffect 的区别在于它会在所有的 DOM 变更之后同步调用 effect。

# class的bind this
JSX模版的事件需要bind this执行 才能正确输出e.target，因为React采用的是事件合成机制，onChange并不是绑定真的change事件，React底层帮我们处理了事件源

# 实现一个定时器hook
```
// 接受两个参数
// callback 是定时器开始进行的函数
// delay 是间隔时间

// 实现一个定时器hooks需要满足的条件如下

// 1.多个定时器存在时，无论引用定时器的组件渲染多少次，每个定时器都可以维持对自己'此刻状态'的引用
// 2.点击暂停计时器之后点击继续，可以继续执行callback
// 2.在run函数中开始定时器计时
// 3.调用cancel函数，取消定时器
import { useCallback, useState } from 'react';
export const Index = (props) => {
    const [count,setCount] = useState(0)
    const [countTwo,setCountTwo] = useState(0)
    const {run:RunOne ,cancel:CancelOne} = useSetInterval(()=>setCount(count=>count+1),1000)
    const {run:RunTwo ,cancel:CancelTwo} = useSetInterval(()=>setCountTwo(countTwo=>countTwo+2),1000)
    return(
        <>
          <button onClick={RunOne}>第一个button</button>
          <button onClick={CancelOne}>取消第一个</button>
          <div>{count}</div>
          <button onClick={RunTwo}>第二个button</button>
          <button onClick={CancelTwo}>取消第二个</button>
          <div>{countTwo}</div>
        </>
    )
  }



  const useSetInterval = (callback,delay) => {
    let timer = 0 // 每个useSetInterval函数都有自己的timer变量
    const run = useCallback(()=>{
      timer = setInterval(callback.current,delay)
    },[]) // 利用闭包保存定时器无论渲染多少次都不变
    const cancel = useCallback(() => {
      clearInterval(timer)
    },[]) //  利用闭包确保清除的是相对应的定时器
    return { run, cancel}
  }
  export default useSetInterval
```
# react hooks总结

每次react hooks渲染都会有自己的事件处理函数、自己的props、state、effects、

useEffect中使用函数，最好将函数写在useEffect中或者把函数干脆独立在react组件外部

```
import React, { useState, useEffect } from "react";
import axios from 'axios';

function SearchResults() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState('react');

  useEffect(() => {
    function getFetchUrl() {
      return 'https://hn.algolia.com/api/v1/search?query=' + query;
    }

    async function fetchData() {
      const result = await axios(getFetchUrl());
      setData(result.data);
    }

    fetchData();
  }, [query]); // 添加依赖
  // 有时候你可能不想把函数移入effect里。比如，组件内有几个effect使用了相同的函数，
  // 你不想在每个effect里复制黏贴一遍这个逻辑。也或许这个函数是一个prop
  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>
        {data.hits.map(item => (
          <li key={item.objectID}>
            <a href={item.url}>{item.title}</a>
          </li>
        ))}
      </ul>
    </>
  );
}

export default SearchResults


function SearchResultsmore() {
    function getFetchUrl(query) {
      return 'https://hn.algolia.com/api/v1/search?query=' + query;
    }
  
    useEffect(() => {
      const url = getFetchUrl('react');
      // ... Fetch data and do something ...
    }, []); // 🔴 Missing dep: getFetchUrl
  
    useEffect(() => {
      const url = getFetchUrl('redux');
      // ... Fetch data and do something ...
    }, []); // 🔴 Missing dep: getFetchUrl
  
    // ...
  }
  // 在这个例子中，你可能不想把getFetchUrl 移到effects中，因为你想复用逻辑。
  // 另一方面，如果你对依赖很“诚实”，你可能会掉到陷阱里。
  // 我们的两个effects都依赖getFetchUrl，而它每次渲染都不同，所以我们的依赖数组会变得无用
  // 一个可能的解决办法是把getFetchUrl从依赖中去掉。但是，我不认为这是好的解决方式。
  // 这会使我们后面对数据流的改变很难被发现从而忘记去处理。这会导致类似于上面“定时器不更新值”的问题。
  // 相反的，我们有两个更简单的解决办法。
  // 第一个， 如果一个函数没有使用组件内的任何值，
  // 你应该把它提到组件外面去定义，然后就可以自由地在effects中使用：
  // ✅ Not affected by the data flow
  function getFetchUrl(query) {
    return 'https://hn.algolia.com/api/v1/search?query=' + query;
  }
  
  function SearchResultsTwo() {
    useEffect(() => {
      const url = getFetchUrl('react');
      // ... Fetch data and do something ...
    }, []); // ✅ Deps are OK
  
    useEffect(() => {
      const url = getFetchUrl('redux');
      // ... Fetch data and do something ...
    }, []); // ✅ Deps are OK
  
    // ...
  }
  // 你不再需要把它设为依赖，因为它们不在渲染范围内，因此不会被数据流影响。
  // 它不可能突然意外地依赖于props或state。
  // 跟数据流没关系的请求函数或者别的函数应该定义到函数组件外
  

  // 或者把函数写成useCallback函数

  function SearchResultsThree() {
    // ✅ Preserves identity when its own deps are the same
    const getFetchUrl = React.useCallback((query) => {
      return 'https://hn.algolia.com/api/v1/search?query=' + query;
    }, []);  
    // ✅ Callback deps are OK
  
    useEffect(() => {
      const url = getFetchUrl('react');
      // ... Fetch data and do something ...
    }, [getFetchUrl]); // ✅ Effect deps are OK
  
    useEffect(() => {
      const url = getFetchUrl('redux');
      // ... Fetch data and do something ...
    }, [getFetchUrl]); // ✅ Effect deps are OK
  
    // ...
  }
  // useCallback本质上是添加了一层依赖检查。它以另一种方式解决了问题 - 
  // 我们使函数本身只在需要的时候才改变，而不是去掉对函数的依赖。

  // 我们很快发现它遗漏了query依赖：

    function SearchResultsFour() {
        const [query, setQuery] = useState('react');
        const getFetchUrl = React.useCallback(() => { // No query argument
            return 'https://hn.algolia.com/api/v1/search?query=' + query;
        }, []); // 🔴 Missing dep: query
        // ...
    }
    // 我们要感谢useCallback，因为如果query 保持不变，getFetchUrl也会保持不变，
    // 我们的effect也不会重新运行。但是如果query修改了，getFetchUrl也会随之改变，
    // 因此会重新请求数据。这就像你在Excel里修改了一个单元格的值，另一个使用它的单元格会自动重新计算一样。

    // 我想强调的是，到处使用useCallback是件挺笨拙的事。
    // 当我们需要将函数传递下去并且函数会在子组件的effect中被调用的时候，
    // useCallback 是很好的技巧且非常有用。或者你想试图减少对子组件的记忆负担，
    // 也不妨一试。context的dispatch传递 https://reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down

```