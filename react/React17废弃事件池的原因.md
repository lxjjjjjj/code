之前出于性能考虑，为了复用 SyntheticEvent，维护了一个事件池，导致 React 事件只在传播过程中可用，之后会立即被回收释放，例如：
```
<button onClick={(e) => {
    console.log(e.target.nodeName);
    // 输出 BUTTON
    // e.persist();
    setTimeout(() => {
      // 报错 Uncaught TypeError: Cannot read property 'nodeName' of null
      console.log(e.target.nodeName);
    });
  }}>
  Click Me!
</button>
```
传播过程之外的事件对象上的所有状态会被置为null，除非手动e.persist()（或者直接做值缓存）
React 17 去掉了事件复用机制，因为在现代浏览器下这种性能优化没有意义，反而给开发者带来了困扰

useEffect本身是异步执行的，但其清理工作却是同步执行的（就像 Class 组件的componentWillUnmount同步执行一样），可能会拖慢切 Tab 之类的场景，因此 React 17 改为异步执行清理工作：

useEffect(() => {
  // This is the effect itself.
  return () => {
    // 以前同步执行，React 17之后改为异步执行
    // This is its cleanup.
  };
});
同时还纠正了清理函数的执行顺序，按组件树上的顺序来执行（之前并不严格保证顺序）

SyntheticEvent 对象会被放入池中统一管理。这意味着 SyntheticEvent 对象可以被复用，当所有事件处理函数被调用之后，其所有属性都会被置空。例如，以下代码是无效的：

function handleChange(e) {
  // This won't work because the event object gets reused.
  setTimeout(() => {
    console.log(e.target.value); // Too late!
  }, 100);
}
如果你需要在事件处理函数运行之后获取事件对象的属性，你需要调用 e.persist()：

function handleChange(e) {
  // Prevents React from resetting its properties:
  e.persist();

  setTimeout(() => {
    console.log(e.target.value); // Works
  }, 100);
}

合成事件对象池，是 React 事件系统提供的一种性能优化方式。不同类型的合成事件具有不同的对象池。当对象池未满时，React 创建新的事件对象，派发给组件。当对象池装满时，React 从池中复用事件对象，派发给组件。