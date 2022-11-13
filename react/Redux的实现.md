[原文链接](https://juejin.cn/post/7110853074033311752)

# 基础概念

## createStore
核心其实就是在 createStore 中通过闭包的形式访问内部的 state 从而进行一系列操作。

createStore(reducer, [preloadedState], enhancer)
createStore 通过传入三个参数创建当前应用中的唯一 store 实例对象，注意它是全局唯一单例。
后续我们可以通过 createStore 返回的 dispatch、subscribe、getState 等方法对于 store 中存放的数据进行增删改查。

我们来看看所谓传入的三个参数：

### reducer

reducer 作为第一个参数，它必须是一个函数。

相信有过 redux 开发经验的同学，对于 reducer 并不陌生。比如一个常见的 reducer 就像下面这个样子：

```
import { Reducer } from "redux"

interface NameReducerState {
  name: string
}

interface NameReducerAction {
  type: typeof CHANGE_NAME;
  [payload: string]: string;
}

const initialState = {
  name: ''
}

const CHANGE_NAME = 'change'
export const changeAction = (payload: string) => ({ type: CHANGE_NAME, payload })

const name: Reducer<NameReducerState, NameReducerAction> = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_NAME:
      return { name: action.payload }
    default:
      return state
  }
}

export default name
```
上边的 name 函数就是一个 reducer 函数，这个函数接受两个参数分别为

* state 这个参数表示当前 reducer 中旧的状态。
* action 它表示本次处理的动作，它必须拥有 type 属性。在reducer函数执行时会匹配 action.type 执行相关逻辑（当然，在 action 对象中也可以传递一些额外的属性作为本次reducer执行时的参数）。

需要额外注意的是，在 redux 中要求每个 reducer 函数中匹配到对应的 action 时需要返回一个全新的对象（两个对象拥有完全不同的内存空间地址）。


### preloadedState

preloadedState 是一个可选参数，它表示通过 createStore 创建 store 时传递给 store 中的 state 的初始值。
简单来说，默认情况下通过 createStore 不传入 preloadedState 时，当前 store 中的 state 值会是通过传入的 reducer 中第一个参数 initizalState 的默认值来创建的。

```
function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case 'add':
      return { number: state.number + 1 }
    default:
      return state
  }
}

// 不传入preloadedState
const store = createStore(reducer)

console.log(store.getState()) // { number: 1 }

// ----此处分割线----


function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case 'add':
      return { number: state.number + 1 }
    default:
      return state
  }
}

const store = createStore(reducer, { number: 100 })

console.log(store.getState()) // { number: 100 }
```
相信通过上边两个例子大家已经明显能感受到 preloadedState 代表的含义，通过在进行服务端同构应用时这个参数会起到很大的作用。

### enhancer

enhancer 直译过来意味增强剂，其实也就是 middleware 的作用。
我们可以利用 enhancer 参数扩展 redux 对于 store 接口的改变，让 redux 支持更多各种各样的功能。
当前，关于 enhancer 在文章的后续我们会详细深入。本质上它仍然通过一组高阶函数（HOC）来拓展现有 redux 中 store 功能的辅助中间件函数。

## 实现
* 输入

首先，createStore 方法会接受三个参数。上边我们分析过分别为 reducer、preloadedState 以及 enhancer 。
关于 enhancer 我们现在暂时先抛开它，后续我们会详细详细就这个点来展开。

* 输出
createStore 返回的 store 中会返回以下几个方法：

**dispatch** 是一个方法，修改 store 中的 state 值的唯一途径就是通过调用 dispatch 方法匹配 dispatch 传入的 type 字段从而执行对应匹配 reducer 函数中的逻辑修改 state 。

```
function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case 'add':
      return { number: state.number + 1 }
    default:
      return state
  }
}

const store = createStore(reducer, { number: 100 })

console.log(store.getState()) // { number: 100 }

// ---后续代码会省略上述创建store逻辑-----

// 派发dispatch 修改store
store.dispatch({ type: 'add' })

console.log(store.getState()) // { number: 101 }
```
**subscribe** 方法会接受一个函数作为参数，每当通过 dispatch 派发 Action 修改 store 中的 state 状态时，subscribe 方法中传入的 callback 会依次执行。

并且在传入的 listener callback 中可以通过 store.getState() 获得修改后最新的 state 。

需要注意的是 subscriptions 在每次进行 dispatch 之前都会针对于旧的 subscriptions 保存一份快照。

这也就意味着当 subscriptions 中某个 subscription 正在执行时去掉 or 订阅新的 subscription 对于当前 dispatch 并不会有任何影响。

**getState**

getState 方法正如它定义的名字一般，它会返回应用当前的 state 树。

**replaceReducer**

replaceReducer 方法接受一个 reducer 作为参数，它会替换 store 当前用来计算 state 的 reducer。

```

/**
 * 创建Store
 * @param reducer  传入的reducer
 * @param loadedState 初始化的state
 * @returns 
 */
function createStore(reducer,loadedState) {
  // reducer 必须是一个函数
  if (typeof reducer !== 'function') {
    throw new Error(
      `Expected the root reducer to be a function. `
    )
  }

  // 初始化的state
  let currentState = loadedState
  // 初始化的reducer
  let currentReducer = reducer
  // 初始化的listeners
  let currentListeners = []
  // listeners 的快照副本
  let nextListeners = currentListeners
  // 是否正在dispatch
  let isDispatching = false

  // ...

  /**
   * 派发action触发reducer
   */
  function dispatch(action) {
    // action 必须是一个纯对象
    if (!isPlainObject(action)) {
      throw new Error(`You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
      )
    }

    // action 必须存在一个 type 属性
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
      )
    }

    // 如果当前正在dispatching状态 报错
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      isDispatching = true
      // 调用reducer传入的currentState和action
      // reducer的返回值赋给currentState
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // 当reducer执行完毕后 通知订阅的listeners 依次进行执行
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    // dispatch完成返回action
    return action
  }
  // 之后调用传入的 currentReducer 函数，传入旧的 state 以及传入的 action 执行 reducer ，将 reducer 中返回的结果重新赋值给 currentState。
    其实 dispatch 的逻辑非常简单，完全就是利用闭包的效果。传入 store 内部维护的 currentState 以及传入的 action 作为参数调用 createStore 时传入的 reducer 函数获得返回值更新 currentState 。
    同时在 action 执行完毕后，遍历 nextListeners 中订阅的函数，依次执行 nextListeners 中的函数。



  /**
   * 订阅store中action的变化
   */
  /**
   * 订阅store中action的变化
   */
  function subscribe(listener: () => void) {
    // listener 必须是一个函数
    if (typeof listener !== 'function') {
      throw new Error(
        `Expected the listener to be a function. Instead.`
      )
    }
    // 如果当前正在执行 reducer 过程中，不允许进行额外的订阅
    if (isDispatching) {
      throw new Error()
    }

    // 标记当前listener已经被订阅了
    let isSubscribed = true

    // 确保listeners正确性
    ensureCanMutateNextListeners()
    // 为下一次的listeners中添加传入的listener
    nextListeners.push(listener)

    // 返回取消订阅的函数
    return function unsubscribe() {
      // 如果当前listener已经被取消（未订阅状态，那么之际返回）
      if (!isSubscribed) {
        return
      }
      // 当前如果是reducer正在执行的过程，取消订阅直接报错
      // 换言之，如果在reducer函数执行中调用取消订阅，那么直接报错
      if (isDispatching) {
          // 直接报错
          throw new Error()
      }

      // 标记当前已经取消订阅
      isSubscribed = false

      // 同样确保listeners正确性
      ensureCanMutateNextListeners()
      // 逻辑很简单了利用 indexOf + splice 删除当前订阅的listener
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }
  /**
   * 获取State
   */
  function getState() {
    return currentState
  }

  /**
   * 替换store中的reducer
   * @param reducer 需要替换的reducer
   */
  function replaceReducer(reducer) {

  }

  return {
    dispatch,
    replaceReducer,
    getState,
    subscribe
  }
}

export default createStore
```

