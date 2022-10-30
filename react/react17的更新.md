# onScroll事件不再冒泡，以防止常见的混乱
[一个issue](https://github.com/facebook/react/issues/15723)
# ReactonFocus和onBlur事件已经切换到使用引擎下的原生focusin和focusout事件，这更接近于 React 的现有行为，并且有时会提供额外的信息。
# 捕获阶段事件（例如onClickCapture）现在使用真正的浏览器捕获阶段侦听器。这些更改使 React 更接近浏览器行为并提高了互操作性。
# 取消事件池
# 事件委托对象的更改
# useEffect的异步清除 如果同步使用useLayoutEffect