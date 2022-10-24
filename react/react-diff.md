// https://juejin.cn/post/6919376064833667080#heading-1
// React的思路是递增法。通过对比新的列表中的节点，在原本的列表中的位置是否是递增，来判断当前节点是否需要移动。
// nextList为新的列表，prevList为旧列表
我们首先遍历nextList，并且找到每一个节点，在prevList中的位置。
```
function foo(prevList, nextList) {
    for (let i = 0; i < nextList.length; i++) {
        let nextItem = nextList[i];
        for (let j = 0; j < prevList.length; j++) {
            let prevItem = prevList[j]
            if (nextItem === prevItem) {

            }
        }
    }
}
```
找到位置以后，与上一个节点的位置进行对比，如果当前的位置大于上一个位置，说明当前节点不需要移动。因此我们要定义一个lastIndex来记录上一个节点的位置。

