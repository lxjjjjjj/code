// 双端对比 头尾节点分别对比 & 头尾节点交叉对比

// https://juejin.cn/post/6919376064833667080

// https://github.com/sunyanzhe/virtual-dom
import mount from "../mount";
import patch from "../patch";
// 理想情况 每次双端对比都能找到可以复用的节点 那么或者移动(头尾交换) 否则不移动（头头相同、尾尾相同）
// 非理想情况 每次双端对比都找不到可以复用的节点 我们只能拿新列表的第一个节点去旧列表中找与其key相同的节点。
// 找节点的时候其实会有两种情况：一种在旧列表中找到了，另一种情况是没找到。
// 当我们在旧列表中找到对应的VNode，我们只需要将找到的节点的DOM元素，移动到开头就可以了。
// DOM移动后，由我们将旧列表中的节点改为undefined，这是至关重要的一步，因为我们已经做了节点的移动了所以我们不需要进行再次的对比了。最后我们将头指针newStartIndex向后移一位。
// 如果在旧列表中没有找到复用节点呢？很简单，直接创建一个新的节点放到最前面就可以了，然后后移头指针newStartIndex。
// 最后当旧列表遍历到undefind时就跳过当前节点。
// 还有两种情况分别是 旧列表遍历完了 只需要在新列表添加节点就好了
// 新列表遍历完了 旧列表还有数据 只需要把节点删除就可以了
export default function vue2diff(prevChildren, nextChildren, parent) {
  let prevStartIndex = 0,
    nextStartIndex = 0,
    prevEndIndex = prevChildren.length - 1,
    nextEndIndex = nextChildren.length - 1,
    prevStartNode = prevChildren[prevStartIndex],
    prevEndNode = prevChildren[prevEndIndex],
    nextStartNode = nextChildren[nextStartIndex],
    nextEndNode = nextChildren[nextEndIndex];
  while (prevStartIndex <= prevEndIndex && nextStartIndex <= nextEndIndex) {
    if (prevStartNode === undefined) {
      prevStartNode = prevChildren[++prevStartIndex]
    } else if (prevEndNode === undefined) {
      prevEndNode = prevChildren[--prevEndIndex]
    } else if (prevStartNode.key === nextStartNode.key) {
      patch(prevStartNode, nextStartNode, parent)

      prevStartIndex++
      nextStartIndex++
      prevStartNode = prevChildren[prevStartIndex]
      nextStartNode = nextChildren[nextStartIndex]
    } else if (prevEndNode.key === nextEndNode.key) {
      patch(prevEndNode, nextEndNode, parent)

      prevEndIndex--
      nextEndIndex--
      prevEndNode = prevChildren[prevEndIndex]
      nextEndNode = nextChildren[nextEndIndex]
    } else if (prevStartNode.key === nextEndNode.key) {
      patch(prevStartNode, nextEndNode, parent)
      parent.insertBefore(prevStartNode.el, prevEndNode.el.nextSibling)
      prevStartIndex++
      nextEndIndex--
      prevStartNode = prevChildren[prevStartIndex]
      nextEndNode = nextChildren[nextEndIndex]
    } else if (prevEndNode.key === nextStartNode.key) {
      patch(prevEndNode, nextStartNode, parent)
      parent.insertBefore(prevEndNode.el, prevStartNode.el)
      prevEndIndex--
      nextStartIndex++
      prevEndNode = prevChildren[prevEndIndex]
      nextStartNode = nextChildren[nextStartIndex]
    } else {
      let nextKey = nextStartNode.key,
        prevIndex = prevChildren.findIndex(child => child && (child.key === nextKey));
      if (prevIndex === -1) {
        mount(nextStartNode, parent, prevStartNode.el)
      } else {
        let prevNode = prevChildren[prevIndex]
        patch(prevNode, nextStartNode, parent)
        parent.insertBefore(prevNode.el, prevStartNode.el)
        prevChildren[prevIndex] = undefined
      }
      nextStartIndex++
      nextStartNode = nextChildren[nextStartIndex]
    }
  }
  if (nextStartIndex > nextEndIndex) {
    while (prevStartIndex <= prevEndIndex) {
      if (!prevChildren[prevStartIndex]) {
        prevStartIndex++
        continue
      }
      parent.removeChild(prevChildren[prevStartIndex++].el)
    }
  } else if (prevStartIndex > prevEndIndex) {
    while (nextStartIndex <= nextEndIndex) {
      mount(nextChildren[nextStartIndex++], parent, prevStartNode.el)
    }
  }
}
