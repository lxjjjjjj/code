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


[原理图](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/43a13b42de6846248123dce11a3a4df1~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image?)

# 基础版本createStore
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
  // 之后调用传入的 currentReducer 函数，传入旧的 state 以及传入的 action 执行 reducer ，将 reducer 中返回的结果重新赋值给 currentState。其实 dispatch 的逻辑非常简单，完全就是利用闭包的效果。传入 store 内部维护的 currentState 以及传入的 action 作为参数调用 createStore 时传入的 reducer 函数获得返回值更新currentState 。同时在 action 执行完毕后，遍历 nextListeners 中订阅的函数，依次执行 nextListeners 中的函数。

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
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error(
        `Expected the nextReducer to be a function. Instead, received: '}`
      )
    }

    currentReducer = nextReducer

    dispatch({ type: '@redux/INIT$`' })

    return {
      dispatch,
      replaceReducer,
      getState,
      subscribe
    }
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

## dispatch实现总结

其实可以看到 dispatch 的逻辑非常清晰的，首先 dispatch 函数中进行了参数校验。
传入的action必须是一个对象，并且必须具有 type 属性，同时当前 store 中的 isDispatching 必须为 false 。
当满足边界条件后，首先会将 isDispatching 重置为 true 的状态。
之后调用传入的 currentReducer 函数，传入旧的 state 以及传入的 action 执行 reducer ，将 reducer 中返回的结果重新赋值给 currentState。
其实 dispatch 的逻辑非常简单，完全就是利用闭包的效果。传入 store 内部维护的 currentState 以及传入的 action 作为参数调用 createStore 时传入的 reducer 函数获得返回值更新 currentState 。
同时在 action 执行完毕后，遍历 nextListeners 中订阅的函数，依次执行 nextListeners 中的函数。

## subscribe 方法实现总结

本质上 subscribe 方法通过操作 nextListeners 数组从而控制订阅的 listeners 。
不过，细心的同学可能会发现对应的 ensureCanMutateNextListeners 并没有实现。我们来看看这个方法究竟是在做了什么：
```
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }
```
上边在进行分析时，我们提到过:

需要注意的是 subscriptions 在每次进行 dispatch 之前都会针对于旧的 subscriptions 保存一份快照。


这也就意味着当 subscriptions 中某个 subscription 正在执行时去掉 or 订阅新的 subscription 对于当前 dispatch 并不会有任何影响。

这里的 ensureCanMutateNextListeners 恰恰是为了实现这两句中的额外补充逻辑。
在之前我们实现的 dispatch 方法，在 dispatch 触发的 reducer 函数执行完毕后会派发对应的 listeners 依次进行执行。
此时，如果在订阅的 listeners 列表中的 listener 函数再次进行了 store.subscribe 或者调用了已被订阅的 listener 函数的取消订阅方法的话。那么此时并不会立即生效。
所谓不会立即生效的原因就是在这里，在进行 subscribe 时首先会判断 nextListeners === currentListeners 是否相等。
如果相等的话，那么就会对于 nextListeners 进行重新赋值，会将当前 currentListeners 这个数组进行一次浅拷贝。
注意由于 JavaScript 引用类型的关系，此时 nextListeners 已经是一个全新的对象，指向了一个新的内存空间。
而在 dispatch 函数中的 listeners 执行时 :
```
// dispatch 函数

   // 当reducer执行完毕后 通知订阅的listeners 依次进行执行
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
```
此时的 listeners 由于引用类型的关系，指针仍然指向旧的（被浅拷贝的原始对象）。所以后续无论是针对于新的 nextListeners 进行添加还是取消订阅，并不会在本轮 dispatch 后的 listeners 中立即生效，而是会在下一次 dispatch 时才会生效。

## replaceReducer

接来下我们来看看对应的 replaceReducer 方法，在编写 replaceReducer 方法前我们先来思考一个另外的逻辑。
不知道有没有细心的朋友发现了没有，我们一起来看看这段代码：

function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case 'add':
      return { number: state.number + 1 }
    default:
      return state
  }
}

const store = createStore(reducer)

console.log(store.getState())

此时如果我们没有传递 loadedState 的话，那么，当我们直接调用 store.getState() 按照我们的代码应该返回的 currentState 是 undeinfed 没错吧。
显然这并不是期望的结果，当调用 createStore 时未传入 loadedState 时我们希望 currentState 的值是传入 reducer 函数中第一个参数的默认参数（也就是{number:1}）。
那么此时应该如何去处理这个呢，其实答案非常简单。Redux 在 createStore 的函数结尾派发了一次type 为 随机的 action 。
function createStore() {
    // ....
    
    // 派发了一次type为随机的 action ActionTypes.REPLACE其实就是一个随机的字符串
    dispatch({ type: ActionTypes.REPLACE })
    return {
        dispatch,
        replaceReducer,
        getState,
        subscribe
    }
}

同学们可以回忆一下，通常我们在编写 reducer 函数中是否对于匹配的 action.type 存在当任何类型都不匹配 action.type 时，默认会返回传入的 state :
function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case 'add':
      return { number: state.number + 1 }
    default:
      return state
  }
}

在 createStore 函数中，首次派发了一个 action 并且它的类型不会匹配 reducer 中任何的 actionType。
那么此时调用 reducer ，state 的值会变成默认参数进行初始化。同时在 reducer 执行完成会将返回值赋值给 currentState 。
这样是不是就达到了当没有传入 loadedState 参数时，初始化 currentState 为 reducer 中 state 的默认参数的效果了吗。
当然，如果传入了 loadedState 的话。那么由于第一次派发 action 时任何东西都不会匹配并且传入 reducer 的第一个参数 state 是存在值的（loadedState）。
那么此时，currentState 仍然为 loadedState 。

replaceReducer 函数我并没有进行逐行注释。其实它的逻辑也非常简单，就是单纯替换 currentReducer 为 nextReducer。
同时派发了一个初始化的 action 。


# bindActionCreators
通常我们在使用 React 的过程中会遇到这么一种情况，父组件中需要将 action creator 往下传递下到另一个组件上。但是通常我们并不希望子组件中可以察觉到 Redux 的存在，我们更希望子组件中的逻辑更加纯粹并不需要通过dispatch 或 Redux store 传给它 。也许接触 redux 不多的同学，不太清楚什么是 action creator 。没关系，这非常简单。

```
const ADD = 'ADD'

// 创建一个ActionCreator
const addAction = () => ({ type: ADD })

function reducer(state = { number: 1 }, action) {
  switch (action.type) {
    case ADD:
      return { number: state.number + 1 }
    default:
      return state
  }
}

const store = createStore(reducer)


// 通过actionCreator派发一个action
store.dispatch(addAction())
```

我们将上述的代码经过了简单的修改（其实本质上是一模一样的，只是额外进行了一层包装）。这里的 addAction 函数就被称为 actionCreator 。所谓的 actionCreator 本质上就是一个函数，通过调用这个函数返回对应的 action 提供给 dispatch 进行调用。可以明显的看到，如果存在父子组件需要互相传递 actionCreator 时，父传递给子 actionCreator 那么子仍需要通过 store.dispatch 进行调用。这样在子组件中仍然需要关联 Redux 中的 dispatch 方法进行处理，这显然是不太合理的。Redux 提供了 bindActionCreators API来帮助我们解决这个问题。

bindActionCreators(actionCreators, dispatch)

参数
bindActionCreators 接受两个必选参数作为入参：

actionCreators : 一个 action creator，或者一个 value 是 action creator 的对象。
dispatch : 一个由 Store 实例提供的 dispatch 函数。

返回值

它会返回一个与原对象类似的对象，只不过这个对象的 value 都是会直接 dispatch 原 action creator 返回的结果的函数。如果传入一个单独的函数作为 actionCreators，那么返回的结果也是一个单独的函数。

用法

它的用法非常简单，结合上边的代码我们来看看如何使用 bindActionCreators:
import { createStore, bindActionCreators } from 'redux'

// ... 上述原本的 DEMO 示例

// 传入的addAction是一个原始的 actionAcreate 函数，同时传入store.dispatch
const action = bindActionCreators(addAction, store.dispatch)

// 调用返回的函数相当于 => store.dispatch(addAction())
action()

// 同时也支持第一个参数传入一个对象
const action = bindActionCreators({
  add: addAction
}, store.dispatch)

// 通过 action.add 调用相当于 => store.dispatch(addAction())
action.add()

实现

```
function bindActionCreators(actionCreators, dispatch) {
  // 如果传入的是函数
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  // 保证传入的除了函数以外只能是一个Object
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function`)
  }

  // 定义最终返回的对象
  const boundActionCreators = {}

  // 迭代actionCreators对象
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    // 如果value是函数，那么为boundActionCreators[key]赋值
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
}

/**
 * 单个 actionCreator 执行的逻辑
 * @param actionCreator 
 * @param dispatch 
 * @returns 
 */
function bindActionCreator(
  actionCreator,
  dispatch
) {
  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export default bindActionCreators
```

# combineReducers

随着前端应用越来越复杂，使用单个 Reducer 的方式管理全局 store 会让整个应用状态树显得非常臃肿且难以阅读。

此时，Redux API 提供了 combineReducers 来为我们解决这个问题。

combineReducers(reducers)
combineReducers 辅助函数的作用是，把一个由多个不同 reducer 函数作为 value 的 object，合并成一个最终的 reducer 函数，然后就可以对这个合成后的 reducer 调用 createStore 方法。合并后的 reducer 可以调用各个子 reducer，并把它们返回的结果合并成一个 state 对象。 由 combineReducers() 返回的 state 对象，会将传入的每个 reducer 返回的 state 按其传递给 combineReducers() 时对应的 key 进行命名。老样子，我们先来看看 combineReducers 怎么用。

```
import { combineReducers, createStore } from 'redux'

// 子reduer
function counter(state = {number:1},action) {
    switch (action.type) {
        case 'add':
            return { number: state.number + 1 }
        default:
            return state;
    }
}

// 子reducer
function name(state = { name:'wang.haoyu'},action) {
    switch (action.type) {
        case 'changeName':
            return {name: action.payload}            
        default:
            return state;
    }
}

// combineReducers 合并子reduer为总reducer
const rootReducer = combineReducers({
    counter,
    name
})

const store = createStore(rootReducer)

// { name: { name:'wang.haoyu' }, counter: { number:1 } }
store.getState()

store.dispatch({type: 'add'})

store.dispatch({type: 'changeName', payload: '19qingfeng'})

// { name: { name:'wang.haoyu' }, counter: { number:1 } }
store.getState()
```

实现

```
/**
 * combineReducers 接受一个 reducers 结合的对象
 * @param reducers 传入的 reducers 是一个 Object 类型,同时 Object 中 key 为对应的 reducer 名称，value 为对应的 reducer
 * @returns 返回combination函数 它是一个组合而来的reducer函数
 */
function combineReducers(reducers) {

  // 获得 reducers 所有 key 组成的列表
  const finalReducers = Object.keys(reducers)
  
  return function combination(state, action) {
    // 定义hasChanged变量表示本次派发action是否修改了state
    let hasChanged = false

    // 定义本次reducer执行 返回的整体store
    const nextState = {}

    // 迭代reducers中的每个reducer
    for (let key of finalReducers) {
      // 获得reducers中当前的reducer
      const reducer = finalReducers[key]
      // 获取当前reducers中对应的state
      const previousStateForKey = state[key]
      // 执行 reducer 传入旧的 state 以及 action 获得执行后的 state
      const nextStateForKey = reducer(previousStateForKey, action)
      // 更新
      nextState[key] = nextStateForKey
      // 判断是否改变 如果该reducer中返回了全新的state 那么重制hasChanged状态为true
      hasChanged = hasChanged || nextStateForKey === previousStateForKey
    }

    // 同时最后在根据 finalReducers 的长度进行一次判断(是否有新增reducer执行为state添加了新的key&value)
    hasChanged =
      hasChanged || finalReducers.length !== Object.keys(state).length

    // 通过 hasChanged 标记位 判断是否改变并且返回对应的state
    return hasChanged ? nextState : state
  }
}
```





