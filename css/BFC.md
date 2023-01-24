BFC是块级格式化上下文，是一个独立的渲染区域，让处于 BFC 内部的元素与外部的元素相互隔离，使内外元素的定位不会相互影响。
触发条件

position: absolute/fixed：绝对定位
display: inline-block / table / flex
float 设置除none以外的值；（只要设置了浮动，当前元素就创建了BFC）
overflow !== visible (可为：hidden、auto、scroll)

特性和应用

阻止margin重叠：同一个 BFC 下外边距（margin）会发生折叠
清除浮动 ：清除内部浮动(清除浮动的原理是两个div都位于同一个 BFC 区域之中)
自适应两栏布局：左float+右BFC，是利用了BFC 的区域不会与 float 的元素区域重叠的机制
