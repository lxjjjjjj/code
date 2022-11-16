# Vue编译器做的事情
DSL(一种特定领域语言的描述) Vue的模版语法就是一个DSL，因为模版语法和HTML语法很相似，所以所以可以按照HTML的规范来实现。（HTML使用有限自动机来完成模版语法的解析和词法分析）
* 分析模版，将其解析为模版AST
* 将模版AST转换为用语描述渲染函数的javascript AST
* 根据javascript AST生成渲染函数代码

## paser的实现原理
如何用有限状态自动机构造一个词法分析器。词法分析的过程就是状态机在不同状态之间迁移的过程。在此过程中，状态机会产生一个个Token。形成一个Token列表。我们将使用该Token列表来构造用于描述模版的AST。具体做法是，扫描Token列表并维护一个开始标签栈。每当扫描到一个开始标签节点。就将其压入栈顶。栈顶的节点始终作为下一个扫描的节点的父节点。这样当所有的Token扫描完毕后，即可构建出一颗树型AST树。

状态机根据开始标签和结束标签得到Token如下

匹配到开始标签入栈，匹配到结束标签出栈。并且放在root下。依次类推

```
'<div><p>vue</p><p>Template</p></div>'
const tokens = [
    { type: 'tag', name: 'div' },
    { type: 'tag', name: 'p' },
    { type: 'text', content: 'vue' },
    { type: 'tagEnd', name: 'p' },
    { type: 'tag', name: 'p' },
    { type: 'text', name: 'Template' },
    { type: 'tagEnd', name: 'p' },
    { type: 'tagEnd', name: 'div' }
]
```

## AST的转换和插件化架构
AST是树型数据结构，为了访问AST中的节点。我们采用深度优先的方式对AST进行遍历，在遍历的过程中，我们可以对AST节点进行各种操作，从而实现对AST的转换。为了解耦节点的访问和操作。我们设计了插件化架构，将节点的操作封装在独立的转换函数中，这些转换函数可以通过context.nodeTransforms来注册。这里context称为转换上下文。上下文对象中通常会维护程序的当前状态，例如当前访问的节点、当前访问的父节点、和当前访问节点的索引信息等。有了上下文对象及其包含的重要信息。我们就能轻松的实现节点的替换删除等能力，但有时，当前访问节点的转换工作依赖于其子节点的转换结果，所以为了优先完成子节点的转换。我们将整个转换过程分为进入和退出阶段。

```
function traverseNode(ast, context) {
    context.currentNode = ast
    const exitFns = []
    const transforms = context.nodeTransforms
    for(let i = 0; i < transforms.length; i++) {
        const onExit = transforms[i](context.currnetNode, context)
        if(onExit){
            exitFns.push(onExit)
        }
        if(!context.currentNode) return
    }
    const children = context.currentNode.children
    if(children) {
        for(let i = 0; i < children.length ; i++){
            context.parent = context.currentNode
            context.childIndex = i
            traverseNode(children[i], context)
        }
    }
    let i = exitFns.length
    while(i--){
        exitFns[i]()
    }
}
```

```
function transform(ast){
    const context = {
        currentNode: null,
        childIndex: 0,
        parent: null,
        replaceNode(node){
            context.parent.children[context,childIndex] = node
            context.currentNode = node
        },
        removeNode(node){
            if(context.parent){
                context.parent.children.splice(context.childIndex, 1)
                context.currentNode = null
            }
        },
        nodeTransforms: [
            transformElement,
            transformText
        ]
    }
    traverseNode(ast, context)
}
```

# 编译优化

编译优化就是通过编译的手段提取关键信息，并以此指导生成最优化代码的过程，具体来说，Vuejs 3的编译器会充分分析模版，提取关键信息并将其附着到对应的虚拟节点上。在运行阶段，渲染器通过这些关键信息执行‘关键路径’，从而提升性能。

编译优化的核心在于，区分动态和静态节点。Vuejs 3 会为动态节点打上补丁标志，即patchFlag， **patchFlag**会标注这个节点是只具有动态text还是动态class还是动态style，使用二进制数实现，可以合并多个patchFlag实现**靶向更新**。同时Vuejs 3还提出了Block概念，一个Block本质上也是一个虚拟节点。但与普通虚拟节点相比，会多出一个dynamicChildren数组。该数组用来收集所有动态子代节点。利用createNode 和 createBlock 函数的层层嵌套调用，实现由内向外的方式执行。再配合一个用来临时存储动态节点的节点栈。完成动态子代节点的收集。由于block会收集所有动态子代节点，所以对动态节点的操作是忽略DOM层级结构的。这会带来额外的问题，例如v-if、v-for等结构会影响DOM层级结构使DOM结构不稳定。间接导致Block树的对比算法失效。解决办法就是让v-if、v-for等指令也作为Block角色。

除了Block树以及补丁标志之外。Vuejs 3在编译优化还做了其他努力

* 静态提升，将创建静态节点的函数提升到创建动态节点函数之外和上，能够减少更新创建虚拟DOM的性能开销和内存占用
* 预字符串化，在静态提升的基础上，对静态节点进行字符串化，这样能够减少创建虚拟节点产生的性能开销和内存占用
* 缓存内联事件处理函数，避免造成不必要的组件更新，将内联事件处理函数添加到组件实例创建时的cache数组中，每次渲染函数执行时会优先读取缓存中的事件处理函数。这样无论执行多少次渲染函数，props对象中的函数都不变就不会触发Comp组件更新。
* v-once指令，缓存全部或部分虚拟节点，能够避免组件更新时重新创建虚拟DOM带来的性能开销，也能避免无用的Diff操作。创建v-once节点会执行setBlockTracking函数暂停动态block的收集。