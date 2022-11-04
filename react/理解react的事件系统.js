import React, { useEffect } from "react";
import ReactDOM from "react-dom";
window.addEventListener("click", event => {
console.log("window");
});


document.addEventListener("click", event => {
console.log("document:bedore react mount");
});


document.body.addEventListener("click", event => {
    console.log("body");
});


function App() {
function documentHandler() {
console.log("document within react");
}


useEffect(() => {
document.addEventListener("click", documentHandler);
return () => {
document.removeEventListener("click", documentHandler);
};
}, []);


return (
<div
onClick={() => {
console.log("raect:container");
}}
>
<button
onClick={event => {
console.log("react:button");
}}
>
CLICK ME
</button>
</div>
);
}


ReactDOM.render(<App />, document.getElementById("root"));


document.addEventListener("click", event => {
console.log("document:after react mount");
});


// [原文链接](https://www.cnblogs.com/Wayou/p/react_event_issue.html)
// 因为react事件绑定是在reactDOM包实现的所以需要将这个包和react都改成16.18.0版本
// 以上输出结果为
// body
// document:bedore react mount
// react:button
// raect:container
// document:after react mount
// document within react
// window


// 如果body阻止了冒泡的话
// 只输出body

// 最开始从原生 DOM 按钮一路冒泡到 body，body 的事件处理器执行，输出 body。
// 注意此时流程还没进入 React。为什么？因为 React 监听的是 document 上的事件。
// 继续往上事件冒泡到 document。
// 事件到达 document 之后，发现 document 上面一共绑定了三个事件处理器，
// 分别是代码中通过 document.addEventListener 在 ReactDOM.render 前后调用的，
// 以及一个隐藏的事件处理器，是 ReactDOM 绑定的，也就是前面提到的 React 用来代理事件的那个处理器。
// 同一元素上如果对同一类型的事件绑定了多个处理器，会按照绑定的顺序来执行。
// 所以 ReactDOM.render 之前的那个处理器先执行，输出 document:before react mount。
// 然后是 React 的事件处理器。此时，流程才真正进入 React，走进我们的组件。组件里面就好理解了，从 button 冒泡到 container，依次输出。
// 最后 ReactDOM.render 之后的那个处理器先执行，输出 document:after react mount。
// 事件完成了在 document 上的冒泡，往上到了 window，执行相应的处理器并输出 window。


// 给body加了event.stopPropagation()之后
// React17版本之前的输出结果
// body 只有这个执行了
// 解释执行
// 当你在页面上点击按钮，事件开始在原生 DOM 上走捕获冒泡流程。
// React 监听的是 document 上的冒泡阶段。事件冒泡到 document 后，
// React 将事件再派发到组件树中，然后事件开始在组件树 DOM 中走捕获冒泡流程。

// React17版本没给body加event.stopPropagation()的输出为
// react:button
// aect:container
// body
// document:bedore react mount
// document:after react mount
// document within react
// window
// React17版本给body加了event.stopPropagation()之后之后输出为 
// react:button
// raect:container
// body

// 官方React17对事件委派的更改https://reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation

// React 17 之后将原有的document处理事件移到了rootNode上监听执行

// 这样对于一个项目有多个版本的React有好处并且也不会影响jquery等库的监听

// 由于这一变化，现在将由一个版本管理的 React 树嵌入到由不同 React 版本管理的树中会更加安全。
// 请注意，要使其正常工作，两个版本都需要为 17 或更高版本，这就是升级到 React 17 很重要的原因。

// 这一变化还使得将 React 嵌入到使用其他技术构建的应用程序中变得更加容易。
// 例如，如果您的应用程序的外部“外壳”是用 jQuery 编写的，
// 但其中的较新代码是用 React 编写的，
// e.stopPropagation()那么 React 代码内部现在会阻止它访问 jQuery 代码——正如您所期望的那样。
// 这也适用于另一个方向。如果你不再喜欢 React 并且想要重写你的应用程序——例如，
// 在 jQuery 中——你可以开始将外壳从 React 转换为 jQuery，而不会中断事件传播。

// 实现合成事件的目的如下：

// 合成事件首先抹平了浏览器之间的兼容问题，另外这是一个跨浏览器原生事件包装器，赋予了跨浏览器开发的能力；
// 对于原生浏览器事件来说，浏览器会给监听器创建一个事件对象。
// 如果你有很多的事件监听，那么就需要分配很多的事件对象，造成高额的内存分配问题。
// 如果在 ReactDOM.render() 之前的的 document 事件处理器上将冒泡结束掉，
// 同样会影响 React 的执行。只不过这里需要调用的不是 event.stopPropagation()，
// 而是 event.stopImmediatePropagation()。
// document.addEventListener("click", event => {
// +  event.stopImmediatePropagation();
//   console.log("document:bedore react mount");
// });
// 输出：
// body
// document:bedore react mount

// stopImmediatePropagation 会产生这样的效果，即，如果同一元素上同一类型的事件（这里是 click）绑定了多个事件处理器，
// 本来这些处理器会按绑定的先后来执行，但如果其中一个调用了 stopImmediatePropagation，
// 不但会阻止事件冒泡，还会阻止这个元素后续其他事件处理器的执行。
// 所以，虽然都是监听 document 上的点击事件，
// 但 ReactDOM.render() 之前的这个处理器要先于 React，所以 React 对 document 的监听不会触发。

// 如何解决 因为 button 事件处理器的执行前提是事件达到 document 被 React 接收到，
// 然后 React 将事件派发到 button 组件。既然在按钮的事件处理器执行之前，事件已经达到 document 了，
// 那当然就无法在按钮的事件处理器进行阻止了。
// 用 window 替换 document
// 来自 React issue 回答中提供的这个方法是最快速有效的。使用 window 替换掉 document 后，前面的代码可按期望的方式执行。

// function App() {
//   useEffect(() => {
// +    window.addEventListener("click", documentClickHandler);
//     return () => {
// +      window.removeEventListener("click", documentClickHandler);
//     };
//   }, []);
// function documentClickHandler() {
// console.log("document clicked");
// }


// function btnClickHandler(event) {
// + event.stopPropagation();
// console.log("btn clicked");
// }


// return <button onClick={btnClickHandler}>CLICK ME</button>;
// }

// 这里 button 事件处理器上接到到的 event 来自 React 系统，也就是 document 上代理过来的，
// 所以通过它阻止冒泡后，事件到 document 就结束了，而不会往上到 window。

// 第二种
// Event.stopImmediatePropagation()
// 组件中事件处理器接收到的 event 事件对象是 React 包装后的 SyntheticEvent 事件对象。
// 但可通过它的 nativeEvent 属性获取到原生的 DOM 事件对象。
// 通过调用这个原生的事件对象上的 stopImmediatePropagation() 方法可达到阻止冒泡的目的。

// function btnClickHandler(event) {
// +  event.nativeEvent.stopImmediatePropagation();
//   console.log("btn clicked");
// }

// 至于原理，其实前面已经有展示过。React 在 render 时监听了 document 冒泡阶段的事件，
// 当我们的 App 组件执行时，准确地说是渲染完成后（useEffect 渲染完成后执行），
// 又在 document 上注册了 click 的监听。此时 document 上有两个事件处理器了，并且组件中的这个顺序在 React 后面。
// 当调用 event.nativeEvent.stopImmediatePropagation() 后，
// 阻止了 document 上同类型后续事件处理器的执行，达到了想要的效果。
// 但这种方式有个缺点很明显，那就是要求需要被阻止的事件是在 React render 之后绑定，
// 如果在之前绑定，是达不到效果的。




