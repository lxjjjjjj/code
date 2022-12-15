// vue3的diff借鉴于inferno，该算法其中有两个理念。

// 第一个是相同的前置与后置元素的预处理。
// 第二个则是最长递增子序列。


// 先剔除掉理想情况下的开头连续几个节点都相同 以及结尾连续几个节点都相同的情况
// 处理边界情况就是 
// 如果 index 大于 prevEnd 并且 index 小于 nextEnd  只需要把新列表中 index 到 nextEnd 之间剩下的节点插入进去就可以了
// 如果 index > nextEnd 时，我们把旧列表中 index 到 prevEnd 之间的节点删除

// 当前/后置的预处理结束后，我们进入真正的diff环节。首先，我们先根据新列表剩余的节点数量，创建一个source数组，并将数组填满-1。
// source数组是来做新旧节点的对应关系的，我们将新节点在旧列表的位置存储在该数组中，
// 我们在根据source计算出它的最长递增子序列用于移动DOM节点。
// 为此，我们先建立一个对象存储当前新列表中的节点与index的关系，再去旧列表中去找位置。

// 保存映射关系  
// for (let i = nextStart; i <= nextEnd; i++) {
//   let key = nextChildren[i].key
//   nextIndexMap[key] = i
// } 

// 去旧列表找位置
// for (let i = prevStart; i <= prevEnd; i++) {
//   let prevNode = prevChildren[i],
//     prevKey = prevNode.key,
//     nextIndex = nextIndexMap[prevKey];
//   // 新列表中没有该节点 或者 已经更新了全部的新节点，直接删除旧节点
//   if (nextIndex === undefind || patched >= nextLeft) {
//     parent.removeChild(prevNode.el)
//     continue
//   }
//   // 找到对应的节点
//   let nextNode = nextChildren[nextIndex];
//   patch(prevNode, nextNode, parent);
//   // 给source赋值
//   source[nextIndex - nextStart] = i
//   patched++
// }
// }

// 如果是全新的节点的话，其在source数组中对应的值就是初始的-1
// 如果我们找到的index是一直递增的，说明不需要移动任何节点。我们通过设置一个变量来保存是否需要移动的状态。move = true
// DOM如何移动 将需要移动的节点移动到最长递归子序列中的相应index位置就好了其余递增排序的节点不需要移动



import mount from "../mount";
import patch from "../patch";

export default function vue3diff(prevChildren, nextChildren, parent) {
  let j = 0,
    prevEnd = prevChildren.length - 1,
    nextEnd = nextChildren.length - 1,
    prevNode = prevChildren[j],
    nextNode = nextChildren[j];
  outer: {
    while (prevNode.key === nextNode.key) {
      patch(prevNode, nextNode, parent)
      j++
      if (j > prevEnd || j > nextEnd) break outer
      prevNode = prevChildren[j]
      nextNode = nextChildren[j]
    }

    prevNode = prevChildren[prevEnd]
    nextNode = nextChildren[nextEnd]

    while (prevNode.key === nextNode.key) {
      patch(prevNode, nextNode, parent)
      prevEnd--
      nextEnd--
      if (j > prevEnd || j > nextEnd) break outer
      prevNode = prevChildren[prevEnd]
      nextNode = nextChildren[nextEnd]
    }
  }

  if (j > prevEnd && j <= nextEnd) {
    let nextPos = nextEnd + 1,
      refNode = nextPos >= nextChildren.length
        ? null
        : nextChildren[nextPos].el
    while (j <= nextEd) {
      mount(nextChildren[j++], parent, refNode)
    }
    return
  } else if (j > nextEnd) {
    while (j <= prevEnd) {
      parent.removeChild(prevChildren[j++].el)
    }
    return
  }

  let nextStart = j,
    prevStart = j,
    nextLeft = nextEnd - j + 1,
    nextIndexMap = {},
    source = new Array(nextLeft).fill(-1),
    patched = 0,
    lastIndex = 0,
    move = false;

  for (let i = nextStart; i <= nextEnd; i++) {
    let key = nextChildren[i].key
    nextIndexMap[key] = i
  }

  for (let i = prevStart; i <= prevEnd; i++) {
    let prevChild = prevChildren[i],
      prevKey = prevChild.key,
      nextIndex = nextIndexMap[prevKey];

    if (patched >= nextLeft || nextIndex === undefined) {
      parent.removeChild(prevChild.el)
      continue
    }
    patched++
    let nextChild = nextChildren[nextIndex]
    patch(prevChild, nextChild, parent)

    source[nextIndex - nextStart] = i

    if (nextIndex < lastIndex) {
      move = true
    } else {
      lastIndex = nextIndex
    }
  }


  if (move) {
    const seq = lis(source);
    let j = seq.length - 1;
    for (let i = nextLeft - 1; i >= 0; i--) {
      let pos = nextStart + i,
        nextPos = pos + 1,
        nextChild = nextChildren[pos],
        refNode = nextChildren[nextPos]?.el
      if (source[i] === -1) {

        mount(nextChild, parent, refNode)
      } else if (i !== seq[j]) {
        parent.insertBefore(nextChild.el, refNode)
      } else {
        j--
      }
    }
  } else {
    for (let i = nextLeft - 1; i >= 0; i--) {
      if (source[i] === -1) {
        let pos = nextStart + i,
          nextPos = pos + 1,
          nextChild = nextChildren[pos],
          refNode = nextChildren[nextPos]?.el;
      
        mount(nextChild, parent, refNode)
      }
    }
  }
}

function lis(arr) {
  let len = arr.length,
    result = [],
    dp = new Array(len).fill(1);
  for (let i = 0; i < len; i++) {
    result.push([i])
  }

  for (let i = len - 1; i >= 0; i--) {
    let cur = arr[i],
      nextIndex = undefined;
    if (cur === -1) continue
    for (let j = i + 1; j < len; j++) {
      let next = arr[j]
      if (cur < next) {
        let max = dp[j] + 1
        if (max > dp[i]) {
          nextIndex = j
          dp[i] = max
        }
      }
    }
    if (nextIndex !== undefined) result[i] = [...result[i], ...result[nextIndex]]
  }
  let index = dp.reduce((prev, cur, i, arr) => cur > arr[prev] ? i : prev, dp.length - 1)
  return result[index]
}