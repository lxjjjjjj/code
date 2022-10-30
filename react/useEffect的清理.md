useEffect本身是异步执行的，但其清理工作却是同步执行的（就像 Class 组件的componentWillUnmount同步执行一样），可能会拖慢切 Tab 之类的场景，因此 React 17 改为异步执行清理工作：

同步清理对于较大的应用程序来说并不理想，因为它会减慢大屏幕的转换速度（例如切换标签）。
如果正在卸载组件，则清理会在屏幕更新后运行。您可能想知道这是否意味着您现在将无法修复有关setState未安装组件的警告。别担心——React 专门检查这种情况，并且不会在setState卸载和清理之间的短暂间隙发出警告。所以代码取消请求或间隔几乎可以保持不变。
```
useEffect(() => {
  // This is the effect itself.
  return () => {
    // 以前同步执行，React 17之后改为异步执行
    // This is its cleanup.
  };
});
```
同时还纠正了清理函数的执行顺序，按组件树上的顺序来执行（之前并不严格保证顺序）

需要注意的问题
```
useEffect(() => {
  someRef.current.someSetupMethod();
  return () => {
    someRef.current.someCleanupMethod();
  };
});
```
问题是它someRef.current是可变的，所以当清理函数运行时，它可能已经设置为null. 解决方案是捕获效果内的任何可变值：
```
useEffect(() => {
  const instance = someRef.current;
  instance.someSetupMethod();
  return () => {
    instance.someCleanupMethod();
  };
});
```
