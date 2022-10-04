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