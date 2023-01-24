[原文链接](https://juejin.cn/post/6967272970196615199)
# flex布局
**基本概念**
通常被称为flexbox，是一种一维的布局模型，给子元素提供了空间分布和对齐能力。它由（Flex Container容器/Flex item项目成员）构成。
该布局模型的目的是提供一种更加高效的方式来对容器中的条目进行布局、对齐和分配空间。适用于不同尺寸屏幕中创建可自动扩展和收缩布局，通常可用于水平垂直居中，两栏、三栏布局等的场景里。

**Flex三个值**
flex-grow：项目的放大比例，默认为0，即如果存在剩余空间，也不放大。如果所有项目的flex-grow属性相等（或都为1），将等分剩余空间，如果有一个为2，那么它占据的剩余空间将比其他项目多。

flex-shrink：项目的缩小比例，默认为1，即如果空间不足，该项目将缩小

flex-basis属性定义了在分配多余空间之前，项目占据的主轴空间（main size）。浏览器根据这个属性，计算主轴是否有多余空间。它的默认值为auto，即项目的本来大小。

flex属性是flex-grow,flex-shrink 和 flex-basis的简写，默认值为0 1 auto。后两个属性可选。该属性有两个快捷值：auto (1 1 auto) 和 none (0 0 auto)。

Flex 1 相当于 flex: 1 1 0；项目占的主轴空间为0，所以平分；但是如果有padding属性的话，元素占的地方会被增加；设置margin的话，元素的宽度不变，但是content内容的宽度变小；
Flex 如何实现三栏布局
左右设置flex: 0 1 200px;中间设置flex:1;父元素flex布局。
Flex 1 的理解
如果设置 flex:1，就等于 flex: 1 1 0;设置 flex:0；就等于 flex: 0 0 0;

```
设置display flex 或者 display inline-flex
开启了flex布局的元素叫做flex container

flex container里面的直接子元素叫做flex items（也就是开启了flex布局的盒子包裹的第一层子元素）
设置display的属性为flex或者inline-flex可以开启flex布局即成为flex container
```
## flex:1 代表 flex: 1 1 0
数值 1 设置的是 flex-grow，flex-shrink没设置的时候默认值是1，和初始值一样的；
flex-grow: 1, flex-shrink: 1, flex-basis: 0
特殊在于flex-basis，初始值为 auto 那常规思路没设置就采用默认值则：flex:1 === flex:1 1 auto;
但MDN给了定义一个值的时候的解释，如果flex只定义了一个数字值，则 flex-basis 的值为 0；所以：flex:1 为：flex: 1 1 0;

### 属性值设置为flex和inline-flex的区别

```
如果display对应的值是flex的话，那么flex container是以block-level的形式存在的，相当于是一个块级元素

如果display的值设置为inline-flex的话，那么flex container是以inline-level的形式存在的，相当于是一个行内块元素
```
### 应用在flex container上的CSS属性

##### flex-flow

```
flex-flow是 flex-direction || flex-wrap的缩写，这个属性很灵活，你可以只写一个属性，也可以两个都写，甚至交换前后顺序都是可以的
flex-flow：column wrap === flex-direction：column；flex-wrap：wrap

如果只写了一个属性值的话，那么另一个属性就直接取默认值；flex-flow：row-reverse === flex-direction：row-reverse；flex-wrap：nowrap；

```
##### flex-direction

```
flex items默认都是沿着main axis（主轴）从main start开始往main end方向排布的

flex-direction决定了主轴的方向，有四个取值
分别为row（默认值）、row-reverse、column、column-reverse

注意：flex-direction并不是直接改变flex items的排列顺序，他只是通过改变了主轴方向间接的改变了顺序

```

属性值 | 主轴起始位置 | 主轴结束位置 | 主轴方向
---|--- | --- | ---
row (默认值) | 左 | 右 | ----->
row-reverse | 右 | 左 | <-----
column | 上 | 下 | 从上往下
column-reverse | 下 | 上 | 从下往上

##### flex-wrap

flex-wrap能够决定flex items是在单行还是多行显示

nowrap（默认）：单行

```
父盒子宽度为500px，子盒子为100px；当增加了多个子盒子并且给父盒子设置了flex-wrap：nowrap属性后，效果如下图所示：
我们会惊奇的发现，父盒子的宽度没有变化，子盒子也确实没有换行，但是他们的宽度均缩小至能适应不换行的条件为止了，这也就是flex布局又称为弹性布局的原因
所以，我们也可以得出一个结论：如果使用了flex布局的话，一个盒子的大小就算是将宽高写死了也是有可能发生改变的
```
wrap：多行


```
换行后元素是往哪边排列跟交叉轴的方向有很大的关系，排列方向是顺着交叉轴的方向来的；
用的还是刚刚的例子，只不过现在将属性flex-wrap的值设置为了wrap，效果如下图所示：
子盒子的高度在能够正常换行的情况不会发生变化，但因为当前交叉轴的方向是从上往下的，那么要换行的元素就会排列在下方

```
wrap-reverse

```
多行（对比wrap，cross start与cross end相反），这个方法可以让交叉轴起点和终点相反，这样整体的布局就会翻转过来

注意：这里就不是单纯的将要换行的元素向上排列，所有的元素都会受到影响，因为交叉轴的起始点和终止点已经反过来了
```
##### justify-content

justify-content决定了flex items在主轴上的对齐方式，总共有6个属性值

```
flex-start（默认值）：在主轴方向上与main start对齐
flex-end：在主轴方向上与main end对齐
center：在主轴方向上居中对齐
space-between 与main start、main end两端对齐,flex items之间的距离相等(元素和容器两端紧贴着)
space-evenly flex items之间的距离相等.flex items与main start、main end之间的距离等于flex items的距离
space-around flex items之间的距离相等 flex items与main start、main end之间的距离等于flex items的距离的一半
```
##### align-items

align-items决定了单行flex items在cross axis（交叉轴）上的对齐方式
注意：主轴只要是横向的，无论flex-direction设置的是row还是row-reverse，其交叉轴都是从上指向下的；
主轴只要是纵向的，无论flex-direction设置的是column还是column-reverse，其交叉轴都是从左指向右的；

```
stretch（默认值）：当flex items在交叉轴方向上的size（指width或者height，由交叉轴方向确定）为auto时，会自动拉伸至填充；但是如果flex items的size并不是auto，那么产生的效果就和设置为flex-start一样,注意：触发条件为：父元素设置align-items的属性值为stretch，而子元素在交叉轴方向上的size设置为auto.

flex-start：与cross start对齐

flex-end：与cross end对齐

center：居中对齐

baseline：与基准线对齐,基准线可以认为是盒子里面文字的底线，基准线对齐就是让每个盒子文字的底线对齐
```
##### align-content


```
align-content决定了多行flex-items在主轴上的对齐方式，用法与justify-content类似，具有以下属性值
stretch（默认值）、flex-start、flex-end、center、space-bewteen、space-around、space-evenly

大部分属性值看图应该就能明白，主要说一下stretch，当flex items在交叉轴方向上的size设置为auto之后，多行元素的高度之和会挤满父盒子，并且他们的高度是均分的，这和align-items的stretch属性有点不一样，后者是每一个元素对应的size会填充父盒子，而前者则是均分

```
### flex items上的CSS属性

##### flex

```
flex是flex-grow flex-shrink flex-basis的简写，说明flex属性值可以是一个、两个、或者是三个，剩下的为默认值
默认值为flex： 0 1 auto（不放大但会缩小）

none： 0 0 auto（既不放大也不缩小）
auto：1 1 auto（放大且缩小）

如果flex是一个非负数n：则该数字代表的是flex-grow的值，剩下的两个都是默认值，即flex：n 1 0%；比如说：flex：1 --> flex：1 1 0%

```
##### flex-grow

flex-grow决定了flex-items如何扩展，可以设置任何非负数字（正整数、正小数、0），默认值为0。

只有当flex container在主轴上有剩余的size时，该属性才会生效。如果所有的flex items的flex-grow属性值总和sum超过1，每个flex item扩展的size就为flex container剩余size * flex-grow / sum

利用上一条计算公式，我们可以得出：当flex items的flex-grow属性值总和sum不超过1时，扩展的总长度为剩余 size * sum，但是sum又小于1，所以最终flex items不可能完全填充felx container

如果所有的flex items的flex-grow属性值总和sum不超过1，每个flex item扩展的size就为flex container剩余size * flex-grow

flex items扩展后的最终size不能超过max-width/max-height

##### flex-basis

```
flex-basis用来设置flex items在主轴方向上的base size，以后flew-grow和flex-shrink计算时所需要用的base size就是这个
auto（默认值）、content：取决于内容本身的size，这两个属性可以认为效果都是一样的，当然也可以设置具体的值和百分数（根据父盒子的比例计算）


决定flex items最终base size因素的优先级为max-width/max-height/min-width/min-height > flex-basis > width/height > 内容本身的size
可以理解为给flex items设置了flex-basis属性且属性值为具体的值或者百分数的话，主轴上对应的size（width/height）就不管用了

```
##### flex-shrink
```
flex-shrink决定了flex items如何收缩
可以设置任意肺腑数字（正小数、正整数、0），默认值是1


当flex items在主轴方向上超过了flex container的size之后，flex-shrink属性才会生效
注意：与flex-grow不同，计算每个flex item缩小的大小都是通过同一个公式来的，计算比例的方式也有所不同


收缩比例 = flex-shrink * flex item的base size，base size就是flex item放入flex container之前的size
每个flex item收缩的size为flex items超出flex container的size * 收缩比例 / 所有flex items 的收缩比例之和



flex items收缩后的最终size不能小于min-width/min-height
总结：当flex items的flex-shrink属性值的总和小于1时，通过其计算收缩size的公式可知，其总共收缩的距离是超出的size * sum，由于sum是小于1的，那么无论如何子盒子都不会完全收缩至超过的距离，也就是说在不换行的情况下子元素一定会有超出

```

##### order
```
order决定了flex items的排布顺序
可以设置为任意整数（正整数、负整数、0），值越小就排在越前面
默认值为0，当flex items的order一致时，则按照渲染的顺序排列
```
##### align-self
```
flex items可以通过align-self覆盖flex container设置的align-items
默认值为auto：默认遵从flex container的align-items设置

stretch、flex-start、flex-end、center、baseline，效果跟align-items一致，简单来说，就是align-items有什么属性，align-self就有哪些属性，当然auto除外

```
## flex的详细值
[原文链接](https://juejin.cn/post/6967272970196615199)
/* 关键字值 */
flex: auto;
flex: initial;
flex: none;

/* 一个值, 无单位数字: flex-grow */
flex: 2;

/* 一个值, width/height: flex-basis */
flex: 10em;
flex: 30px;
flex: min-content;

/* 两个值: flex-grow | flex-basis */
flex: 1 30px;

/* 两个值: flex-grow | flex-shrink */
flex: 2 2;

/* 三个值: flex-grow | flex-shrink | flex-basis */
flex: 2 2 10%;

/*全局属性值 */
flex: inherit;
flex: initial;
flex: unset;

单值语法:
值必须为以下其中之一:

一个无单位数(<number>): 它会被当作flex:<number> 1 0; <flex-shrink>的值被假定为1，然后<flex-basis> 的值被假定为0。
一个有效的宽度(width)值: 它会被当作 的值。
关键字none，auto或initial.

双值语法:
第一个值必须为一个无单位数，并且它会被当作 <flex-grow> 的值。第二个值必须为以下之一：

一个无单位数：它会被当作  的值。
一个有效的宽度值: 它会被当作  的值。

三值语法:

第一个值必须为一个无单位数，并且它会被当作  的值。
第二个值必须为一个无单位数，并且它会被当作   的值。
第三个值必须为一个有效的宽度值， 并且它会被当作  的值。

取值
initial
元素会根据自身宽高设置尺寸。它会缩短自身以适应 flex 容器，但不会伸长并吸收 flex 容器中的额外自由空间来适应 flex 容器 。相当于将属性设置为"flex: 0 1 auto"。
auto
元素会根据自身的宽度与高度来确定尺寸，但是会伸长并吸收 flex 容器中额外的自由空间，也会缩短自身来适应 flex 容器。这相当于将属性设置为 "flex: 1 1 auto".
none
元素会根据自身宽高来设置尺寸。它是完全非弹性的：既不会缩短，也不会伸长来适应 flex 容器。相当于将属性设置为"flex: 0 0 auto"。
<'flex-grow'>
定义 flex 项目的 flex-grow 。负值无效。省略时默认值为 1。 (初始值为 0)
<'flex-shrink'>
定义 flex 元素的 flex-shrink 。负值无效。省略时默认值为1。 (初始值为 1)
<'flex-basis'>
定义 flex 元素的 flex-basis 属性。若值为0，则必须加上单位，以免被视作伸缩性。省略时默认值为 0。(初始值为 auto)

