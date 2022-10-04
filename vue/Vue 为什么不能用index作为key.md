# Vue 为什么不能用index作为key

```
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      )
    )
  )
}
```

```
1.为了节省diff算法的时间，vue尽量做到同层对比，所以vue采取，不是相同节点直接销毁旧节点，创建新节点
2.而相同节点的对比中用到了节点设置的key值
3.相同节点要尽量做到复用节点
  如果新vnode是文字vnode直接利用dom api更改文字内容即可
  如果新vnode不是文字vnode，
  如果有新children没有旧的children，说明是新增，直接addVnodes
  如果有旧children没有新的children，说明是删除，直接removeVnodes
  如果新旧 children 都存在进入diff过程，双端对比
4.举例说明不能用index作为key的原因
  如果将一个数组1，2，3顺序渲染改成3，2，1顺序渲染，按照合理的逻辑来说旧的第一个vnode 是应该直接完全复用 新的第三个vnode的，因为它们本来就应该是同一个vnode，自然所有的属性都是相同的。但是按照sameNode的判断逻辑，由于key虽然相同但是值不相同，所以导致节点无法复用，需要对节点进行一系列update操作。导致优化失效了。也不能用随机数做key，那么即使是相同的节点也不能复用。因为每次的旧节点的key值都不相同。
```
# vue中key的作用和工作原理

1.key的作用主要是为了高效更新虚拟DOM 其原理是vue在patch过程中通过key可以精准判断两个节点是否是同一个从而避免频繁更新不同元素，使得整个patch过程更加高效，减少DOM操作量，提高性能。
2.另外，若不设置key可能在列表更新时引发一些隐蔽的bug，因为你认为没更新的key，它其实更新了，从而引发bug
3.vue中在使用相同标签元素的过渡切换时，也会使用到key属性，其目的也是为了让vue可以区分它们，否则vue只会替换其内部属性而不会触发过渡效果。
4.使用key会有首尾更新猜测
src/core/vdom/patch.js  updatechildren()

```
在vue的数组中插入一个值

不使用key vue的更新过程是
A B C D E
A B F C D E
更新了5次

使用key的话 vue更新过程是

//首次循环patch A
A B C D E
A B F C D E

// 第二次循环patch B
B C D E
B F C D E

// 第三次循环patch E
C D E
F C D E

// 第四次循环patch D
C D
F C D

// 第五次循环patch C
C
F C

oldch全部处理结束 newCh中剩下的F 创建F并插入到C前面

在vue中判断是否是相同节点的函数是如何判断的
两个key是undefined是相等的
只要标签相同 data没变 也不是input就是相同节点开始打补丁
a.key === b.key && (
    a.tag === b.tag && 
    a.isComment === b.isComennt &&
    isDef(a.data) === isDef(b.data)
    sameInputType(a,b)
)
```
```
function patch(oldVnode, newVnode) {
  // 比较是否为一个类型的节点
  if (sameVnode(oldVnode, newVnode)) {
    // 是：继续进行深层比较
    patchVnode(oldVnode, newVnode)
  } else {
    // 否
    const oldEl = oldVnode.el // 旧虚拟节点的真实DOM节点
    const parentEle = api.parentNode(oldEl) // 获取父节点
    createEle(newVnode) // 创建新虚拟节点对应的真实DOM节点
    if (parentEle !== null) {
      api.insertBefore(parentEle, vnode.el, api.nextSibling(oEl)) // 将新元素添加进父元素
      api.removeChild(parentEle, oldVnode.el)  // 移除以前的旧元素节点
      // 设置null，释放内存
      oldVnode = null
    }
  }

  return newVnode
}

patch关键的一步就是sameVnode方法判断是否为同一类型节点，那问题来了，怎么才算是同一类型节点呢？这个类型的标准是什么呢？
咱们来看看sameVnode方法的核心原理代码，就一目了然了
function sameVnode(oldVnode, newVnode) {
  return (
    oldVnode.key === newVnode.key && // key值是否一样
    oldVnode.tagName === newVnode.tagName && // 标签名是否一样
    oldVnode.isComment === newVnode.isComment && // 是否都为注释节点
    isDef(oldVnode.data) === isDef(newVnode.data) && // 是否都定义了data
    sameInputType(oldVnode, newVnode) // 当标签为input时，type必须是否相同
  )
}

找到对应的真实DOM，称为el
判断newVnode和oldVnode是否指向同一个对象，如果是，那么直接return
如果他们都有文本节点并且不相等，那么将el的文本节点设置为newVnode的文本节点。
如果oldVnode有子节点而newVnode没有，则删除el的子节点
如果oldVnode没有子节点而newVnode有，则将newVnode的子节点真实化之后添加到el
如果两者都有子节点，则执行updateChildren函数比较子节点，这一步很重要

function patchVnode(oldVnode, newVnode) {
  const el = newVnode.el = oldVnode.el // 获取真实DOM对象
  // 获取新旧虚拟节点的子节点数组
  const oldCh = oldVnode.children, newCh = newVnode.children
  // 如果新旧虚拟节点是同一个对象，则终止
  if (oldVnode === newVnode) return
  // 如果新旧虚拟节点是文本节点，且文本不一样
  if (oldVnode.text !== null && newVnode.text !== null && oldVnode.text !== newVnode.text) {
    // 则直接将真实DOM中文本更新为新虚拟节点的文本
    api.setTextContent(el, newVnode.text)
  } else {
    // 否则

    if (oldCh && newCh && oldCh !== newCh) {
      // 新旧虚拟节点都有子节点，且子节点不一样

      // 对比子节点，并更新
      updateChildren(el, oldCh, newCh)
    } else if (newCh) {
      // 新虚拟节点有子节点，旧虚拟节点没有

      // 创建新虚拟节点的子节点，并更新到真实DOM上去
      createEle(newVnode)
    } else if (oldCh) {
      // 旧虚拟节点有子节点，新虚拟节点没有

      //直接删除真实DOM里对应的子节点
      api.removeChild(el)
    }
  }
}

这是patchVnode里最重要的一个方法，新旧虚拟节点的子节点对比，就是发生在updateChildren方法中，接下来就结合一些图来讲，让大家更好理解吧

是怎么样一个对比方法呢？就是首尾指针法，新的子节点集合和旧的子节点集合，各有首尾两个指针

oldStart newStart 
oldEnd newEnd
oldStart newEnd
oldEnd newStart
交叉比较

如果oldStart === newStart
或者oldEnd === newEnd
那么新旧首指针或者新旧尾指针就向中间移动一个位置

如果oldStart === newEnd
或者oldEnd === newStart
那么oldStart 或者 newStart 后移一位
oldEnd 或者 newEnd 前移一位

找到了可复用的节点，我们还是先patch给元素打补丁

旧列表的尾节点oldEndNode与新列表的头节点newStartNode的key相同，是可复用的DOM节点。通过观察我们可以发现，原本在旧列表末尾的节点，却是新列表中的开头节点，没有人比他更靠前，因为他是第一个，所以我们只需要把当前的节点移动到原本旧列表中的第一个节点之前，让它成为第一个节点即可
其余节点不移动 指针也不移动

如果最后多出了节点 那么就插入就好
如果少了节点删除 设置成undefined就好
```