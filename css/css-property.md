[原文链接](https://juejin.cn/post/6951201528543707150)
css property 允许开发者显式地定义他们的css 自定义属性
允许进行属性类型检查、设定默认值以及定义该自定义属性是否可以被继
@property CSS at-rule 是 CSS Houdini API 的一部分, 
它允许开发者显式地定义他们的 CSS 自定义属性，允许进行属性类型检查、
设定默认值以及定义该自定义属性是否可以被继
CSS Houdini 又是什么呢，CSS Houdini 开放 CSS 的底层 API 给开发者，
使得开发者可以通过这套接口自行扩展 CSS，并提供相应的工具允许开发者介入浏览器渲染引擎的样式和布局流程中，
使开发人员可以编写浏览器可以解析的 CSS 代码，从而创建新的 CSS 功能。

@property --property-name {
    syntax: '<color>';
    inherits: false;
    initial-value: #c0ffee;
}

@property 规则中 syntax 和 inherits 描述符是必需的; 如果其中任何一项缺失，整条规则都将失效并且会被忽略。 
initial-value 描述符仅在 syntax 描述符为通用 syntax 定义时是可选的，否则initial-value也是必需的——如果此时该描述符缺失，整条规则都将失效且被忽略。

为 --my-color 自定义属性添加颜色值类型检测、设置默认值并且设置属性值不允许被继承

使用 CSS @property 规定

@property --my-color {
    syntax: '<color>';
    inherits: false;
    initial-value: #c0ffee;
}

使用 JavaScript 中的 CSS.registerProperty (en-US)函数

window.CSS.registerProperty({
    name: '--my-color',
    syntax: '<color>',
    inherits: false,
    initialValue: '#c0ffee',
});

<style>
@property --property-name {
  syntax: '<color>';
  inherits: false;
  initial-value: #fff;
}

p {
    color: var(--property-name);
}
</style>
复制代码
简单解读下：

@property --property-name 中的 --property-name 就是自定义属性的名称，定义后可在 CSS 中通过 var(--property-name) 进行引用
syntax：该自定义属性的语法规则，也可以理解为表示定义的自定义属性的类型
inherits：是否允许继承
initial-value：初始值


支持的 syntax 语法类型
syntax 支持的语法类型非常丰富，基本涵盖了所有你能想到的类型。

length
number
percentage
length-percentage
color
image
url
integer
angle
time
resolution
transform-list
transform-function
custom-ident (a custom identifier string)


syntax 中的 +、#、| 符号
定义的 CSS @property 变量的 syntax 语法接受一些特殊的类型定义。

syntax: '<color#>' ：接受逗号分隔的颜色值列表
syntax: '<length+>' ：接受以空格分隔的长度值列表
syntax: '<length | length+>'：接受单个长度或者以空格分隔的长度值列表

OK，铺垫了这么多，那么为什么要使用这么麻烦的语法定义 CSS 自定义属性呢？CSS Houdini 定义的自定义变量的优势在哪里？下面我们一一娓娓道来。

使用 color syntax 语法类型作用于渐变
我们来看这样一个例子，我们有这样一个渐变的图案：

<div></div>

div {
    background: linear-gradient(45deg, #fff, #000);
}

我们改造下上述代码，改为使用 CSS 自定义属性：
:root {
    --colorA: #fff;
    --colorB: #000;
}
div {
    background: linear-gradient(45deg, var(--colorA), var(--colorB));
}


我们再加上一个过渡效果：
:root {
    --colorA: #fff;
    --colorB: #000;
}
div {
    background: linear-gradient(45deg, var(--colorA), var(--colorB));
    transition: 1s background;
    
    &:hover {
        --colorA: yellowgreen;
        --colorB: deeppink;
    }
}

虽然我们设定了 1s 的过渡动画 transition: 1s background，但是很可惜，CSS 是不支持背景渐变色的直接过渡变化的，我们得到的只是两帧之间的之间变化

使用 CSS @property 进行改造

OK，接下来我们就是有本文的主角，使用 Houdini API 中的 CSS 自定义属性替换原本的 CSS 自定义属性。
简单进行改造一下，使用 color syntax 语法类型：
@property --houdini-colorA {
  syntax: '<color>';
  inherits: false;
  initial-value: #fff;
}
@property --houdini-colorB {
  syntax: '<color>';
  inherits: false;
  initial-value: #000;
}
.property {
    background: linear-gradient(45deg, var(--houdini-colorA), var(--houdini-colorB));
    transition: 1s --houdini-colorA, 1s --houdini-colorB;
    
    &:hover {
        --houdini-colorA: yellowgreen;
        --houdini-colorB: deeppink;
    }
}
我们使用了 @property 语法，定义了两个 CSS Houdini 自定义变量 --houdini-colorA 和 --houdini-colorB，在 hover  变化的时候，改变这两个颜色。
需要关注的是，我们设定的过渡语句 transition: 1s --houdini-colorA, 1s --houdini-colorB，在这里，我们是针对 CSS Houdini 自定义变量设定过渡，而不是针对 background 设定过渡动画，再看看这次的效果：

Wow，成功了，渐变色的变化从两帧的逐帧动画变成了补间动画，实现了从一个渐变色过渡到另外一个渐变色的效果！而这，都得益于 CSS Houdini 自定义变量的强大能力！