[原文链接](https://juejin.cn/post/7095620683710873608)

* 普通插槽、 作用域插槽 的 vNode 是在哪个环节生成的，render 父组件时还是子组件时？
* 作用域插槽 为什么能在父组件访问到子组件的数据？
* 普通插槽 跟 作用域插槽 在实现上有区别吗？
# 总结
编译阶段，不管是父组件还是子组件，都会经过processSlot函数的处理，只不过处理方式不一样，对于子组件，普通插槽slot在子组件name属性值el上添加slotName（<slot name='el.slotName'/>），作用域插槽template的name变成子组件的slotScope值（<template name='el.slotScope'/>），父组件获取attr slot = 'value' 定为父组件的el.slotTarget。

普通插槽是在父组件编译和渲染阶段生成 vnodes，所以数据的作用域是父组件实例，子组件渲染的时候直接拿到这些渲染好的 vnodes。而对于作用域插槽，父组件在编译和渲染阶段并不会直接生成 vnodes，而是在父节点 vnode 的 data 中保留一个 scopedSlots 对象，存储着不同名称的插槽以及它们对应的渲染函数，只有在编译和渲染子组件阶段才会执行这个渲染函数生成 vnodes，由于是在子组件环境执行的，所以对应的数据作用域是子组件实例。

简单地说，两种插槽的目的都是让子组件 slot 占位符生成的内容由父组件来决定，但数据的作用域会根据它们 vnodes 渲染时机不同而不同。
# 用法

## 默认插槽
```
<!-- 子组件 -->
<template>
  <div class="wrapper">
    <!-- 默认插槽 -->
    <div class="main">
      <slot></slot>
    </div>
</template>

<!-- 父组件 -->
<my-slot>
  <template>
    <h1>默认插槽</h1>
  </template>
</my-slot>
```
## 具名插槽

```
<!-- 子组件 -->
<template>
  <div class="wrapper">
    <!-- header 具名插槽 -->
    <header class="header">
      <slot name="header"></slot>
    </header>
    <!-- 默认插槽 -->
    <div class="main">
      <slot></slot>
    </div>
</template>

<!-- 父组件 -->
<my-slot>
  <template v-slot:header>
    <h1>header 具名插槽</h1>
  </template>
  <template>
    <h1>默认插槽</h1>
  </template>
</my-slot>

```
子组件中的 slot标签 带上了一个名为 name 的属性，值为 header

父组件中的 template标签 带上了 v-slot 的属性，值为 header

## 作用域插槽
```
<!-- 子组件 -->
<template>
  <div class="wrapper">
    <!-- header 具名插槽 -->
    <header class="header">
      <slot name="header"></slot>
    </header>
    <!-- 默认插槽 -->
    <div class="main">
      <slot></slot>
    </div>
    <!-- footer 具名 + 作用域插槽 -->
    <footer class="footer">
      <slot name="footer" :footerInfo="footerInfo"></slot>
    </footer>
  </div>
</template>
<script>
export default {
  name: "mySlot",
  data () {
    return {
      footerInfo: {
        text: '这是 子组件 footer插槽 的作用域数据'
      }
    }
  }
}
</script>

<!-- 父组件 -->
<my-slot>
  <template v-slot:header>
    <h1>header 具名插槽</h1>
  </template>
  <template>
    <h1>默认插槽</h1>
  </template>
  <template v-slot:footer="slotProps">
    <h1>footer 具名 + 作用域插槽</h1>
    <p>{{ slotProps.footerInfo.text }}</p>
  </template>
</my-slot>
```
* 子组件中的 slot标签 除了有 name=footer 的属性，还有一个:footerInfo="footerInfo" 的属性（作用就是传递子组件数据）

* 父组件中的 template标签 不仅有 v-slot:footer ，并且还有一个赋值操作 ="slotProps"，在模版的双括号语法中，直接通过 slotProps 访问到 子组件的 footerInfo

# 普通插槽编译
示例代码
```
let AppLayout = {
  template: '<div class="container">' +
  '<header><slot name="header"></slot></header>' +
  '<main><slot>默认内容</slot></main>' +
  '<footer><slot name="footer"></slot></footer>' +
  '</div>'
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<app-layout>' +
  '<h1 slot="header">{{title}}</h1>' +
  '<p>{{msg}}</p>' +
  '<p slot="footer">{{desc}}</p>' +
  '</app-layout>' +
  '</div>',
  data() {
    return {
      title: '我是标题',
      msg: '我是内容',
      desc: '其它信息'
    }
  },
  components: {
    AppLayout
  }
})

这里我们定义了 AppLayout 子组件，它内部定义了 3 个插槽，2 个为具名插槽，一个 name 为 header，一个 name 为 footer，还有一个没有定义 name 的是默认插槽。 <slot> 和 </slot> 之前填写的内容为默认内容。我们的父组件注册和引用了 AppLayout 的组件，并在组件内部定义了一些元素，用来替换插槽，那么它最终生成的 DOM 如下：

<div>
  <div class="container">
    <header><h1>我是标题</h1></header>
    <main><p>我是内容</p></main>
    <footer><p>其它信息</p></footer>
  </div>
</div>
```
首先编译父组件，在 parse 阶段，会执行 processSlot 处理 slot，它的定义在 src/compiler/parser/index.js 中：编译父组件讲普通slot标签和slot作用域属性变成AST节点的属性值获取name名称
```
function processSlot (el) {
  有 slot tag / template slot的是子组件
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name')
    if (process.env.NODE_ENV !== 'production' && el.key) {
      // 自 2.5 以来，作用域插槽的“scope”属性已被弃用并替换为“slot-scope”。新的“slot-scope”属性除了 <template> 之外，也可以用在普通元素上来表示作用域插槽。
      warn(
        `\`key\` does not work on <slot> because slots are abstract outlets ` +
        `and can possibly expand into multiple elements. ` +
        `Use the key on a wrapping element instead.`
      )
    }
  } else {
    let slotScope
    if (el.tag === 'template') {
      slotScope = getAndRemoveAttr(el, 'scope')
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && slotScope) {
        warn(
          `the "scope" attribute for scoped slots have been deprecated and ` +
          `replaced by "slot-scope" since 2.5. The new "slot-scope" attribute ` +
          `can also be used on plain elements in addition to <template> to ` +
          `denote scoped slots.`,
          true
        )
      }
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
        warn(
          `Ambiguous combined usage of slot-scope and v-for on <${el.tag}> ` +
          `(v-for takes higher priority). Use a wrapper <template> for the ` +
          `scoped slot to make it clearer.`,
          true
        )
      }
      el.slotScope = slotScope
    }
    const slotTarget = getBindingAttr(el, 'slot')
    // 如果一个组件有slot属性(也就是父组件) 那么这个slotTarget节点后续
    if (slotTarget) {
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        // slotTarget 也是要插入到子组件内部的节点的slot的名称
        addAttr(el, 'slot', slotTarget)
      }
    }
  }
}
function getAndRemoveAttr (
  el,
  name,
  removeFromMap
) {
  var val;
  if ((val = el.attrsMap[name]) != null) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1);
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name];
  }
  return val
}
function getBindingAttr (
    el,
    name,
    getStatic
  ) {
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) {
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
  }
  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }
```
当解析到标签上有 slot 属性的时候，会给对应的 AST 元素节点添加 slotTarget 属性，然后在 codegen 阶段，在 genData 中会处理 slotTarget，相关代码在 src/compiler/codegen/index.js 中：
```
if (el.slotTarget && !el.slotScope) {
  data += `slot:${el.slotTarget},`
}
```
会给 data 添加一个 slot 属性，并指向 slotTarget，之后会用到。在我们的例子中，父组件最终生成的代码如下：
```
with(this){
  return _c('div',
    [_c('app-layout',
      [_c('h1',{attrs:{"slot":"header"},slot:"header"},
         [_v(_s(title))]),
       _c('p',[_v(_s(msg))]),
       _c('p',{attrs:{"slot":"footer"},slot:"footer"},
         [_v(_s(desc))]
         )
       ])
     ],
   1)}
```
接下来编译子组件，同样在 parser 阶段会执行 processSlot 处理函数，它的定义在 src/compiler/parser/index.js 中：
```
function processSlot (el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name')
  }
  // ...
}
```
当遇到 slot 标签的时候会给对应的 AST 元素节点添加 slotName 属性，然后在 codegen 阶段，会判断如果当前 AST 元素节点是 slot 标签，则执行 genSlot 函数，它的定义在 src/compiler/codegen/index.js 中：
```
function genSlot (el: ASTElement, state: CodegenState): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el, state)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}`
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}
```
我们先不考虑 slot 标签上有 attrs 以及 v-bind 的情况，那么它生成的代码实际上就只有：
```
const slotName = el.slotName || '"default"'
const children = genChildren(el, state)
let res = `_t(${slotName}${children ? `,${children}` : ''}`
```
这里的 slotName 从 AST 元素节点对应的属性上取，默认是 default，而 children 对应的就是 slot 开始和闭合标签包裹的内容。来看一下我们例子的子组件最终生成的代码，如下：
```
with(this) {
  return _c('div',{
    staticClass:"container"
    },[
      _c('header',[_t("header")],2),
      _c('main',[_t("default",[_v("默认内容")])],2),
      _c('footer',[_t("footer")],2)
      ]
   )
}
```
在编译章节我们了解到，_t 函数对应的就是 renderSlot 方法，它的定义在 src/core/instance/render-heplpers/render-slot.js 中：
```
/**
 * Runtime helper for rendering <slot>
 */
export function renderSlot (
  name: string,
  fallback: ?Array<VNode>,
  props: ?Object,
  bindObject: ?Object
): ?Array<VNode> {
  const scopedSlotFn = this.$scopedSlots[name]
  let nodes
  if (scopedSlotFn) { // scoped slot
    props = props || {}
    if (bindObject) {
      if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        )
      }
      props = extend(extend({}, bindObject), props)
    }
    nodes = scopedSlotFn(props) || fallback
  } else {
    const slotNodes = this.$slots[name]
    // warn duplicate slot usage
    if (slotNodes) {
      if (process.env.NODE_ENV !== 'production' && slotNodes._rendered) {
        warn(
          `Duplicate presence of slot "${name}" found in the same render tree ` +
          `- this will likely cause render errors.`,
          this
        )
      }
      slotNodes._rendered = true
    }
    nodes = slotNodes || fallback
  }

  const target = props && props.slot
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}
```
render-slot 的参数 name 代表插槽名称 slotName，fallback 代表插槽的默认内容生成的 vnode 数组。先忽略 scoped-slot，只看默认插槽逻辑。如果 this.$slot[name] 有值，就返回它对应的 vnode 数组，否则返回 fallback。那么这个 this.$slot 是哪里来的呢？我们知道子组件的 init 时机是在父组件执行 patch 过程的时候，那这个时候父组件已经编译完成了。并且子组件在 init 过程中会执行 initRender 函数，initRender 的时候获取到 vm.$slot，相关代码在 src/core/instance/render.js 中：
```
export function initRender (vm: Component) {
  // ...
  const parentVnode = vm.$vnode = options._parentVnode // the placeholder node in parent tree
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
}

```
vm.$slots 是通过执行 resolveSlots(options._renderChildren, renderContext) 返回的，它的定义在 src/core/instance/render-helpers/resolve-slots.js 中：
```
/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */
export function resolveSlots (
  children: ?Array<VNode>,
  context: ?Component
): { [key: string]: Array<VNode> } {
  const slots = {}
  if (!children) {
    return slots
  }
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    const data = child.data
    
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot
    }
    
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      const name = data.slot
      const slot = (slots[name] || (slots[name] = []))
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || [])
      } else {
        slot.push(child)
      }
    } else {
      (slots.default || (slots.default = [])).push(child)
    }
  }
  // ignore slots that contains only whitespace
  for (const name in slots) {
    if (slots[name].every(isWhitespace)) {
      delete slots[name]
    }
  }
  return slots
}
```
resolveSlots 方法接收 2 个参数，第一个参数 chilren 对应的是父 vnode 的 children，在我们的例子中就是 <app-layout> 和 </app-layout> 包裹的内容。第二个参数 context 是父 vnode 的上下文，也就是父组件的 vm 实例。

resolveSlots 函数的逻辑就是遍历 chilren，拿到每一个 child 的 data，然后通过 data.slot 获取到插槽名称，这个 slot 就是我们之前编译父组件在 codegen 阶段设置的 data.slot。接着以插槽名称为 key 把 child 添加到 slots 中，如果 data.slot 不存在，则是默认插槽的内容，则把对应的 child 添加到 slots.defaults 中。这样就获取到整个 slots，它是一个对象，key 是插槽名称，value 是一个 vnode 类型的数组，因为它可以有多个同名插槽。

这样我们就拿到了 vm.$slots 了，回到 renderSlot 函数，const slotNodes = this.$slots[name]，我们也就能根据插槽名称获取到对应的 vnode 数组了，这个数组里的 vnode 都是在父组件创建的，这样就实现了在父组件替换子组件插槽的内容了。

对应的 slot 渲染成 vnodes，作为当前组件渲染 vnode 的 children，之后的渲染过程之前分析过，不再赘述。

# 作用域插槽的编译
```
let Child = {
  template: '<div class="child">' +
  '<slot text="Hello " :msg="msg"></slot>' +
  '</div>',
  data() {
    return {
      msg: 'Vue'
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child>' +
  '<template slot-scope="props">' +
  '<p>Hello from parent</p>' +
  '<p>{{ props.text + props.msg}}</p>' +
  '</template>' +
  '</child>' +
  '</div>',
  components: {
    Child
  }
})
最终生成的 DOM 结构如下：

<div>
  <div class="child">
    <p>Hello from parent</p>
    <p>Hello Vue</p>
  </div>
</div>
```
们可以看到子组件的 slot 标签多了 text 属性，以及 :msg 属性。父组件实现插槽的部分多了一个 template 标签，以及 scope-slot 属性，其实在 Vue 2.5+ 版本，scoped-slot 可以作用在普通元素上。这些就是作用域插槽和普通插槽在写法上的差别。

在编译阶段，仍然是先编译父组件，同样是通过 processSlot 函数去处理 scoped-slot，它的定义在在 src/compiler/parser/index.js 中：


这块逻辑很简单，读取 scoped-slot 属性并赋值给当前 AST 元素节点的 slotScope 属性，接下来在构造 AST 树的时候，会执行以下逻辑：
```
if (element.elseif || element.else) {
  processIfConditions(element, currentParent)
} else if (element.slotScope) { 
  currentParent.plain = false
  const name = element.slotTarget || '"default"'
  ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
} else {
  currentParent.children.push(element)
  element.parent = currentParent
}
```
可以看到对于拥有 scopedSlot 属性的 AST 元素节点而言，是不会作为 children 添加到当前 AST 树中，而是存到父 AST 元素节点的 scopedSlots 属性上，它是一个对象，以插槽名称 name 为 key。

然后在 genData 的过程，会对 scopedSlots 做处理：
```
if (el.scopedSlots) {
  data += `${genScopedSlots(el.scopedSlots, state)},`
}

function genScopedSlots (
  slots: { [key: string]: ASTElement },
  state: CodegenState
): string {
  return `scopedSlots:_u([${
    Object.keys(slots).map(key => {
      return genScopedSlot(key, slots[key], state)
    }).join(',')
  }])`
}

function genScopedSlot (
  key: string,
  el: ASTElement,
  state: CodegenState
): string {
  if (el.for && !el.forProcessed) {
    return genForScopedSlot(key, el, state)
  }
  const fn = `function(${String(el.slotScope)}){` +
    `return ${el.tag === 'template'
      ? el.if
        ? `${el.if}?${genChildren(el, state) || 'undefined'}:undefined`
        : genChildren(el, state) || 'undefined'
      : genElement(el, state)
    }}`
  return `{key:${key},fn:${fn}}`
}
```

genScopedSlots 就是对 scopedSlots 对象遍历，执行 genScopedSlot，并把结果用逗号拼接，而 genScopedSlot 是先生成一段函数代码，并且函数的参数就是我们的 slotScope，也就是写在标签属性上的 scoped-slot 对应的值，然后再返回一个对象，key 为插槽名称，fn 为生成的函数代码。
对于我们这个例子而言，父组件最终生成的代码如下：

with(this){
  return _c('div',
    [_c('child',
      {scopedSlots:_u([
        {
          key: "default",
          fn: function(props) {
            return [
              _c('p',[_v("Hello from parent")]),
              _c('p',[_v(_s(props.text + props.msg))])
            ]
          }
        }])
      }
    )],
  1)
}
可以看到它和普通插槽父组件编译结果的一个很明显的区别就是没有 children 了，data 部分多了一个对象，并且执行了 _u 方法，在编译章节我们了解到，_u 函数对的就是 resolveScopedSlots 方法，它的定义在 src/core/instance/render-heplpers/resolve-slots.js 中：

export function resolveScopedSlots (
  fns: ScopedSlotsData, // see flow/vnode
  res?: Object
): { [key: string]: Function } {
  res = res || {}
  for (let i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res)
    } else {
      res[fns[i].key] = fns[i].fn
    }
  }
  return res
}
其中，fns 是一个数组，每一个数组元素都有一个 key 和一个 fn，key 对应的是插槽的名称，fn 对应一个函数。整个逻辑就是遍历这个 fns 数组，生成一个对象，对象的 key 就是插槽名称，value 就是函数。这个函数的执行时机稍后我们会介绍。

接着我们再来看一下子组件的编译，和普通插槽的过程基本相同，唯一一点区别是在 genSlot 的时候：

function genSlot (el: ASTElement, state: CodegenState): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el, state)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}`
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}
它会对 attrs 和 v-bind 做处理，对应到我们的例子，最终生成的代码如下：

with(this){
  return _c('div',
    {staticClass:"child"},
    [_t("default",null,
      {text:"Hello ",msg:msg}
    )],
  2)}
_t 方法我们之前介绍过，对应的是 renderSlot 方法：

export function renderSlot (
  name: string,
  fallback: ?Array<VNode>,
  props: ?Object,
  bindObject: ?Object
): ?Array<VNode> {
  const scopedSlotFn = this.$scopedSlots[name]
  let nodes
  if (scopedSlotFn) {
    props = props || {}
    if (bindObject) {
      if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        )
      }
      props = extend(extend({}, bindObject), props)
    }
    nodes = scopedSlotFn(props) || fallback
  } else {
    // ...
  }

  const target = props && props.slot
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}
我们只关注作用域插槽的逻辑，那么这个 this.$scopedSlots 又是在什么地方定义的呢，原来在子组件的渲染函数执行前，在 vm_render 方法内，有这么一段逻辑，定义在 src/core/instance/render.js 中：

 if (_parentVnode) {
  vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject
}
这个 _parentVNode.data.scopedSlots 对应的就是我们在父组件通过执行 resolveScopedSlots 返回的对象。所以回到 genSlot 函数，我们就可以通过插槽的名称拿到对应的 scopedSlotFn，然后把相关的数据扩展到 props 上，作为函数的参数传入，原来之前我们提到的函数这个时候执行，然后返回生成的 vnodes，为后续渲染节点用。




