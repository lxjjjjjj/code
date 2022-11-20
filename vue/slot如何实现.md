[原文链接](https://juejin.cn/post/7095620683710873608)

* 普通插槽、 作用域插槽 的 vNode 是在哪个环节生成的，render 父组件时还是子组件时？
* 作用域插槽 为什么能在父组件访问到子组件的数据？
* 普通插槽 跟 作用域插槽 在实现上有区别吗？

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


# 不同slot的编译区别
Vue 处理 作用域插槽 跟 普通插槽 的差异就是从编译开始的，也就是 render函数 会有所不同。

默认插槽直接在父组件的 render 阶段生成 vNode。

子组件 render 时，可能通过某种手段取得已经生成好的 插槽vNode 用作自己的 slot 节点。
因为观察上述默认插槽的render函数：e("h1", [t._v("默认插槽")])，直接就是 my-slot 组件的childre节点（位于 my-slot 组件的第三个参数）。

作用域插槽是在子组件 render 阶段生成 vNode。

因为我们观察作用域插槽 footer 的编译后结果，其不作为 my-slot 组件的 children，而是被放在了 my-slot 组件的 第二个参数 data 中的一个 scopedSlots属性里。
并且，作用域插槽的 render 函数 外层的 funciton 接收了一个参数。如果在执行子组件 render 的时候调用，那完全可以拿到子组件的数据。


# slot
initRender：获取 vm.$slot 。组件初始化时执行（比如执行到 my-slot组件 时，可从vm.$slot 获取父组件中的slot vNode，也就是我们的 默认插槽）

renderSlot：把组件的 slot 替换成真正的 插槽vNode
```
function initRender (vm) {
  // ....
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  // ....
}
```
resolveSlots

```
function resolveSlots (
  children,
  context
) {
  if (!children || !children.length) {
    return {}
  }
  var slots = {};
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}
```
renderSlot

```
function renderSlot (
  name,
  fallbackRender,
  props,
  bindObject
) {
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) {
    // scoped slot
    props = props || {};
    if (bindObject) {
      if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
        warn('slot v-bind without argument expects an Object', this);
      }
      props = extend(extend({}, bindObject), props);
    }
    nodes =
      scopedSlotFn(props) ||
      (typeof fallbackRender === 'function' ? fallbackRender() : fallbackRender);
  } else {
    nodes =
      this.$slots[name] ||
      (typeof fallbackRender === 'function' ? fallbackRender() : fallbackRender);
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}
```

普通插槽、 作用域插槽 的 vNode 是在哪个环节生成的，render 父组件时还是子组件时？


默认插槽，不管 v2.5 、 v2.6 的写法，都是在 父组件中生成 vNode。vNode 存在 vm.$slot 中。待子组件 render 到插槽时，会直接拿到 父组件的 vNode

具名插槽两个版本情况不一。根据编译结果可知：

v2.5 的写法，跟默认插槽是一样的，在父组件生成vNode，子组件直接拿来用
v2.6 中，直接时在 子组件 中才去执行 插槽render ，生成 插槽vNode。

作用域插槽。不管版本，都是在子组件中进行render的。


大家不妨这么理解，模版编译后，只要是被放在 scopeSlots属性 中的插槽，都会在子组件执行 render 的时候才会去生成vNode。


作用域插槽 为什么能在父组件访问到子组件的数据？

作用域插槽只有子组件render的时候，才会执行render生成vNode。并且，作用域插槽的 render 函数能接参数，从而获得子组件的数据。就是这样形成了作用域插槽！所以我们能在父组件中，访问到子组件的data数据。

普通插槽 跟 作用域插槽 在实现上有区别吗？

有区别。

普通插槽。如果是 v2.5 ，具名插槽 和 默认插槽 都只在 父组件 render 的时候生成 vNode，子组件要 渲染slot 的时候，直接在父组件实例的 $slot 中获取已经是vNode的数据。
普通插槽。如果是 v2.6 ，具名插槽 虽然是在子组件中执行的 render，但是其不接收参数。
作用域插槽。不管 v2.5 还是 v2.6，都只在 子组件执行 render，并且能接收参数。

好了，最后来个精炼的总结。作用域插槽一定是延迟执行，且接收参数！普通插槽 可能延迟执行，可能直接执行，但不接收参数！
