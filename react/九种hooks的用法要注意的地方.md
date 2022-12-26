[原文链接](https://juejin.cn/post/7118937685653192735)
[原文链接](https://juejin.cn/post/7146107198215553055)
# useState
[闭包解析](https://juejin.cn/post/7164694515587448863)
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
① 在函数组件一次执行上下文中，state 的值是固定不变的。
② 如果两次 dispatchAction 传入相同的 state 值，那么组件就不会更新。
```
export default function Index(){
    const [ state  , dispatchState ] = useState({ name:'alien' })
    const  handleClick = ()=>{ // 点击按钮，视图没有更新。
        state.name = 'Alien'
        dispatchState(state) // 直接改变 `state`，在内存中指向的地址相同。
    }
    return <div>
         <span> { state.name }</span>
        <button onClick={ handleClick }  >changeName++</button>
    </div>
}
```
③ 当触发 dispatchAction 在当前执行上下文中获取不到最新的 state, 只有再下一次组件 rerender 中才能获取到。

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

**常见用来缓存useEffect的依赖和缓存子组件props的值**

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
[原文链接](https://juejin.cn/post/6847902217261809671#heading-3)
关于 useCallback 以及 useMemo 这两个 Hook 都是 React 提供给开发者作为性能优化手段的方法。
useCallback的设计初衷并非解决组件内部函数多次创建的问题，而是减少子组件的不必要重复渲染。useCallback用的越多，负重越多。站在 javascript 的角度，当组件刷新时，未被useCallback包裹的方法将被垃圾回收并重新定义，但被useCallback所制造的闭包将保持对回调函数和依赖项的引用。
如果说，有些情况下比如交互特别复杂的图表、动画之类，使用这两个 Hook 可以使你获得了必要的性能收益，那么这些成本都是值得承担的，但最好使用之前先测量一下。

官方文档指出，[无需担心创建函数会导致性能问题](https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render)。

useMemo只有当创建行为本身会产生高昂的开销（比如计算上千次才会生成变量值），才有必要使用useMemo


# useContext
Context 提供了一种在组件之间共享此类值的方式，而不必显式地通过组件树的逐层传递 props。

可以通过 React.createContext 创建 context 对象，在跟组件中通过 Context.Provider 的 value 属性进行传递 username ，从而在 Function Component 中使用 useContext(Context) 获取对应的值。

但是useContext的值变化，用到这个值的任何组件都会发生更新渲染，所以应当封装一个Provider组件。这样避免无用多余的渲染

这样APP是一个无状态的组件，那么Tip不会根据每次context的state的变化而变化
```

function Counter() {
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
    </>
  );
}
function reducer(state, action) {
    switch (action.type) {
      case "increment":
        return { count: state.count + 1 };
      case "decrement":
        return { count: state.count - 1 };
      default:
        throw new Error();
    }
  }
function Provider(props) {
  const initialState = { count: 0 };
  const ContainerContext = createContext(initialState);
  const [state, dispatch] = useReducer(reducer, initialState);
  // 当Provider存在父组件，那么父组件的重新渲染会带动Provider的渲染，那么Provider传的参数值也会变化，也会导致使用了context值的组件更新
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <ContainerContext.Provider value={{ state, dispatch }}>
      {props.children}
    </ContainerContext.Provider>
  );
}

const App = () => {
  return (
    <Provider>
      <Counter />
    </Provider>
    <Tip />
  );
};

```
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
useRef 会在所有的 render 中保持对返回值的唯一引用。因为所有对ref的赋值和取值拿到的都是最终的状态，并不会因为不同的 render 中存在不同的隔离。useRef的值改变并不会造成页面重新渲染。
# useImperativeHandle
useImperativeHandle 这个 Hook 很多同学日常可能用的不是很多，但是在某些情况下它会帮助我们实现一些意向不到的效果。
```
useImperativeHandle(ref, createHandle, [deps])
ref 表示需要被赋值的 ref 对象。
createHandle 函数的返回值作为 ref.current 的值。
deps 依赖数组，依赖发生变化会重新执行 createHandle 函数。
```
useImperativeHandle  可以让你在使用 ref 时自定义暴露给父组件的实例值。在大多数情况下，应当避免使用 ref 这样的命令式代码。useImperativeHandle 应当与 forwardRef 一起使用。

相当于子组件向父组件输出本身实例或者DOM元素。而利用useImperativeHandle子组件可以向父组件输出任意数据。

这个api可以让父组件调用子组件暴露出来的方法
```
// FancyInput组件作为子组件
const FancyInput = React.forwardRef(function FancyInput(props, ref) {
  const inputRef = useRef();

  // 命令式的给`ref.current`赋值个对象
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus()
    }
  }));
  
  return <input ref={inputRef} ... />
})

// Example组件作为父组件
function Example() {
  const fancyInputRef = useRef()

  const focus = () => {
    fancyInputRef.current.focus()
  }

  return (
    <>
      <FancyInput ref={fancyInputRef} />
    </>
  )
}
```
**先学习一下React.forwardRef**
React forwardRef是一种允许父组件向下（即“转发”）引用传递给它们的子组件的方法。在 React 中使用 forwardRef 可以让父组件外的组件获取对父组件内部子组件的dom引用

* 转发 refs 到 DOM 组件
* 在高阶组件中转发引用
```
React.forwardRef接受渲染函数作为参数。React 将使用props和ref作为两个参数调用此函数。这个函数应该返回一个 React 节点。
const FancyButton = React.forwardRef((props, ref) => (
  <button ref={ref} className="FancyButton">
    {props.children}
  </button>
));

// You can now get a ref directly to the DOM button:
const ref = React.createRef();
<FancyButton ref={ref}>Click me!</FancyButton>;
在上面的示例中，Reactref将给定的<FancyButton ref={ref}>元素作为第二个参数传递给调用中的渲染函数React.forwardRef。此渲染函数将 传递ref给<button ref={ref}>元素。

因此，React 附加 ref 后，ref.current将直接指向<button>DOM 元素实例。
```
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