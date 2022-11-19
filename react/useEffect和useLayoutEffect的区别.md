[原文链接](https://juejin.cn/post/6844904008402862094)
[原文链接](https://zhuanlan.zhihu.com/p/348701319)

useLayoutEffect 的出现是为了解决 useEffect 的页面闪烁问题。useEffect 是在组件挂载后异步执行的，并且执行事件会更加往后，如果我们在 useEffect 里面改变 state 状态，那么页面会出现闪烁（state 可见性变化导致的）。而 useLayoutEffect 是在渲染之前同步执行的，在这里执行修改 DOM 相关操作，就会避免页面闪烁的情况。

```
useLayoutEffect 相比 useEffect，通过同步执行状态更新可解决一些特性场景下的页面闪烁问题。
useEffect 可以满足百分之99的场景，而且 useLayoutEffect 会阻塞渲染，请谨慎使用。
```
优先使用 useEffect，因为它是异步执行的，不会阻塞渲染
会影响到渲染的操作尽量放到 useLayoutEffect中去，避免出现闪烁问题

useEffect 是异步执行的，而useLayoutEffect是同步执行的。
useEffect 的执行时机是浏览器完成渲染之后，而 useLayoutEffect 的执行时机是浏览器把内容真正渲染到界面之前，和 componentDidMount 等价。
