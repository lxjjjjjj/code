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
