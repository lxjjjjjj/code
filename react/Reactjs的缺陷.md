[原文链接](https://www.zhihu.com/question/316425133/answer/672043529)
# react为什么绑定事件还要求开发者写代码来绑定this，为什么这样设计？
题主问的是框架层面为什么不自动绑定，而不是使用层面如何实现

React曾经全部接盘了组件this的绑定，但是也真真切切地限制了开发者在组件内对 context 的掌控

React 支持 ECMAScript 2015 classes 方式声明组件后，规定开发者在事件处理句柄（ event handlers）或类似 callback 的 functions passed down as properties 情况下需要手动绑定 this，其内部的组件生命周期函数中 this 自动指向组件实例。为什么会这样呢？

React 源码实现层面，React 知道你有一个 render 方法，在渲染过程中，你定义的组件实例化，类似：new Component(...)实例化的组件继承自 React.Component，setState、 forceUpdate 这些 APIs 也一并继承下来。React 此时知道：该组件可能会执行组件生命周期函数，调用 render 方法，这种情况下框架层面可以直接调用：component.componentDidUpdate(...)

所以此时，this 在框架层面已经绑定在组件实例上了，我们开发者“被安排的明明白白”，不需要单独处理 this 绑定。这种情况下我们直接使用 this.method，没毛病。

但是事件句柄，类似 onChange 或 onClick 等可能来自多个“源”。React.createClass API 假定了事件处理来自当前组件，因此做了自动绑定，在 ECMAScript 2015 classes 声明组件的情况下，放弃了“多管闲事”的作为。因此我特地刨出来了当初 React.createClass 的 PR

# 合成事件是个好的主意吗？

合成事件是 React 一个非原创特色，全部事件代理到 document 上，事件共享一个 pool，所有这些貌似做到了“性能最优”。可真的是这样吗？React 当然无法阻止原生事件的创建，原生事件和合成事件并存造成的混乱谁都不好理清。除此之外，在合成事件上，绝对还有提升事件处理性能的手段。

# 性能从来不是卖点

React 在性能上从两个维度都有可“挑剔”的地方。第一，bundle size 远远甩开 Vue 等其他解决方案，且在增肥路上一去不返。第二，非其原创的 virtual dom 自然也没有被 React 发挥到极致，在 dom diff 算法上我们知道从 O(N3) 优化到 O(N1)，但是这个 diff 算法有些场景完全能做到更好。

