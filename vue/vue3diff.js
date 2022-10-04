// vue3的diff借鉴于inferno，该算法其中有两个理念。第一个是相同的前置与后置元素的预处理；
// 第二个则是最长递增子序列，此思想与React的diff类似又不尽相同。下面我们来一一介绍

// 首先对双端对应位置的节点做对比是否需要移动的特殊情况做完处理之后，
// 处理边界情况就是相等的节点位置比旧列表的end位置或者比新列表的end位置要大，
// j > prevEnd && j <= nextEnd 将节点加在prevEnd和nextEnd之间就好了
// j > nextEnd && j <= prevEnd
// 将节点删除就好了

// 判断是否需要移动节点
// 最长递增子序列算法判断
// 建立一个source数组存储，我们将新节点在旧列表的位置存储在该数组中，
// 我们在根据source计算出它的最长递增子序列用于移动DOM节点，在找节点时要注意，
// 如果旧节点在新列表中没有的话，直接删除就好。除此之外，我们还需要一个数量表示记录我们已经patch过的节点，
// 如果数量已经与新列表剩余的节点数量一样，那么剩下的旧节点我们就直接删除了就可以了，如果是全新的节点的话，
// 其在source数组中对应的值就是初始的-1，通过这一步我们可以区分出来哪个为全新的节点，哪个是可复用的。
// 其次，我们要判断是否需要移动。那么如何判断移动呢？很简单，和React一样我们用递增法，
// 如果我们找到的index是一直递增的，说明不需要移动任何节点。我们通过设置一个变量来保存是否需要移动的状态。

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