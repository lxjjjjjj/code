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