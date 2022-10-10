# diff算法

nextList每个节点在prevList的位置为0 1 2 3。每一项都要比前一项要大，所以不需要移动，这就是react的diff算法的原理
```
import mount from "../mount";
import patch from "../patch";

export default function reactdiff(prevChildren, nextChildren, parent) {
  let prevIndexMap = {},
    nextIndexMap = {};
  for (let i = 0; i < prevChildren.length; i++) {
    let { key } = prevChildren[i]
    prevIndexMap[key] = i
  }
  let lastIndex = 0;
  for (let i = 0; i < nextChildren.length; i++) {
    let nextChild = nextChildren[i],
      nextKey = nextChild.key,
      j = prevIndexMap[nextKey];

    nextIndexMap[nextKey] = i
    
    if (j === undefined) {
      let refNode = i === 0
                    ? prevChildren[0].el
                    : nextChildren[i - 1].el.nextSibling;
      mount(nextChild, parent, refNode)
    } else {
      patch(prevChildren[j], nextChild, parent)
      if (j < lastIndex) {
        let refNode = nextChildren[i - 1].el.nextSibling;
        parent.insertBefore(nextChild.el, refNode)
      } else {
        lastIndex = j
      }
    }
  }

  for (let i = 0; i < prevChildren.length; i++) {
    let { key } = prevChildren[i]
    if (!nextIndexMap.hasOwnProperty(key)) parent.removeChild(prevChildren[i].el)
  }
}
```
# diff

```
react diff算法

核心思想就是最长递增子序列的原理，遍历新列表中节点找到其在对应旧列表中的位置，利用一个变量存储上一次查找到新列表和旧列表相同节点的位置，如果下一次循环新节点在旧列表中的位置比上一次标记位置大，就表示这些节点位置是没变的，如果节点位置比上一次记录的位置小的话就表示这个节点是要移动的。那么只需要按照节点在新列表中的位置移动一下就好。如果新节点在旧列表中没有位置的话，就是需要新增的节点，如果旧节点在新列表中没有位置的话就是需要删除的节点。
```
# 学习react内容的东西

### fiber致力于解决的问题
```
我们日常使用App，浏览网页时，有两类场景会制约快速响应：

当遇到大计算量的操作或者设备性能不足使页面掉帧，导致卡顿。

发送网络请求后，由于需要等待数据返回才能进一步操作导致不能快速响应。

这两类场景可以概括为：

CPU的瓶颈

IO的瓶颈

JS可以操作DOM，GUI渲染线程与JS线程是互斥的。所以JS脚本执行和浏览器布局、绘制不能同时执行。

在每16.6ms时间内，需要完成如下工作：

JS脚本执行 -----  样式布局 ----- 样式绘制
当JS执行时间过长，超出了16.6ms，这次刷新就没有时间执行样式布局和样式绘制了。
React利用这部分时间更新组件，预留的初始时间是5ms，当预留的时间不够用时，React将线程控制权交还给浏览器使其有时间渲染UI，React则等待下一帧时间到来继续被中断的工作。这种将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为时间切片（time slice），解决CPU瓶颈的关键是实现时间切片，而时间切片的关键是：将同步的更新变为可中断的异步更新。

IO瓶颈，网络延迟是前端开发者无法解决的。如何在网络延迟客观存在的情况下，减少用户对网络延迟的感知？

React给出的答案是将人机交互研究的结果整合到真实的 UI 中 (opens new window)。

并发模式功能有一个共同的主题。它的使命是帮助将人机交互研究的结果整合到真实的 UI 中。研究表明，在屏幕之间转换时显示过多的中间加载状态会使转换感觉变慢。这就是为什么并发模式会在固定的“时间表”上显示新的加载状态，以避免不和谐和过于频繁的更新。

同样，我们从研究中知道，像悬停和文本输入这样的交互需要在很短的时间内处理，而点击和页面转换可以等待更长时间而不会感到迟钝。并发模式内部使用的不同“优先级”大致对应于人类感知研究中的交互类别。所以React会将用户的行为分等级，用户操作的行为是高优先级的行为，但是请求行为是低优先级的行为。

所以为了解决CPU瓶颈和IO瓶颈，都需要react把同步的更新变为可中断的异步更新。
```
### fiber架构的心智模型

```
react利用函数式编程概念中的代数效应，将副作用从函数调用中抽离
那么代数效应与React有什么关系呢？最明显的例子就是Hooks。

对于类似useState、useReducer、useRef这样的Hook，我们不需要关注FunctionComponent的state在Hook中是如何保存的，React会为我们处理。

我们只需要假设useState返回的是我们想要的state，并编写业务逻辑就行。
```

### react整体架构做的事情

```
Fiber包含三层含义：

作为架构来说，之前React15的Reconciler采用递归的方式执行，数据保存在递归调用栈中，所以被称为stack Reconciler。React16的Reconciler基于Fiber节点实现，被称为Fiber Reconciler。

作为静态的数据结构来说，每个Fiber节点对应一个React element，保存了该组件的类型（函数组件/类组件/原生组件...）、对应的DOM节点等信息。

作为动态的工作单元来说，每个Fiber节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新...）。

要实现异步可中断的更新，还需要调度器和协调器和fiber数据结构一起工作。

Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上

reconciler阶段是可中断的，但是renderer的commit阶段是同步的，此次递归未结束就不会更新dom，不能让用户看到只更新一半的dom。

fiber递归流程和之前的递归流程不同的点是，react使用自己写的requestIdleCallback函数，不使用浏览器自带的requestIdleCallback函数的原因是兼容问题还有切换tab之后requestIdleCallback函数的调用会降低。

fiber采用双缓存机制，每次递归的时候通过判断current是不是null判断是mount还是update 一颗是渲染的树是current tree 一颗是workinprogress tree  在递归结束后会将虚拟的fiberootnode节点的current指向workinprogress树，上一次的current会变成上次渲染的树。使用alternate指向上一次更新的节点，并且标记节点的effecttag 是update 还是 palcement状态。每个节点的更新从beginwork开始，completeWork结束。

beginWork阶段 会判断节点的更新、删除、新增，更新节点的effectTag信息。
compelteWork阶段 会处理节点的props， onClick、onChange等回调函数的注册、处理style prop、处理DANGEROUSLY_SET_INNER_HTML prop、处理children prop 将更新的props处理到workInProgress.updateQueue上，由于completeWork属于“归”阶段调用的函数，每次调用appendAllChildren时都会将已生成的子孙DOM节点插入当前生成的DOM节点下。那么当“归”到rootFiber时，我们已经有一个构建好的离屏DOM树。在completeWork的上层函数completeUnitOfWork中，每个执行完completeWork且存在effectTag的Fiber节点会被保存在一条被称为effectList的单向链表中。effectList中第一个Fiber节点保存在fiber.firstEffect，最后一个元素保存在fiber.lastEffect。类似appendAllChildren，在“归”阶段，所有有effectTag的Fiber节点都会被追加在effectList中，最终形成一条以rootFiber.firstEffect为起点的单向链表。这样，在commit阶段只需要遍历effectList就能执行所有effect了。

                       nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber

commit阶段

commit阶段主要是找到effectList并且执行所有的effect动作
在completeWork一节我们讲到，effectList中保存了需要执行副作用的Fiber节点。其中副作用包括插入DOM节点（Placement）、更新DOM节点（Update）、删除DOM节点（Deletion）除此外，当一个FunctionComponent含有useEffect或useLayoutEffect，他对应的Fiber节点也会被赋值effectTag。

所以useEffect的执行也是在commit中调用，useEffect异步执行的原因主要是防止同步执行时阻塞浏览器渲染。
```
### diff算法的分层次工作

```
React的diff会预设三个限制：

1.只对同级元素进行Diff。如果一个DOM节点在前后两次更新中跨越了层级，那么React不会尝试复用他。

2.两个不同类型的元素会产生出不同的树。如果元素由div变为p，React会销毁div及其子孙节点，并新建p及其子孙节点。

3.开发者可以通过 key prop来暗示哪些子元素在不同的渲染下能保持稳定

单节点diff

如果key相同则判断type是否相同，只有都相同时一个DOM节点才能复用。当key相同且type不同时，代表我们已经找到本次更新的p对应的上次的fiber，但是p与li type不同，不能复用。既然唯一的可能性已经不能复用，则剩下的fiber都没有机会了，所以都需要标记删除。

多节点diff

React团队发现，在日常开发中，相较于新增和删除，更新组件发生的频率更高。所以Diff会优先判断当前节点是否属于更新。和newChildren中每个组件进行比较的是current fiber，同级的Fiber节点是由sibling指针链接形成的单链表，即不支持双指针遍历。即 newChildren[0]与fiber比较，newChildren[1]与fiber.sibling比较。所以无法使用双指针优化。

基于以上原因，Diff算法的整体逻辑会经历两轮遍历：

第一轮遍历：处理更新的节点。

第二轮遍历：处理剩下的不属于更新的节点。

第一轮遍历步骤如下：

let i = 0，遍历newChildren，将newChildren[i]与oldFiber比较，判断DOM节点是否可复用。

如果可复用，i++，继续比较newChildren[i]与oldFiber.sibling，可以复用则继续遍历。

如果不可复用，分两种情况：

key不同导致不可复用，立即跳出整个遍历，第一轮遍历结束。

key相同type不同导致不可复用，会将oldFiber标记为DELETION，并继续遍历

如果newChildren遍历完（即i === newChildren.length - 1）或者oldFiber遍历完（即oldFiber.sibling === null），跳出遍历，第一轮遍历结束。

对应上面两种跳出第一次循环遍历的情况

一、此时newChildren没有遍历完，oldFiber也没有遍历完。

举个例子，考虑如下代码：

// 之前
<li key="0">0</li>
<li key="1">1</li>
<li key="2">2</li>
            
// 之后
<li key="0">0</li>
<li key="2">1</li>
<li key="1">2</li>
第一个节点可复用，遍历到key === 2的节点发现key改变，不可复用，跳出遍历，等待第二轮遍历处理。

此时oldFiber剩下key === 1、key === 2未遍历，newChildren剩下key === 2、key === 1未遍历。

二、步骤4跳出的遍历

可能newChildren遍历完，或oldFiber遍历完，或他们同时遍历完。

举个例子，考虑如下代码：

// 之前
<li key="0" className="a">0</li>
<li key="1" className="b">1</li>
            
// 之后 情况1 —— newChildren与oldFiber都遍历完
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>
            
// 之后 情况2 —— newChildren没遍历完，oldFiber遍历完
// newChildren剩下 key==="2" 未遍历
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>
<li key="2" className="cc">2</li>
            
// 之后 情况3 —— newChildren遍历完，oldFiber没遍历完
// oldFiber剩下 key==="1" 未遍历
<li key="0" className="aa">0</li>
带着第一轮遍历的结果，我们开始第二轮遍历。

对于第一轮遍历的结果，我们分别讨论：

#newChildren与oldFiber同时遍历完
那就是最理想的情况：只需在第一轮遍历进行组件更新 (opens new window)。此时Diff结束。

#newChildren没遍历完，oldFiber遍历完
已有的DOM节点都复用了，这时还有新加入的节点，意味着本次更新有新节点插入，我们只需要遍历剩下的newChildren为生成的workInProgress fiber依次标记Placement。

你可以在这里 (opens new window)看到这段源码逻辑

#newChildren遍历完，oldFiber没遍历完
意味着本次更新比之前的节点数量少，有节点被删除了。所以需要遍历剩下的oldFiber，依次标记Deletion。

你可以在这里 (opens new window)看到这段源码逻辑

#newChildren与oldFiber都没遍历完
这意味着有节点在这次更新中改变了位置。使用最长递归子序列方式处理更新节点。
```

# useEffect完整指南

### 如何用useEffect模拟componentDidMount生命周期

```
虽然可以使用useEffect(fn, [])，但它们并不完全相等。和componentDidMount不一样，useEffect会捕获 props和state。所以即便在回调函数里，你拿到的还是初始的props和state。如果你想得到“最新”的值，你可以使用ref。不过，通常会有更简单的实现方式，所以你并不一定要用ref。记住，effects的心智模型和componentDidMount以及其他生命周期是不同的，试图找到它们之间完全一致的表达反而更容易使你混淆。想要更有效，你需要“think in effects”，它的心智模型更接近于实现状态同步，而不是响应生命周期事件。
```

### 如何正确地在useEffect里请求数据？[]又是什么？

```
https://www.robinwieruch.de/react-hooks-fetch-data/是很好的入门，介绍了如何在useEffect里做数据请求。请务必读完它！它没有我的这篇这么长。[]表示effect没有使用任何React数据流里的值，因此该effect仅被调用一次是安全的。[]同样也是一类常见问题的来源，也即你以为没使用数据流里的值但其实使用了。你需要学习一些策略（主要是useReducer 和 useCallback）来移除这些effect依赖，而不是错误地忽略它们。

```

### 我应该把函数当做effect的依赖吗？

```
一般建议把不依赖props和state的函数提到你的组件外面，并且把那些仅被effect使用的函数放到effect里面。如果这样做了以后，你的effect还是需要用到组件内的函数（包括通过props传进来的函数），可以在定义它们的地方用useCallback包一层
```

### 为什么有时候会出现无限重复请求的问题？

```
这个通常发生于你在effect里做数据请求并且没有设置effect依赖参数的情况。没有设置依赖，effect会在每次渲染后执行一次，然后在effect中更新了状态引起渲染并再次触发effect。无限循环的发生也可能是因为你设置的依赖总是会改变。你可以通过一个一个移除的方式排查出哪个依赖导致了问题。但是，移除你使用的依赖（或者盲目地使用[]）通常是一种错误的解决方式。你应该做的是解决问题的根源。举个例子，函数可能会导致这个问题，你可以把它们放到effect里，或者提到组件外面，或者用useCallback包一层。useMemo 可以做类似的事情以避免重复生成对象。
```

### 为什么有时候(异步)在effect里拿到的是旧的state或prop？


```
Effect拿到的总是定义它的那次渲染中的props和state。这能够避免一些bugs，但在一些场景中又会有些讨人嫌。对于这些场景，你可以明确地使用可变的ref保存一些值（上面文章的末尾解释了这一点）。如果你觉得在渲染中拿到了一些旧的props和state，且不是你想要的，你很可能遗漏了一些依赖。可以尝试使用这个lint 规则来训练你发现这些依赖。
```

### 函数式组件和类组件的区别(心智模型上)
函数式组件捕获了渲染所用的值。每一次渲染都是一个新的函数组件，因为类组件中的this是时刻变化的，所以会有渲染的内容会因为this的变化而改变。如果想要函数组件也达到这种效果可以使用ref。通常情况下，你应该避免在渲染期间读取或者设置refs，因为它们是可变得。我们希望保持渲染的可预测性。然而，如果我们想要特定props或者state的最新值，那么手动更新ref会有些烦人。我们可以通过使用一个effect来自动化实现它，我们在一个effect内部执行赋值操作以便让ref的值只会在DOM被更新后才会改变。这确保了我们的变量突变不会破坏依赖于可中断渲染的时间切片和 Suspense等特性。


[dan 文章](https://overreacted.io/zh-hans/how-are-function-components-different-from-classes/)


###  react hooks中的setInterval问题
[dan 文章](https://overreacted.io/zh-hans/making-setinterval-declarative-with-react-hooks/)

### useReducer出现的原因

```
function Counter() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + step);
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  return (
    <>
      <h1>{count}</h1>
      <input value={step} onChange={e => setStep(Number(e.target.value))} />
    </>
  );
}

每次修改一个值就会重新新建定时器，因为effect依赖于step，如果不想每次step更改就新建定时器，我们可以写useReducer，

const [state, dispatch] = useReducer(reducer, initialState);
const { count, step } = state;

useEffect(() => {
  const id = setInterval(() => {
    dispatch({ type: 'tick' }); // Instead of setCount(c => c + step);
  }, 1000);
  return () => clearInterval(id);
}, [dispatch]);

React会保证dispatch在组件的声明周期内保持不变。所以上面例子中不再需要重新订阅定时器。

我们已经学习到如何移除effect的依赖，不管状态更新是依赖上一个状态还是依赖另一个状态。但假如我们需要依赖props去计算下一个状态呢？举个例子，也许我们的API是<Counter step={1} />。确定的是，在这种情况下，我们没法避免依赖props.step 。是吗？

实际上， 我们可以避免！我们可以把reducer函数放到组件内去读取props：


function Counter({ step }) {
  const [count, dispatch] = useReducer(reducer, 0);

  function reducer(state, action) {
    if (action.type === 'tick') {
      return state + step;
    } else {
      throw new Error();
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'tick' });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  return <h1>{count}</h1>;
}

即使是在这个例子中，React也保证dispatch在每次渲染中都是一样的。 所以你可以在依赖中去掉它。它不会引起effect不必要的重复执行。

你可能会疑惑：这怎么可能？在之前渲染中调用的reducer怎么“知道”新的props？答案是当你dispatch的时候，React只是记住了action - 它会在下一次渲染中再次调用reducer。在那个时候，新的props就可以被访问到，而且reducer调用也不是在effect里。

这就是为什么我倾向认为useReducer是Hooks的“作弊模式”。它可以把更新逻辑和描述发生了什么分开。结果是，这可以帮助我移除不必需的依赖，避免不必要的effect调用。
```



### useCallback与useMemo
一个是「缓存函数」， 一个是缓存「函数的返回值」
```
在组件内部，那些会成为其他useEffect依赖项的方法，建议用 useCallback 包裹，或者直接编写在引用它的useEffect中。
己所不欲勿施于人，如果你的function会作为props传递给子组件，请一定要使用 useCallback 包裹，对于子组件来说，如果每次render都会导致你传递的函数发生变化，可能会对它造成非常大的困扰。同时也不利于react做渲染优化。

不过还有一种场景，大家很容易忽视，而且还很容易将useCallback与useMemo混淆，典型场景就是：节流防抖。

function BadDemo() {
  const [count, setCount] = useState(1);
  const handleClick = debounce(() => {
    setCount(c => ++c);
  }, 1000);
  return <div onClick={handleClick}>{count}</div>;
}

function BadDemo() {
  const [count, setCount] = useState(1);
  const handleClick = debounce(() => {
    setCount(c => ++c);
  }, 1000);
  return <div onClick={handleClick}>{count}</div>;
}
我们希望防止用户连续点击触发多次变更，加了防抖，停止点击1秒后才触发 count + 1 ，这个组件在理想逻辑下是OK的。但现实是骨感的，我们的页面组件非常多，这个 BadDemo 可能由于父级什么操作就重新render了。现在假使我们页面每500毫秒会重新render一次，那么就是这样：

function BadDemo() {
  const [count, setCount] = useState(1);
  const [, setRerender] = useState(false);
  const handleClick = debounce(() => {
    setCount(c => ++c);
  }, 1000);
  useEffect(() => {
    // 每500ms，组件重新render
    window.setInterval(() => {
      setRerender(r => !r);
    }, 500);
  }, []);
  return <div onClick={handleClick}>{count}</div>;
}

每次render导致handleClick其实是不同的函数，那么这个防抖自然而然就失效了。这样的情况对于一些防重点要求特别高的场景，是有着较大的线上风险的。

那怎么办呢？自然是想加上 useCallback :

const handleClick = useCallback(debounce(() => {
  setCount(c => ++c);
}, 1000), []);
现在我们发现效果满足我们期望了，但这背后还藏着一个惊天大坑。
假如说，这个防抖的函数有一些依赖呢？比如 setCount(c => ++c); 变成了 setCount(count + 1) 。那这个函数就依赖了 count 。代码就变成了这样：

const handleClick = useCallback(
  debounce(() => {
    setCount(count + 1);
  }, 1000),
  []
);
大家会发现，你的lint规则，竟然不会要求你把 count 作为依赖项，填充到deps数组中去。这进而导致了最初的那个问题，只有第一次点击会count++。这是为什么呢？

因为传入useCallback的是一段执行语句，而不是一个函数声明。只是说它执行以后返回的新函数，我们将其作为了 useCallback 函数的入参，而这个新函数具体是个啥，其实lint规则也不知道。

const handleClick = useMemo(
  () => debounce(() => {
    setCount(count + 1);
  }, 1000),
  [count]
);
这样保证每当 count 发生变化时，会返回一个新的加了防抖功能的新函数。

总而言之，对于使用高阶函数的场景，建议一律使用 useMemo

问题2：useMemo并不能一劳永逸解决所有高阶函数场景

在示例的场景中，防抖的逻辑是：「连续点击后1秒，真正执行逻辑，在这过程中的重复点击失效」。而如果业务逻辑改成了「点击后立即发生状态变更，再之后的1秒内重复点击无效」，那么我们的代码可能就变成了。

const handleClick = useMemo( () => throttle(() => { setCount(count + 1); }, 1000), [count] );
然后发现又失效了。原因是点击以后，count立即发生了变化，然后handleClick又重复生成了新函数，这个节流就失效了。

所以这种场景，思路又变回了前面提到的，「消除依赖」 或 「使用ref」。当然啦，也可以选择自己手动实现一个 debounce 或 throttle 。我建议可以直接使用社区的库，比如react-use，或者参考他们的实现自己写两个实现。
```
# react fiber

```
React15的递归更新dom算法的时候，dom很多的话页面更新会卡顿，将更新过程从同步不可中断，变成异步可中断。
```
# useReducer

```
useState能做的事情非常有限，它只能做到更新自己维护的一个state，但是如果我们有需求，如果我们有两个互相依赖的状态，或者我们想基于一个prop来计算下一次的state，它并不能做到。幸运的是， setCount(c => c + 1)有一个更强大的姐妹模式，它的名字叫useReducer。并且在组件深度更新优化的时候，reduceer也可以做到拿到最新的值，并且把dispatch函数传给子组件，不会造成子组件的更新，因为dispatch函数不会在每次重新渲染的时候创建
```
