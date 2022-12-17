[fixed定位的原理](https://juejin.cn/post/7100381335927291940)
文档中的层叠上下文由满足以下任意一个条件的元素形成：

* 文档根元素（<html>）；
* position 值为 absolute（绝对定位）或 relative（相对定位）且 z-index 值不为 auto 的元素；
* position 值为 fixed（固定定位）或 sticky（粘滞定位）的元素（沾滞定位适配所有移动设备上的浏览器，但老的桌面浏览器不支持）；
* flex (flex) 容器的子元素，且 z-index 值不为 auto；
* grid (grid) 容器的子元素，且 z-index 值不为 auto；
* opacity 属性值小于 1 的元素（参见 the specification for opacity）；
* mix-blend-mode 属性值不为 normal 的元素；
* 以下任意属性值不为 none 的元素：
    transform
    filter
    backdrop-filter
    perspective
    clip-path
    mask / mask-image / mask-border
    isolation 属性值为 isolate 的元素；
    will-change 值设定了任一属性而该属性在 non-initial 值时会创建层叠上下文的元素（参考这篇文章）；向浏览器提示元素将如何更改。浏览器可能会在元素实际更改之前设置优化。这些类型的优化可以通过在实际需要之前进行可能代价高昂的工作来提高页面的响应能力。
* contain 属性值为 layout、paint 或包含它们其中之一的合成值（比如 contain: strict、contain: content）的元素。

## perspective
属性确定 z=0 平面与用户之间的距离，以便为 3D 定位元素提供一些视角。

每个 z>0 的 3D 元素变大；每个 z<0 的 3D 元素都会变小。效果的强度由该属性的值决定。大的值perspective引起小的转变；较小的值perspective会导致较大的转换。

用户后面的 3D 元素部分——即它们的 z 轴坐标大于perspectiveCSS 属性的值——不会被绘制。

默认情况下，消失点位于元素的中心，但可以使用perspective-origin属性更改其位置。

将此属性与除none创建新的堆叠上下文之外的值一起使用。此外，在这种情况下，该对象将充当其包含的position: fixed元素的包含块。
## contain

CSS contain 属性允许开发者声明当前元素和它的内容尽可能的独立于 DOM 树的其他部分。这使得浏览器在重新计算布局、样式、绘图、大小或这四项的组合时，只影响到有限的 DOM 区域，而不是整个页面，可以有效改善性能。

none
表示元素将正常渲染，没有包含规则。

strict
表示除了 style 外的所有的包含规则应用于这个元素。等价于 contain: size layout paint。

content
表示这个元素上有除了 size 和 style 外的所有包含规则。等价于 contain: layout paint。

size
表示这个元素的尺寸计算不依赖于它的子孙元素的尺寸。

layout
表示元素外部无法影响元素内部的布局，反之亦然。

style
表示那些同时会影响这个元素和其子孙元素的属性，都在这个元素的包含范围内。 Indicates that, for properties that can have effects on more than just an element and its descendants, those effects don't escape the containing element. Note that this value is marked "at-risk" in the spec and may not be supported everywhere.

paint
表示这个元素的子孙节点不会在它边缘外显示。如果一个元素在视窗外或因其他原因导致不可见，则同样保证它的子孙节点不会被显示。 Indicates that descendants of the element don't display outside its bounds. If the containing box is offscreen, the browser does not need to paint its contained elements — these must also be offscreen as they are contained completely by that box. And if a descendant overflows the containing element's bounds, then that descendant will be clipped to the containing element's border-box.


## will-change

使用注意事项

不要将 will-change 应用于太多元素。浏览器已经尽力优化所有内容。一些更强大的优化可能会will-change最终使用大量机器资源，并且当像这样过度使用时会导致页面变慢或消耗大量资源。
谨慎使用。浏览器进行优化的正常行为是尽快删除优化并恢复正常。但是will-change直接在样式表中添加意味着目标元素总是离更改只有几分钟的路程，并且浏览器将保持优化比其他方式更长的时间。因此，will-change在更改发生前后使用脚本代码打开和关闭是一个很好的做法。
不要将 will-change 应用于元素以执行过早的优化。如果您的页面表现良好，请不要将will-change属性添加到元素只是为了提高速度。will-change旨在用作最后的手段，以尝试处理现有的性能问题。它不应用于预测性能问题。过度使用will-change将导致过多的内存使用，并导致在浏览器尝试为可能的更改做准备时出现更复杂的呈现。这将导致更差的性能。
给它足够的时间来工作。此属性旨在作为作者让用户代理知道可能提前更改的属性的一种方法。然后浏览器可以选择在属性更改实际发生之前应用属性更改所需的任何提前优化。因此，给浏览器一些时间来实际进行优化很重要。找到一些方法来至少提前一点预测某些事情会发生变化，然后进行设置will-change。