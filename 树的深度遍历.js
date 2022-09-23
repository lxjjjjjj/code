// https://juejin.cn/post/7001004885965537288
const deepTree2 = (data) => {
    let stack = []
    let arr = []
    stack = data
    while (stack.length) {
      let item = stack.shift()
      let children = item.children
      arr.push(item.id)
      if (children) {
        for (let i = children.length - 1; i >= 0; i--) {
          stack.unshift(children[i])
        }
      }
    }
    return arr
  }