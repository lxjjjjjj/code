// https://juejin.cn/post/7001004885965537288
const widthTree = (data) => {
    let stack = []
    let arr = []
    stack = data
    while (stack.length) {
      let item = stack.shift()
      let children = item.children
      arr.push(item.id)
      if (children) {
        for (let i = 0; i < children.length; i++) {
          stack.push(children[i])
        }
      }
    }
    return arr
  }