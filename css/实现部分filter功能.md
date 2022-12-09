[原文链接](https://mp.weixin.qq.com/s/1rkXEdgIjn-lWnXj0JNBBQ)
# 一键变灰
```
html{
    filter: grayscale(100%);
}
```
考虑ie之类的兼容性的话，就直接把兼容性的属性都搞上去
```
html{
  -webkit-filter: grayscale(100%);
  -moz-filter: grayscale(100%);
  -ms-filter: grayscale(100%);
  -o-filter: grayscale(100%);
  filter: grayscale(100%);
  filter: gray;
  filter: progid:dximagetransform.microsoft.basicimage(grayscale=1);
}
```
如果想控制的更动态一些，可以用js控制html的class来实现这个切换过程
```
<button class="btn" id="set-gray">置灰</button>
let style = document.createElement('style')
let graySelector = 'gray-filter'
style.setAttribute('type', 'text/css')
// style.setAttribute('data-vite-dev-id', id)
style.textContent = `.${graySelector}{
  -webkit-filter: grayscale(100%);
  -moz-filter: grayscale(100%);
  -ms-filter: grayscale(100%);
  -o-filter: grayscale(100%);
  filter: grayscale(100%);
  filter: gray;
  filter: progid:dximagetransform.microsoft.basicimage(grayscale=1);
}`
document.head.appendChild(style)

let root = document.querySelector('html')
let btn = document.querySelector('#set-gray')
btn && btn.addEventListener('click', () => {
  setAllGray()
}, false)

function toggleClassName(el,name){
  if (el.className.indexOf(name) > -1) {
    el.className = el.className.replace(name, '').trim()
  } else {
    el.className = [el.className, name].join(' ')
  }
}

function setAllGray() {
  toggleClassName(root,graySelector)
}
```
这样可以在后端通过接口的形式决定是不是加载这段js就可以了

全灰算法不可逆 所以不能实现部分变灰

# 部分变灰 遮挡解决方案 backdrop-filter
backdrop-filter CSS 属性可以让你为一个元素后面区域添加图形效果（如模糊或颜色偏移）。因为它适用于元素背后的所有元素，为了看到效果，必须使元素或其背景至少部分透明。

有一个解决方案是用backdrop-filter做一个遮罩，毕竟filter还是有点损耗首屏性能的，虽然可以用transform开启硬件优化一些，我们还可以用遮罩的方式挡住也可以的，并且设置pointer-events: none;不阻挡用户交互，也是一段css搞定
```
html {
    position: relative;
    width: 100%;
    height: 100%;
}
html::before {
    content: "";
    position: fixed;
    backdrop-filter: grayscale(100%);
    pointer-events: none;
    inset: 0;
    z-index: 100;
}
```
还可以把遮罩的position换成absolute, 实现一个只置灰首屏的效果，不过我感觉没啥必要

然后我们可以设置指定元素的z-index，超过backdrop-filter的100就可以, 就有首屏+部分彩色的效果

.not-gray{
  position: relative;
  z-index:1000;
}