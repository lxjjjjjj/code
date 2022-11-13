[React技术揭秘](https://react.iamkasong.com/preparation/newConstructure.html#react16%E6%9E%B6%E6%9E%84)
# 日常开发的瓶颈

我们日常使用App，浏览网页时，有两类场景会制约快速响应：

当遇到大计算量的操作或者设备性能不足使页面掉帧，导致卡顿。

发送网络请求后，由于需要等待数据返回才能进一步操作导致不能快速响应。

这两类场景可以概括为：

CPU的瓶颈

IO的瓶颈

React是如何解决这两个瓶颈的呢

# CPU的瓶颈
**解决CPU瓶颈的关键是实现时间切片，而时间切片的关键是：将同步的更新变为可中断的异步更新。**

考虑如下Demo，我们向视图中渲染3000个li

主流浏览器刷新频率为60Hz，即每（1000ms / 60Hz）16.6ms浏览器刷新一次。

我们知道，JS可以操作DOM，GUI渲染线程与JS线程是互斥的。所以JS脚本执行和浏览器布局、绘制不能同时执行。

在每16.6ms时间内，需要完成如下工作：

JS脚本执行 -----  样式布局 ----- 样式绘制
当JS执行时间过长，超出了16.6ms，这次刷新就没有时间执行样式布局和样式绘制了。

在Demo中，由于组件数量繁多（3000个），JS脚本执行时间过长，页面掉帧，造成卡顿。

答案是：在浏览器每一帧的时间中，预留一些时间给JS线程，React利用这部分时间更新组件（可以看到，在源码 (opens new window)中，预留的初始时间是5ms）。

当预留的时间不够用时，React将线程控制权交还给浏览器使其有时间渲染UI，React则等待下一帧时间到来继续被中断的工作。

这种将长任务分拆到每一帧中，像蚂蚁搬家一样一次执行一小段任务的操作，被称为时间切片（time slice）

# IO的瓶颈
网络延迟是前端开发者无法解决的。如何在网络延迟客观存在的情况下，减少用户对网络延迟的感知？

React给出的答案是将人机交互研究的结果整合到真实的 UI 中 (opens new window)。

这里我们以业界人机交互最顶尖的苹果举例，在IOS系统中：

点击“设置”面板中的“通用”，进入“通用”界面：无需网络请求， 但是进入safiri页面需要网络请求。

如何做到用户无感知？答案是在设置页面等待停留一段时间给safari页面做网络请求，减少用户感知。

React实现了Suspense (opens new window)功能及配套的hook——useDeferredValue (opens new window)。

而在源码内部，为了支持这些特性，同样需要将同步的更新变为可中断的异步更新。

# React15架构
Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上

## Reconciler（协调器）
我们知道，在React中可以通过this.setState、this.forceUpdate、ReactDOM.render等API触发更新。

每当有更新发生时，Reconciler会做如下工作：

调用函数组件、或class组件的render方法，将返回的JSX转化为虚拟DOM
将虚拟DOM和上次更新时的虚拟DOM对比
通过对比找出本次更新中变化的虚拟DOM
通知Renderer将变化的虚拟DOM渲染到页面上

## Renderer（渲染器）

由于React支持跨平台，所以不同平台有不同的Renderer。我们前端最熟悉的是负责在浏览器环境渲染的Renderer —— ReactDOM (opens new window)。

除此之外，还有：

ReactNative (opens new window)渲染器，渲染App原生组件
ReactTest (opens new window)渲染器，渲染出纯Js对象用于测试
ReactArt (opens new window)渲染器，渲染到Canvas, SVG 或 VML (IE8)
在每次更新发生时，Renderer接到Reconciler通知，将变化的组件渲染在当前宿主环境。

## 缺点

在Reconciler中，mount的组件会调用mountComponent (opens new window)，update的组件会调用updateComponent (opens new window)。这两个方法都会递归更新子组件。

递归更新的缺点

由于递归执行，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了16ms，用户交互就会卡顿。

在上一节中，我们已经提出了解决办法——用可中断的异步更新代替同步的更新。那么React15的架构支持异步更新么？让我们看一个例子：

* 初始化时state.count = 1，每次点击按钮state.count++
* 列表中3个元素的值分别为1，2，3乘以state.count的结果

Reconciler和Renderer是交替工作的，当第一个li在页面上已经变化后，第二个li再进入Reconciler。

由于整个过程都是同步的，所以在用户看来所有DOM是同时更新的。

# React新架构

Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上

## Scheduler（调度器）

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。

其实部分浏览器已经实现了这个API，这就是requestIdleCallback (opens new window)。但是由于以下因素，React放弃使用：

* 浏览器兼容性
* 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换tab后，之前tab注册的requestIdleCallback触发的频率会变得很低

基于以上原因，React实现了功能更完备的requestIdleCallbackpolyfill，这就是Scheduler。除了在空闲时触发回调的功能外，Scheduler还提供了多种调度优先级供任务设置。

## Reconciler（协调器）

更新工作从递归变成了可以中断的循环过程。每次循环都会调用shouldYield判断当前是否有剩余时间。

```
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}
```
那么React16是如何解决中断更新时DOM渲染不完全的问题呢？

在React16中，Reconciler与Renderer不再是交替工作。当Scheduler将任务交给Reconciler后，Reconciler会为变化的虚拟DOM打上代表增/删/更新的标记，类似这样：

* export const Placement = /*             */ 0b0000000000010;
* export const Update = /*                */ 0b0000000000100;
* export const PlacementAndUpdate = /*    */ 0b0000000000110;
* export const Deletion = /*              */ 0b0000000001000;

整个Scheduler与Reconciler的工作都在内存中进行。只有当所有组件都完成Reconciler的工作，才会统一交给Renderer。

## Renderer（渲染器）
Renderer根据Reconciler为虚拟DOM打的标记，同步执行对应的DOM操作。

## 新的React更新流程变为

[原理流程图](https://react.iamkasong.com/img/process.png)

流程图中的红框中的步骤随时可能由于以下原因被中断：

* 有其他更高优任务需要先更新
* 当前帧没有剩余时间

由于红框中的工作都在内存中进行，不会更新页面上的DOM，所以即使反复中断，用户也不会看见更新不完全的DOM（即上一节演示的情况）。

# Reconciler内部采用了Fiber的架构。Fiber架构的心智模型

React核心团队成员Sebastian Markbåge (opens new window)（React Hooks的发明者）曾说：我们在React中做的就是践行代数效应（Algebraic Effects）。

## 代数效应

代数效应是函数式编程中的一个概念，用于将副作用从函数调用中分离。

例子：

```
假设我们有一个函数getTotalPicNum，传入2个用户名称后，分别查找该用户在平台保存的图片数量，最后将图片数量相加后返回。

function getTotalPicNum(user1, user2) {
  const picNum1 = getPicNum(user1);
  const picNum2 = getPicNum(user2);

  return picNum1 + picNum2;
}
在getTotalPicNum中，我们不关注getPicNum的实现，只在乎“获取到两个数字后将他们相加的结果返回”这一过程。

接下来我们来实现getPicNum。

"用户在平台保存的图片数量"是保存在服务器中的。所以，为了获取该值，我们需要发起异步请求。

为了尽量保持getTotalPicNum的调用方式不变，我们首先想到了使用async await：

async function getTotalPicNum(user1, user2) {
  const picNum1 = await getPicNum(user1);
  const picNum2 = await getPicNum(user2);

  return picNum1 + picNum2;
}
但是，async await是有传染性的 —— 当一个函数变为async后，这意味着调用他的函数也需要是async，这破坏了getTotalPicNum的同步特性。

有没有什么办法能保持getTotalPicNum保持现有调用方式不变的情况下实现异步请求呢？

我们虚构一个类似try...catch的语法 —— try...handle与两个操作符perform、resume。

function getPicNum(name) {
  const picNum = perform name;
  return picNum;
}

try {
  getTotalPicNum('kaSong', 'xiaoMing');
} handle (who) {
  switch (who) {
    case 'kaSong':
      resume with 230;
    case 'xiaoMing':
      resume with 122;
    default:
      resume with 0;
  }
}

当执行到getTotalPicNum内部的getPicNum方法时，会执行perform name。

此时函数调用栈会从getPicNum方法内跳出，被最近一个try...handle捕获。类似throw Error后被最近一个try...catch捕获。

类似throw Error后Error会作为catch的参数，perform name后name会作为handle的参数。

与try...catch最大的不同在于：当Error被catch捕获后，之前的调用栈就销毁了。而handle执行resume后会回到之前perform的调用栈。

对于case 'kaSong'，执行完resume with 230;后调用栈会回到getPicNum，此时picNum === 230

```
代数效应能够将副作用（例子中为请求图片数量）从函数逻辑中分离，使函数关注点保持纯粹。

并且，从例子中可以看出，perform resume不需要区分同步异步

## 代数效应在React中的应用

那么代数效应与React有什么关系呢？最明显的例子就是Hooks。

对于类似useState、useReducer、useRef这样的Hook，我们不需要关注FunctionComponent的state在Hook中是如何保存的，React会为我们处理。

我们只需要假设useState返回的是我们想要的state，并编写业务逻辑就行。

官方的Suspense Demo(opens new window)在Demo中ProfileDetails用于展示用户名称。而用户名称是异步请求的。但是Demo中完全是同步的写法。

## 代数效应与Generator
generator就是可以中断的，但是React抛弃了它，因为

* 类似async，Generator也是传染性的，使用了Generator则上下文的其他函数也需要作出改变。这样心智负担比较重。
* Generator执行的中间状态是上下文关联的。

只考虑“单一优先级任务的中断与继续”情况下Generator可以很好的实现异步可中断更新。

但是当我们考虑“高优先级任务插队”的情况，如果此时已经完成doExpensiveWorkA与doExpensiveWorkB计算出x与y。

此时B组件接收到一个高优更新，由于Generator执行的中间状态是上下文关联的，所以计算y时无法复用之前已经计算出的x，需要重新计算。

如果通过全局变量保存之前执行的中间状态，又会引入新的复杂度。

# Fiber的起源
在新的React架构一节中，我们提到的虚拟DOM在React中有个正式的称呼——Fiber

## Fiber的含义

作为架构来说，之前React15的Reconciler采用递归的方式执行，数据保存在递归调用栈中，所以被称为stack Reconciler。React16的Reconciler基于Fiber节点实现，被称为Fiber Reconciler。

作为静态的数据结构来说，每个Fiber节点对应一个React element，保存了该组件的类型（函数组件/类组件/原生组件...）、对应的DOM节点等信息。

作为动态的工作单元来说，每个Fiber节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新...）。

## Fiber的结构 --- fiber节点的属性定义

```
function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // 作为静态数据结构的属性

  // Fiber对应组件的类型 Function/Class/Host...
  this.tag = tag;
  // key属性
  this.key = key;
  // 大部分情况同type，某些情况不同，比如FunctionComponent使用React.memo包裹
  this.elementType = null;
  // 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
  this.type = null;
  // Fiber对应的真实DOM节点
  this.stateNode = null;

  // 用于连接其他Fiber节点形成Fiber树

  // 指向父级Fiber节点
  // 这里需要提一下，为什么父级指针叫做return而不是parent或者father呢？
  // 因为作为一个工作单元，return指节点执行完completeWork（本章后面会介绍）后会返回的下一个节点。
  // 子Fiber节点及其兄弟节点完成工作后会返回其父级节点，所以用return指代父级节点
  this.return = null;
  // 指向子Fiber节点
  this.child = null;
  // 指向右边第一个兄弟Fiber节点
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  // 作为动态的工作单元的属性
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  this.effectTag = NoEffect;
  this.nextEffect = null;

  this.firstEffect = null;
  this.lastEffect = null;

  // 调度优先级相关
  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  // 指向该fiber在另一次更新时对应的fiber
  this.alternate = null;
}
```
## 什么是“双缓存”
Fiber节点构成的Fiber树就对应DOM树。那么如何更新DOM呢？这需要用到被称为“双缓存”的技术。

当我们用canvas绘制动画，每一帧绘制前都会调用ctx.clearRect清除上一帧的画面。

如果当前帧画面计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏。

为了解决这个问题，我们可以在内存中绘制当前帧动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现从白屏到出现画面的闪烁情况。

这种在内存中构建并直接替换的技术叫做双缓存 (opens new window)。

React使用“双缓存”来完成Fiber树的构建与替换——对应着DOM树的创建与更新。

## 双缓存Fiber树

在React中最多会同时存在两棵Fiber树。当前屏幕上显示内容对应的Fiber树称为current Fiber树，正在内存中构建的Fiber树称为workInProgress Fiber树。

current Fiber树中的Fiber节点被称为current fiber，workInProgress Fiber树中的Fiber节点被称为workInProgress fiber，他们通过alternate属性连接。

currentFiber.alternate === workInProgressFiber;
workInProgressFiber.alternate === currentFiber;

React应用的根节点通过使current指针在不同Fiber树的rootFiber间切换来完成current Fiber树指向的切换。

即当workInProgress Fiber树构建完成交给Renderer渲染在页面上后，应用根节点的current指针指向workInProgress Fiber树，此时workInProgress Fiber树就变为current Fiber树。

每次状态更新都会产生新的workInProgress Fiber树，通过current与workInProgress的替换，完成DOM更新。

## mount时
```
function App() {
  const [num, add] = useState(0);
  return (
    <p onClick={() => add(num + 1)}>{num}</p>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```
首次执行ReactDOM.render会创建fiberRootNode（源码中叫fiberRoot）和rootFiber。其中fiberRootNode是整个应用的根节点，rootFiber是<App/>所在组件树的根节点。
之所以要区分fiberRootNode与rootFiber，是因为在应用中我们可以多次调用ReactDOM.render渲染不同的组件树，他们会拥有不同的rootFiber。但是整个应用的根节点只有一个，那就是fiberRootNode。

在构建workInProgress Fiber树时会尝试复用current Fiber树中已有的Fiber节点内的属性，在首屏渲染时只有rootFiber存在对应的current fiber（即rootFiber.alternate）。

## update

接下来我们点击p节点触发状态改变，这会开启一次新的render阶段并构建一棵新的workInProgress Fiber 树。

和mount时一样，workInProgress fiber的创建可以复用current Fiber树对应的节点数据。

这个决定是否复用的过程就是Diff算法

workInProgress Fiber 树在render阶段完成构建后进入commit阶段渲染到页面上。渲染完毕后，workInProgress Fiber 树变为current Fiber 树。


# reconciler阶段

reconciler阶段的工作可以分为“递”阶段和“归”阶段。其中“递”阶段会执行beginWork，“归”阶段会执行completeWork

## beginWork

beginWork的工作是传入当前Fiber节点，创建子Fiber节点。

```
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // ...省略函数体
}
```
其中传参：

current：当前组件对应的Fiber节点在上一次更新时的Fiber节点，即workInProgress.alternate
workInProgress：当前组件对应的Fiber节点
renderLanes：优先级相关，在讲解Scheduler时再讲解

从双缓存机制一节我们知道，除rootFiber以外， 组件mount时，由于是首次渲染，是不存在当前组件对应的Fiber节点在上一次更新时的Fiber节点，即mount时current === null。

组件update时，由于之前已经mount过，所以current !== null。

所以我们可以通过current === null ?来区分组件是处于mount还是update。

基于此原因，beginWork的工作可以分为两部分：

update时：如果current存在，在满足一定条件时可以复用current节点，这样就能克隆current.child作为workInProgress.child，而不需要新建workInProgress.child。

mount时：除fiberRootNode以外，current === null。会根据fiber.tag不同，创建不同类型的子Fiber节点

### update时

我们可以看到，满足如下情况时didReceiveUpdate === false（即可以直接复用前一次更新的子Fiber，不需要新建子Fiber）

oldProps === newProps && workInProgress.type === current.type，即props与fiber.type不变

!includesSomeLane(renderLanes, updateLanes)，即当前Fiber节点优先级不够

都可以复用上一次创建的节点。

### mount时：根据tag不同，创建不同的Fiber节点

### reconcileChildren

对于mount的组件，他会创建新的子Fiber节点

对于update的组件，他会将当前组件与该组件在上次更新时对应的Fiber节点比较（也就是俗称的Diff算法），将比较的结果生成新Fiber节点

从代码可以看出，和beginWork一样，他也是通过current === null ?区分mount与update。

不论走哪个逻辑，最终他会生成新的子Fiber节点并赋值给workInProgress.child，作为本次beginWork返回值 (opens new window)，并作为下次performUnitOfWork执行时workInProgress的传参 (opens new window)。

mountChildFibers与reconcileChildFibers这两个方法的逻辑基本一致。唯一的区别是：reconcileChildFibers会为生成的Fiber节点带上effectTag属性，而mountChildFibers不会。

### effectTag
我们知道，render阶段的工作是在内存中进行，当工作结束后会通知Renderer需要执行的DOM操作。要执行DOM操作的具体类型就保存在fiber.effectTag中。

比如：

// DOM需要插入到页面中
export const Placement = /*                */ 0b00000000000010;
// DOM需要更新
export const Update = /*                   */ 0b00000000000100;
// DOM需要插入到页面中并更新
export const PlacementAndUpdate = /*       */ 0b00000000000110;
// DOM需要删除
export const Deletion = /*                 */ 0b00000000001000;

通过二进制表示effectTag，可以方便的使用位操作为fiber.effectTag赋值多个effect。

那么，如果要通知Renderer将Fiber节点对应的DOM节点插入页面中，需要满足两个条件：

fiber.stateNode存在，即Fiber节点中保存了对应的DOM节点

(fiber.effectTag & Placement) !== 0，即Fiber节点存在Placement effectTag

我们知道，mount时，fiber.stateNode === null，且在reconcileChildren中调用的mountChildFibers不会为Fiber节点赋值effectTag。那么首屏渲染如何完成呢？

针对第一个问题，fiber.stateNode会在completeWork中创建，我们会在下一节介绍。

第二个问题的答案十分巧妙：假设mountChildFibers也会赋值effectTag，那么可以预见mount时整棵Fiber树所有节点都会有Placement effectTag。那么commit阶段在执行DOM操作时每个节点都会执行一次插入操作，这样大量的DOM操作是极低效的。

为了解决这个问题，在mount时只有rootFiber会赋值Placement effectTag，在commit阶段只会执行一次插入操作。

## completeWork
类似beginWork，completeWork也是针对不同fiber.tag调用不同的处理逻辑。

和beginWork一样，我们根据current === null ?判断是mount还是update。

### update
同时针对HostComponent，判断update时我们还需要考虑workInProgress.stateNode != null ?（即该Fiber节点是否存在对应的DOM节点）

当update时，Fiber节点已经存在对应DOM节点，所以不需要生成DOM节点。需要做的主要是处理props，比如：

onClick、onChange等回调函数的注册
处理style prop
处理DANGEROUSLY_SET_INNER_HTML prop
处理children prop

complete阶段最主要的逻辑是调用updateHostComponent方法。

if (current !== null && workInProgress.stateNode != null) {
  // update的情况
  updateHostComponent(
    current,
    workInProgress,
    type,
    newProps,
    rootContainerInstance,
  );
}
你可以从这里 (opens new window)看到updateHostComponent方法定义。

在updateHostComponent内部，被处理完的props会被赋值给workInProgress.updateQueue，并最终会在commit阶段被渲染在页面上。

workInProgress.updateQueue = (updatePayload: any);
其中updatePayload为数组形式，他的偶数索引的值为变化的prop key，奇数索引的值为变化的prop value。

### mount

mount时的主要逻辑包括三个：

为Fiber节点生成对应的DOM节点
将子孙DOM节点插入刚生成的DOM节点中
与update逻辑中的updateHostComponent类似的处理props的过程

mount时只会在rootFiber存在Placement effectTag。那么commit阶段是如何通过一次插入DOM操作（对应一个Placement effectTag）将整棵DOM树插入页面的呢？

原因就在于completeWork中的appendAllChildren方法。

由于completeWork属于“归”阶段调用的函数，每次调用appendAllChildren时都会将已生成的子孙DOM节点插入当前生成的DOM节点下。那么当“归”到rootFiber时，我们已经有一个构建好的离屏DOM树。

### effectList
作为DOM操作的依据，commit阶段需要找到所有有effectTag的Fiber节点并依次执行effectTag对应操作。难道需要在commit阶段再遍历一次Fiber树寻找effectTag !== null的Fiber节点么？

这显然是很低效的。

为了解决这个问题，**在completeWork的上层函数completeUnitOfWork中，每个执行完completeWork且存在effectTag的Fiber节点会被保存在一条被称为effectList的单向链表中**。

effectList中第一个Fiber节点保存在fiber.firstEffect，最后一个元素保存在fiber.lastEffect。

类似appendAllChildren，在“归”阶段，所有有effectTag的Fiber节点都会被追加在effectList中，最终形成一条以rootFiber.firstEffect为起点的单向链表。

                       nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
这样，在commit阶段只需要遍历effectList就能执行所有effect了。


由于每个fiber的effectList只包含他的子孙节点

# Fiber和Reconciler或者说和React之间是什么关系
reconciler阶段实现异步可中断更新，

fiber采用了链表结构，每个节点有return指向父节点，sibling指向兄弟节点，child指向第一个子节点。指针停留的位置可以标记上一个分帧中diff算法停留的位置，做到下一个分帧从哪里开始重新diff。每个节点diff前会利用shouldYield判断是否要继续在内存继续执行diff对比。(react处于兼容性和requestIdleCallback本身在浏览器中的切换tab执行变慢的问题自己封装实现了一个)。因为fiber采用了双缓存机制便于一次性的少量更新dom。通过更改fiberRootNode指针的指向实现两个fiber树current和workInProgress树的替换。父组件和chilren都是根据current是否为null来区分update和mount阶段的。在reconciler阶段分为beginwork和completeWork阶段。beginWork阶段根据props、tag、和优先级判断是否可以复用节点来更新fiber的effectTag属性。值得一提的是(mount阶段没有fiber.stateNode因此为了减少插入操作，在mount阶段，react只会将亘节点标记effectTag实现一次插入操作)。complete阶段，会处理节点的props和事件绑定的变化将新的props保存在fiber的updateQueue中。并且收集effectTag变化的节点整理出effectList单链表便于commit阶段统一处理。综上鉴于fiber中保存了diff工作中的props变化属性，以及虚拟dom节点之间关系的属性。所以可以在reconciler阶段做到异步可中断更新。


# commit
commitRoot方法是commit阶段工作的起点。fiberRootNode会作为传参。
在rootFiber.firstEffect上保存了一条需要执行副作用的Fiber节点的单向链表effectList，这些Fiber节点的updateQueue中保存了变化的props。

这些副作用对应的DOM操作在commit阶段执行。

除此之外，一些生命周期钩子（比如componentDidXXX）、hook（比如useEffect）需要在commit阶段执行。

commit阶段的主要工作（即Renderer的工作流程）分为三部分：

* before mutation阶段（执行DOM操作前）

* mutation阶段（执行DOM操作）

* layout阶段（执行DOM操作后）

在before mutation阶段之前和layout阶段之后还有一些额外工作，涉及到比如useEffect的触发、优先级相关的重置、ref的绑定/解绑。

## before mutation之前

commitRootImpl方法中直到第一句if (firstEffect !== null)之前属于before mutation之前。

我们大体看下他做的工作，现在你还不需要理解他们：
```
do {
    // 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，所以这里要一直遍历执行直到没有任务
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);

  // root指 fiberRootNode
  // root.finishedWork指当前应用的rootFiber
  const finishedWork = root.finishedWork;

  // 凡是变量名带lane的都是优先级相关
  const lanes = root.finishedLanes;
  if (finishedWork === null) {
    return null;
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;

  // 重置Scheduler绑定的回调函数
  root.callbackNode = null;
  root.callbackId = NoLanes;

  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  // 重置优先级相关变量
  markRootFinished(root, remainingLanes);

  // 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。
  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }

  // 重置全局变量
  if (root === workInProgressRoot) {
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
  }

  // 将effectList赋值给firstEffect
  // 由于每个fiber的effectList只包含他的子孙节点
  // 所以根节点如果有effectTag则不会被包含进来
  // 所以这里将有effectTag的根节点插入到effectList尾部
  // 这样才能保证有effect的fiber都在effectList中
  let firstEffect;
  if (finishedWork.effectTag > PerformedWork) {
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 根节点没有effectTag
    firstEffect = finishedWork.firstEffect;
  }
```
可以看到，before mutation之前主要做一些变量赋值，状态重置的工作。

这一长串代码我们只需要关注最后赋值的firstEffect，在commit的三个子阶段都会用到他。

## layout之后
```
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;

// useEffect相关
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
} else {}

// 性能优化相关
if (remainingLanes !== NoLanes) {
  if (enableSchedulerTracing) {
    // ...
  }
} else {
  // ...
}

// 性能优化相关
if (enableSchedulerTracing) {
  if (!rootDidHavePassiveEffects) {
    // ...
  }
}

// ...检测无限循环的同步任务
if (remainingLanes === SyncLane) {
  // ...
} 

// 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度
ensureRootIsScheduled(root, now());

// ...处理未捕获错误及老版本遗留的边界问题


// 执行同步任务，这样同步任务不需要等到下次事件循环再执行
// 比如在 componentDidMount 中执行 setState 创建的更新会在这里被同步执行
// 或useLayoutEffect
flushSyncCallbackQueue();
```
return null;
你可以在这里 (opens new window)看到这段代码

主要包括三点内容：

useEffect相关的处理。
我们会在讲解layout阶段时讲解。

性能追踪相关。
源码里有很多和interaction相关的变量。他们都和追踪React渲染时间、性能相关，在Profiler API (opens new window)和DevTools (opens new window)中使用。

你可以在这里看到interaction的定义(opens new window)

在commit阶段会触发一些生命周期钩子（如 componentDidXXX）和hook（如useLayoutEffect、useEffect）。
在这些回调方法中可能触发新的更新，新的更新会开启新的render-commit流程。

## before mutation 阶段
before mutation阶段的代码很短，整个过程就是遍历effectList并调用

整体可以分为三部分：

* 处理DOM节点渲染/删除后的 autoFocus、blur 逻辑。

* 调用getSnapshotBeforeUpdate生命周期钩子。

* 调度useEffect。


### 调度useEffect
在这几行代码内，scheduleCallback方法由Scheduler模块提供，用于以某个优先级异步调度一个回调函数。

// 调度useEffect
if ((effectTag & Passive) !== NoEffect) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      // 触发useEffect
      flushPassiveEffects();
      return null;
    });
  }
}
在此处，被异步调度的回调函数就是触发useEffect的方法flushPassiveEffects。

我们接下来讨论useEffect如何被异步调度，以及为什么要异步（而不是同步）调度。

#### 如何异步调度
在flushPassiveEffects方法内部会从全局变量rootWithPendingPassiveEffects获取effectList。关于flushPassiveEffects的具体讲解参照useEffect与useLayoutEffect一节

在completeWork一节我们讲到，effectList中保存了需要执行副作用的Fiber节点。其中副作用包括

插入DOM节点（Placement）
更新DOM节点（Update）
删除DOM节点（Deletion）

**除此外，当一个FunctionComponent含有useEffect或useLayoutEffect，他对应的Fiber节点也会被赋值effectTag。**

在flushPassiveEffects方法内部会遍历rootWithPendingPassiveEffects（即effectList）执行effect回调函数。

如果在此时直接执行，rootWithPendingPassiveEffects === null。

那么rootWithPendingPassiveEffects会在何时赋值呢？

在上一节layout之后的代码片段中会根据rootDoesHavePassiveEffects === true?决定是否赋值rootWithPendingPassiveEffects。

const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
}
所以整个useEffect异步调用分为三步：

before mutation阶段在scheduleCallback中调度flushPassiveEffects
layout阶段之后将effectList赋值给rootWithPendingPassiveEffects
scheduleCallback触发flushPassiveEffects，flushPassiveEffects内部遍历rootWithPendingPassiveEffects


## mutation阶段
类似before mutation阶段，mutation阶段也是遍历effectList，执行函数。这里执行的是commitMutationEffects。

* 根据ContentReset effectTag重置文字节点
* 更新ref
* 根据effectTag分别处理，其中effectTag包括(Placement | Update | Deletion | Hydrating)
我们关注步骤三中的Placement | Update | Deletion。Hydrating作为服务端渲染相关，我们先不关注。

mutation阶段会遍历effectList，依次执行commitMutationEffects。该方法的主要工作为“根据effectTag调用不同的处理函数处理Fiber。
### Placement effect
当Fiber节点含有Placement effectTag，意味着该Fiber节点对应的DOM节点需要插入到页面中。

调用的方法为commitPlacement。


获取父级DOM节点。其中finishedWork为传入的Fiber节点。
const parentFiber = getHostParentFiber(finishedWork);
// 父级DOM节点
const parentStateNode = parentFiber.stateNode;
获取Fiber节点的DOM兄弟节点
const before = getHostSibling(finishedWork);
根据DOM兄弟节点是否存在决定调用parentNode.insertBefore或parentNode.appendChild执行DOM插入操作。

### Update effect
当Fiber节点含有Update effectTag，意味着该Fiber节点需要更新。调用的方法为commitWork，他会根据Fiber.tag分别处理。


#FunctionComponent mutation
当fiber.tag为FunctionComponent，会调用commitHookEffectListUnmount。该方法会遍历effectList，执行所有useLayoutEffect hook的销毁函数。

你可以在这里 (opens new window)看到commitHookEffectListUnmount源码

所谓“销毁函数”，见如下例子：

useLayoutEffect(() => {
  // ...一些副作用逻辑

  return () => {
    // ...这就是销毁函数
  }
})

### Deletion effect
当Fiber节点含有Deletion effectTag，意味着该Fiber节点对应的DOM节点需要从页面中删除。调用的方法为commitDeletion。

递归调用Fiber节点及其子孙Fiber节点中fiber.tag为ClassComponent的componentWillUnmount (opens new window)生命周期钩子，从页面移除Fiber节点对应DOM节点
解绑ref
调度useEffect的销毁函数

## layout
该阶段之所以称为layout，因为该阶段的代码都是在DOM渲染完成（mutation阶段完成）后执行的。

该阶段触发的生命周期钩子和hook可以直接访问到已经改变后的DOM，即该阶段是可以参与DOM layout的阶段。

从这节我们学到，layout阶段会遍历effectList，依次执行commitLayoutEffects。该方法的主要工作为“根据effectTag调用不同的处理函数处理Fiber并更新ref。current Fiber树切换

# 杂谈

react 所有的状态更新，都是从根组件开始的，当应用组件树比较庞大时，一旦状态开始变更，组件树层层递归开始更新，js 主线程就不得不停止其他工作。例如组件树一共有 1000 个组件需要更新，每个组件更新所需要的时间为 1s，那么在这 1s 内浏览器都无法做其他的事情，用户的点击输入等交互事件、页面动画等都不会得到响应，体验就会非常的差

有了fiber之后将更新渲染耗时长的大任务分为许多小片，每个小片的任务执行完成之后，都去执行其他高优先级的任务(例如用户点击输入事件、动画等)，这样 js 的主线程就不会被 react 独占，虽然任务执行的总时间不变，但是页面能够及时响应高优先级任务，显得不会卡顿了。
react会在每一帧的空闲时间执行更新dom操作，fiber 分片模式下，浏览器主线程能够定期被释放，保证了渲染的帧率，函数的堆栈调用如下（波谷表示执行分片任务，波峰表示执行其他高优先级任务）

每个fiber节点都有stateNode指向真实的dom节点，存储着return 指向父fiber，child 指向第一个儿子节点 sibling指向下一个兄弟节点 ， index存储着父fiber下面子fiber的下标，在 react 协调时，beginWork 和 completeWork 等流程时，都会根据 tag 类型的不同，去执行不同的函数处理 fiber 节点。
key 和 type 两项用于 react diff 过程中确定 fiber 是否可以复用

stateNode 用于记录当前 fiber 所对应的真实 dom 节点或者当前虚拟组件的实例，这么做的原因第一是为了实现 Ref ，第二是为了实现真实 dom 的跟踪

对于react中的副作用，在react中修改state，props，ref等数据都会引起dom的变化，这种在render阶段不能完成的工作是副作用

react用flags记录每个节点diff后需要更变的状态比如dom的添加、替换和删除并且在render阶段，react会采用深度遍历将每个有副作用的fiber筛选出来构成一个effect list链表，firstEffect 指向第一个有副作用的 fiber 节点，lastEffect 指向最后一个有副作用的节点，中间的节点全部通过 nextEffect 链接，最终形成 Effect 链表

在 commit 阶段，React 拿到 Effect list 链表中的数据后，根据每一个 fiber 节点的 flags 类型，对相应的 DOM 进行更改。


lane 代表 react 要执行的 fiber 任务的优先级，通过这个字段，render 阶段 react 确定应该优先将哪些任务提交到 commit 阶段去执行

Lanes 也是用 31 位的二进制数表示，表示了 31 条赛道，位数越小的赛道，代表的优先级越高。
例如 InputDiscreteHydrationLane、InputDiscreteLanes、InputContinuousHydrationLane 等用户交互引起的更新的优先级较高，DefaultLanes 这种请求数据引起更新的优先级中等，而 OffscreenLane、IdleLanes 这种优先级较低。
优先级越低的任务，在 render 阶段越容易被打断，commit 执行的时机越靠后。

当 react 的状态发生更新时，当前页面所对应的 fiber 树称为 current Fiber，同时 react 会根据新的状态构建一颗新的 fiber 树，称为 workInProgress Fiber。current Fiber 中每个 fiber 节点通过 alternate 字段，指向 workInProgress Fiber 中对应的 fiber 节点。同样 workInProgress Fiber 中的 fiber
节点的 alternate 字段也会指向 current Fiber 中对应的 fiber 节点

执行mount方法时，每个节点开始创建时，执行 beginWork 流程，直至该节点的所有子孙节点都创建(更新)完成后，执行 completeWork 流程

update 时，react 会根据新的 jsx 内容创建新的 workInProgress fiber，还是通过深度优先遍历，对发生改变的 fiber 打上不同的 flags 副作用标签，并通过 firstEffect、nextEffect 等字段形成 Effect List 链表

触发更新的方式主要有以下几种：ReactDOM.render、setState、forUpdate 以及 hooks 中的 useState 等

ReactDOM.render 作为 react 应用程序的入口函数，在页面首次渲染时便会触发，页面 dom 的首次创建，也属于触发 react 更新的一种情况

首先校验根节点 root 是否存在，若不存在，创建根节点 root、rootFiber 和 fiberRoot 并绑定它们之间的引用关系，然后调用 updateContainer 去非批量执行后面的更新流程；若存在，直接调用 updateContainer 去批量执行后面的更新流程。

updateContainer 函数中，主要做了以下几件事情：

requestEventTime：获取更新触发的时间
requestUpdateLane：获取当前任务优先级
createUpdate：创建更新
enqueueUpdate：将任务推进更新队列
scheduleUpdateOnFiber：调度更新

setState调用触发器updater上enqueueSetState，enqueueSetState和updateContainer做的事情一样

现在讨论的是相同优先级的任务的更新触发时间

无论是什么更新操作都会触发获取更新时间的操作，react 执行更新过程中，会将更新任务拆解，每一帧优先执行高优先级的任务，从而保证用户体验的流畅，对于相同时间的任务，会批量去执行。同样优先级的任务，currentEventTime 值越小，就会越早执行。

1.如果现在正在render或者commit阶段并且前后两次更新时间差小于10ms就直接返回上次计算的这一优先级任务的触发时间，将上次的更新任务和这次的更新任务一起批量执行。

2.当 currentEventTime 不等于 NoTimestamp 时，则判断其正在执行浏览器事件，react 想要同样优先级的更新任务保持相同的时间，所以直接返回上次的 currentEventTime

3.如果是 react 上次中断之后的首次更新，那么给 currentEventTime 赋一个新的值

划分更新任务优先级看下面的react优先级

更新任务创建好了并且关联到了 fiber 上，下面就该到了 react render 阶段的核心之一 —— reconciler 阶段。

检查是否有循环更新，避免例如在类组件 render 函数中调用了 setState 这种死循环的情况。自底向上更新 child.fiberLanes，标记 root 有更新，将 update 的 lane 插入到root.pendingLanes中，同步任务，采用同步渲染，如果本次是同步更新，并且当前还未开始渲染，表示当前的 js 主线程空闲，并且没有 react 任务在执行，调用 performSyncWorkOnRoot 执行同步更新任务，如果本次时同步更新，但是有 react 任务正在执行，调用 ensureRootIsScheduled去复用当前正在执行的任务，让其将本次的更新一并执行。如果本次更新是异步任务，调用 ensureRootIsScheduled 执行可中断更新。

performSyncWorkOnRoot 里面主要做了两件事：

renderRootSync 从根节点开始进行同步渲染任务
commitRoot 执行 commit 流程
当任务类型为同步类型，但是 js 主线程非空闲时。会执行 ensureRootIsScheduled 方法

如果有正在执行的任务，任务优先级没改变，说明可以复用之前的任务一起执行，任务优先级改变了，说明不能复用。取消正在执行的任务，重新去调度，进行一个新的调度，如果是同步任务优先级，执行 performSyncWorkOnRoot，如果是批量同步任务优先级，执行 performSyncWorkOnRoot，如果不是批量同步任务优先级，执行 performConcurrentWorkOnRoot，ensureRootIsScheduled 方法中，会先看加入了新的任务后根节点任务优先级是否有变更，如果无变更，说明新的任务会被当前的 schedule 一同执行；如果有变更，则创建新的 schedule，然后也是调用performSyncWorkOnRoot(root) 方法开始执行同步任务

执行可中断更新

当任务的类型不是同步类型时，react 也会执行 ensureRootIsScheduled 方法，因为是异步任务，最终会执行 performConcurrentWorkOnRoot 方法，去进行可中断的更新，下面会详细讲到。

workLoop

同步 workLoopSync 中，只要 workInProgress（workInProgress fiber 树中新创建的 fiber 节点） 不为 null，就会一直循环，执行 performUnitOfWork 函数。

可中断 相比于 workLoopSync, workLoopConcurrent 在每一次对 workInProgress 执行 performUnitOfWork 前，会先判断以下 shouldYield() 的值。若为 false 则继续执行，若为 true 则中断执行

实现帧空闲调度任务

react通过自己实现了requestIdleCallback，由于 requestIdleCallback 的兼容性问题以及 react 对应部分高优先级任务可能牺牲部分帧的需要。

当前任务已超时，插入超时队列，任务未超时，插入调度任务队列，符合更新调度执行的标志，requestHostCallback 调度任务，获取当前设备每帧的时长，帧结束前执行任务， 更新当前帧的结束时间，如果还有调度任务就执行，没有调度任务就通过 postMessage 通知结束

react 通过 new MessageChannel() 创建了消息通道，当发现 js 线程空闲时，通过 postMessage 通知 scheduler 开始调度。然后 react 接收到调度开始的通知时，就通过 performWorkUntilDeadline 函数去更新当前帧的结束时间，以及执行任务。从而实现了帧空闲时间的任务调度

如何判断任务可中断

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

我们看一下 shouYield 的值是如何获取的：

export function unstable_shouldYield() {
  return getCurrentTime() >= deadline;
}

getCurrentTime 获取的是当前的时间戳，deadline 上面讲到了是浏览器每一帧结束的时间戳。也就是说 concurrent 模式下，react 会将这些非同步任务放到浏览器每一帧空闲时间段去执行，若每一帧结束未执行完，则中断当前任务，待到浏览器下一帧的空闲再继续执行。



commit 阶段

commit 阶段主要做的是根据之前生成的 effectList，对相应的真实 dom 进行更新和渲染，这个阶段是不可中断的

1.获取 effectList 链表，如果 root 上有 effect，则将其也添加进 effectList 中
2.对 effectList 进行第一次遍历，执行 commitBeforeMutationEffects 函数来更新class组件实例上的state、props 等，以及执行 getSnapshotBeforeUpdate 生命周期函数
3.对 effectList 进行第二次遍历，执行 commitMutationEffects 函数来完成副作用的执行，主要包括重置文本节点以及真实 dom 节点的插入、删除和更新等操作。
4.对 effectList 进行第三次遍历，执行 commitLayoutEffects 函数，去触发 componentDidMount、componentDidUpdate 以及各种回调函数等
5.最后进行一点变量还原之类的收尾，就完成了 commit 阶段

执行diff算法

diff 策略

react 将 diff 算法优化到 O(n) 的时间复杂度，基于了以下三个前提策略：

只对同级元素进行比较。Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计，如果出现跨层级的 dom 节点更新，则不进行复用。
两个不同类型的组件会产生两棵不同的树形结构。
对同一层级的子节点，开发者可以通过 key 来确定哪些子元素可以在不同渲染中保持稳定。

上面的三种 diff 策略，分别对应着 tree diff、component diff 和 element diff。

tree diff

节点结构由 root-> a -> c、d 变成 root -> b -> a -> c、d

1.在 root 节点下删除 A 节点
2.在 B 节点下创建 A 子节点
3.在新创建的 A 子节点下创建 C、D 节点

component diff

对于组件之间的比较，只要它们的类型不同，就判断为它们是两棵不同的树形结构，直接会将它们给替换掉

左边树 B 节点和右边树 K 节点除了类型不同(比如 B 为 div 类型，K 为 p 类型)，内容完全一致，但 react 依然后直接替换掉整个节点。实际经过的变换是：

在 root 节点下创建 K 节点
在 K 节点下创建 E、F 节点
在 F 节点下创建 G、H 节点
在 root 节点下删除 B 子节点

element diff

react 对于同层级的元素进行比较时，会通过 key 对元素进行比较以识别哪些元素可以稳定的渲染。同级元素的比较存在插入、删除和移动三种操作

[](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dff49d5527094ed99d39f17618e9cbc1~tplv-k3u1fbpfcp-zoom-in-crop-mark:1304:0:0:0.awebp?)