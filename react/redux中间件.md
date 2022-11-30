[原文](https://juejin.cn/post/7110853074033311752#heading-30)#
# 为什么需要中间件

某些业务场景下我们需要派发一个异步 Action ，此时我们需要支持传入的 action 是一个函数，这样在函数内部可以自由的进行异步派发 action :
```
import { createStore } from 'redux'

const ADD = 'add'

const reducer = (state = { number: 1 }, action) => {
  switch (action.type) {
    case ADD:
      return { number: state.number + 1 }
    default:
      return state
  }
}

const store = createStore(reducer)

// 保存 store.dispatch 方法
const prevDispatch = store.dispatch

// 修改store的dispatch方法让它支持传入的action是函数类型
store.dispatch = (action) => {
  if (typeof action === 'function') {
    // 传入的是函数的话，传入prevDispatch调用传入的函数
    action(prevDispatch)
  } else {
    prevDispatch(action)
  }
}
```
大家留意上述的代码，虽然上述代码粗暴的直接修改了 store.dispatch 的指向，但是 redux 中间件其实本质思想和它是一致的都是通过闭包访问外部自由变量的形式去包裹原始的 action ，从而返回一个新的 action 。

# 中间件的用法
```
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
 const store = createStore(
  reducers, 
  applyMiddleware(thunk)
);
```
直接将thunk中间件引入，放在applyMiddleware方法之中，传入createStore方法，就完成了store.dispatch()的功能增强。即可以在reducer中进行一些异步的操作。

# applyMiddleware()

其实applyMiddleware就是Redux的一个原生方法，将所有中间件组成一个数组，依次执行。中间件多了可以当做参数依次传进去。它提供给了我们利用 middleware 的能力来包装 store 的 dispatch 方法从而实现任何我们想要达到的目的。同时在 applyMiddleware 内部提供了一种可组合的机制，多个 middleware 可以通过 applyMiddleware 组合到一起使用。

参数

...middleware (arguments): 遵循 Redux middleware API 的函数。每个 middleware 接受 Store 的 dispatch 和 getState 函数作为命名参数，并返回一个函数。该函数会被传入被称为 next 的下一个 middleware 的 dispatch 方法，并返回一个接收 action 的新函数，这个函数可以直接调用 next(action)，或者在其他需要的时刻调用，甚至根本不去调用它。调用链中最后一个 middleware 会接受真实的 store 的 dispatch 方法作为 next 参数，并借此结束调用链。所以，middleware 的函数签名是 ({ getState, dispatch }) => next => action。

那么一长段话，其实简单来说就是它接受多个 Middleware ，每个 middleware 需要和我们上边提到的结构一致。

返回值

applyMiddleware 会返回函数。它会返回一个应用了 middleware 后的 store enhancer。

applyMiddleware 总结

* applyMiddleware 本质上即使对于 Redux 提供了 middleware 的支持能力，并且同时支持传入多个 middleware
* applyMiddleware 内部会对于传入的 middleware 进行组合。
* 同时，可以看到 applyMiddleware 通常需要配合 createStore 一起使用。在 createStore 中传递了 
* applyMiddleware 后即可开启 middleware 的支持。

applyMiddleWare 通过传入的参数最终返回的是一个全新的 store 。

```
const store = createStore(
  reducers, 
  applyMiddleware(thunk, logger)
);
```
通过compose函数依次传递store给中间件函数执行，compose(logger,thunk,promise) 中间件的组合顺序是从右往左，换言之在真正派发 dispatch 时中间件的执行顺序应该是相反的，也就是从左往右先执行 logger、thunk最后为promise 最后再到真实 store 中的 disaptch。
# redux-thunk 分析redux-thunk的源码node_modules/redux-thunk/src/index.js
```
function createThunkMiddleware(extraArgument) {
 return ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
   return action(dispatch, getState, extraArgument);
  }
  return next(action);
 };
} 
const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware; 
export default thunk;
```
redux-thunk中间件export default的就是createThunkMiddleware()过的thunk，再看createThunkMiddleware这个函数，返回的是一个柯里化过的函数。我们再翻译成ES5的代码容易看一点，
```
function createThunkMiddleware(extraArgument) {
  return function({ dispatch, getState }) {
    return function(next){
      return function(action){
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }
        return next(action);
      };
    }
  }
}

```

可以看出来redux-thunk最重要的思想，就是可以接受一个返回函数的action creator。如果这个action creator 返回的是一个函数，就执行它，如果不是，就按照原来的next(action)执行。正因为这个action creator可以返回一个函数，那么就可以在这个函数中执行一些异步的操作。

```
export function addCount() {
  return {type: ADD_COUNT}
} 
export function addCountAsync() {
  return dispatch => {
    setTimeout( () => {
      dispatch(addCount())
    },2000)
  }
}
```
addCountAsync函数就返回了一个函数，将dispatch作为函数的第一个参数传递进去，在函数内进行异步操作就可以了。

了解了 Redux Middleware 究竟在做什么之后，我们来看看究竟应该如何实现一款 Middleware。这里我们以一款正儿八经的异步 middleware 为基础先来看看如何实现 Redux Middleware。一个 Redux Middleware 必须拥有以下条件：

middleware 是一个函数，它接受 Store 的 dispatch 和 getState 函数作为命名参数

并且每个 middleware 会接受一个名为 next 的形参作为参数，它表示下一个 middleware 的 dispatch 方法，并且返回一个接受 Action 的函数。

返回的最后一个函数，这个函数可以直接调用 next(action)，我们可以通过调用 next(action) 进入下一个中间件的逻辑，注意当已经进入调用链中最后一个 middleware 时，它会接受真实的 store 的 dispatch 方法作为 next 参数，并借此结束调用链。

我们对于 Action 的类型支持传入一个函数，这个函数会接受 dispatch、getState 作为参数从而可以达到实现异步 dispatch 的逻辑。




