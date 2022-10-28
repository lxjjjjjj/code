Virtual DOM是JS模拟真实DOM节点，这个对象就是更加轻量级的对DOM的描述

为什么现在主流的框架都使用虚拟dom?
1）前端性能优化的一个秘诀就是尽可能少地操作DOM，频繁变动DOM会造成浏览器的回流或者重绘
2）使用虚拟dom，当数据变化，页面需要更新时，通过diff算法，对新旧虚拟dom节点进行对比，比较两棵树的差异，生成差异对象，一次性对DOM进行批量更新操作，进而有效提高了性能
3）虚拟 DOM 本质上是 js 对象，而 DOM 与平台强相关，相比之下虚拟 DOM 可以进行更方便的跨平台操作，例如服务器渲染、weex 开发等等

# 总结虚拟dom的意义

1、提供一种简单对象去代替复杂的 dom 对象，从而优化 dom 操作
2、提供一个中间层，js 去写 ui，ios 安卓之类的负责渲染，就像 reactNative 一样。

```
// 将真实dom转化为虚拟dom
function dom2Json(dom) {
  if (!dom.tagName) return;
  let obj = {};
  obj.tag = dom.tagName;
  obj.children = [];
  dom.childNodes.forEach(item => {
    // 去掉空的节点
    dom2Json(item) && obj.children.push(dom2Json(item));
  });
  return obj;
}


  // 虚拟dom包含三个参数  type, props, children
  class Element {
    constructor(type, props, children) {
      this.type = type
      this.props = props
      this.children = children
    }
  }

 // 将虚拟dom渲染成真实的dom
  function render(domObj) {
    let el = document.createElement(domObj.type)
    Object.keys(domObj.props).forEach(key => { // 设置属性
      let value = domObj.props[key]
      switch (key) {
        case('value'):
          if (el.tagName == 'INPUT' || el.tagName == 'TEXTAREA') {
            el.value = value
          } else {
            el.setAttribute(key, value)
          }
          break;
        case('style'):
          el.style.cssText = value
          break;
        default:
          el.setAttribute(key, value)
      }
    })
    domObj.children.forEach(child => {
      child = child instanceof Element ? render(child) : document.createTextNode(child)
    })
    return el
  }
```