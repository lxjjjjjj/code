[ahooks分析文章](https://gpingfeng.github.io/ahooks-analysis/hooks/request/use-request)
[ahooks掘金文章](https://juejin.cn/post/7147858832692084767#heading-20)
# useEvent => useMemoizedFn
React 中另一个场景，是基于 useCallback 的。
```
const [count, setCount] = useState(0);

const callbackFn = useCallback(() => {
  console.log(`Current count is ${count}`);
}, []);
```
以上不管我们的 count 的值变化成多少，执行 callbackFn 打印出来的 count 的值始终都是 0。这个是因为回调函数被 useCallback 缓存，形成闭包，从而形成闭包陷阱。

那我们怎么解决这个问题呢？官方提出了 useEvent（目前还处于 RFC 阶段，2022.08.20）。它解决的问题：如何同时保持函数引用不变，并能访问到最新状态。使用它之后，上面的例子就变成了。

const callbackFn = useEvent(() => {
  console.log(`Current count is ${count}`);
});
在这里我们不细看这个特性，实际上，在 ahooks 中已经实现了类似的功能，那就是 useMemoizedFn。

useMemoizedFn 是持久化 function 的 Hook，理论上，可以使用 useMemoizedFn 完全代替 useCallback。使用 useMemoizedFn，可以省略第二个参数 deps，同时保证函数地址永远不会变化。以上的问题，通过以下的方式就能轻松解决：

const memoizedFn = useMemoizedFn(() => {
  console.log(`Current count is ${count}`);
});

我们来看下它的源码，可以看到其还是通过 useRef 保持 function 引用地址不变，并且去除掉 useCallback deps 特性之后，每次执行都可以拿到最新的 state 值，保证函数调用的准确性和实时性。

```
function useMemoizedFn<T extends noop>(fn: T) {
  // 每次拿到最新的 fn 值，并把它更新到 fnRef 中。这可以保证此 ref 能够持有最新的 fn 引用
  const fnRef = useRef<T>(fn);
  fnRef.current = useMemo(() => fn, [fn]);
  // 保证最后返回的函数引用是不变的-持久化函数
  const memoizedFn = useRef<PickFunction<T>>();
  if (!memoizedFn.current) {
    // 每次调用的时候，因为没有 useCallback 的 deps 特性，所以都能拿到最新的 state
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
```