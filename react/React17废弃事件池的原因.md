React 17 从 React 中移除了“事件池”优化。它不会提高现代浏览器的性能，甚至会让经验丰富的 React 用户感到困惑。之前出于性能考虑，为了复用 SyntheticEvent，维护了一个事件池，导致 React 事件只在传播过程中可用，之后会立即被回收释放，合成事件对象池，是 React 事件系统提供的一种性能优化方式。不同类型的合成事件具有不同的对象池。当对象池未满时，React 创建新的事件对象，派发给组件。当对象池装满时，React 从池中复用事件对象，派发给组件。传播过程之外的事件对象上的所有状态会被置为null，除非手动e.persist()（或者直接做值缓存）React 17 去掉了事件复用机制，因为在现代浏览器下这种性能优化没有意义，反而给开发者带来了困扰。例如
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




