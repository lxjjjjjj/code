[原文链接](https://juejin.cn/post/7100395334647414821)

认识什么是更新队列，什么是 hook 链表
如何查看 fiber 节点中真实的 hook 链表
hook 的主流程以及源码剖析

# 示例代码
```
import React, { useReducer, useEffect, useState } from "react";
import { render } from "react-dom";

function reducer(state, action) {
  return state + 1;
}

const Counter = () => {
  const [count, setCount] = useReducer(reducer, 0);
  return (
    <div
      onClick={() => {
        debugger;
        setCount(1);
        setCount(2);
        // 执行两次诶 结果是2  不是1 
      }}
    >
      {count}
    </div>
  );
};

render(<Counter />, document.getElementById("root"));
```
# 第一节 环状链表
React 使用环状链表保存更新队列 queue={ pending: null }，其中 pending 永远指向最后一个更新。比如多次调用 setState 时：
const [count, setCount] = useReducer(reducer, 0);
setCount(1); // 生成一个更新对象：update1 = { action: 1, next: update1 }
setCount(2); // 生成一个更新对象：update2 = { action: 2, next: update1 }

[环形链表示意图](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1f45691beb064d279d547075de5aeaa1~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image?)

环状链表简单实现如下，这个可以动手写一下，找找感觉

const queue = { pending: null }; // queue.pending永远指向最后一个更新

function dispatchAction(action) {
  const update = { action, next: null };
  const pending = queue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  queue.pending = update;
}

// 队列
dispatchAction(1);
dispatchAction(2);

# 第二节 什么是 hook 链表
假设我们有下面这段代码，React 每次执行到 hook 函数时，都会构造一个 hook 对象，并连接成一个链表
const [count, setCount] = useReducer(reducer, 0); 
// 构造一个hook对象 hook1 = { memoizedState: 0, queue: { pending: null }, next: hook2 }

const [count2, setCount2] = useReducer(reducer, 1000); 
// 构造一个hook对象 hook2 = { memoizedState: 1000, queue: { pending: null }, next: hook3 }

useEffect(() => {
  // 构造一个hook对象，hook3 = { memoizedState: { create: callback }, next: null}
  console.log("useEffect");
}, []);

在 hook 对象中，hook.memoizedState 属性用于保存当前状态，比如 hook1.memoizedState 对应的就是 count。hook1.next 指向 hook2。hook1.queue保存的是调用 setCount 后的更新队列。
每个 hook 都会维护自己的更新队列 queue
注意！！！函数组件中，组件对应的 fiber 节点也有一个 memoizedState 属性，fiber.memoizedState 用于保存组件的 hook 链表

