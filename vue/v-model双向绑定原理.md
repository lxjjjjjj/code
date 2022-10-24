# 数据响应式原理 和 双向数据绑定 区别
数据响应式原理： 通过数据的改变去驱动 DOM 视图的变化。

双向数据绑定： 双向绑定除了数据驱动 DOM 之外， DOM 的变化反过来影响数据，是一个双向的关系。

# 在 Vue 中体现出双向数据绑定作用的方式有两种

## v-model 属性

v-model 即可以作用在普通表单元素上，又可以作用在组件上，它其实是一个语法糖。在大部分情况下， v-model="foo" 等价于 :value="foo" 加上 @input="foo = $event"；对于原生 html 原生元素，vue 干了大量『脏活儿』，目的是为了能让我们忽视 html 在api上的差异性。以下元素的左右两种写法是等价的

```
<textarea v-model="foo"/> ----> <textarea @input="valueOfText = $event.target.value">{{valueOfText}}</textarea>
<select v-model="foo"/> ----> <select :value="foo" @change="foo = $event.target.value"></select>
<input type="radio" value="1" v-model="foo"> ----> <input type="radio" value="1" :checked="foo == '1'" @change="foo = $event.target.value">
```
v-model 不仅仅是语法糖，它还有副作用。副作用如下：如果 v-model 绑定的是响应式对象上某个不存在的属性，那么 vue 会悄悄地增加这个属性，并让它响应式。
```
// template中：
<el-input v-model="user.tel"></el-input>
// script中：
export default {
  data() {
    return {
      user: {
        name: '公众号: 前端要摸鱼',
      }
    }
  }
}
```
### 表单元素
针对于 input 的 v-model 双向数据绑定实际上就是通过子组件中的 $emit 方法派发 input 事件，父组件监听 input 事件中传递的 value 值，并存储在父组件 data 中；然后父组件再通过 prop 的形式传递给子组件 value 值，再子组件中绑定 input 的 value 属性即可。
```
let vm = new Vue({
  el: '#app',
  template: '<div>'
  + '<input v-model="message" placeholder="edit me">' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  }
})
这是一个非常简单 demo，我们在 input 元素上设置了 v-model 属性，绑定了 message，当我们在 input 上输入了
```
从编译阶段分析，首先是 parse 阶段， v-model 被当做普通的指令解析到 el.directives 中，然后在 codegen 阶段，执行 genData 的时候，会执行 const dirs = genDirectives(el, state)。genDrirectives 方法就是遍历 el.directives，然后获取每一个指令对应的方法。对于model指令。里面有对于不同input和select等表单元素的处理还有一般组件的处理。对于input等表单元素处理结果如下：
```
<input
  v-bind:value="message"
  v-on:input="message=$event.target.value">
```
### 组件元素
其他元素使用 v-model 双向数据绑定实际上就是，通过默认监听 input 事件。以及$emit 方法派发，再通过 prop 的形式传递。

```
let Child = {
  template: '<div>'
  + '<input :value="value" @input="updateValue" placeholder="edit me">' +
  '</div>',
  props: ['value'],
  methods: {
    updateValue(e) {
      this.$emit('input', e.target.value)
    }
  }
}

let vm = new Vue({
  el: '#app',
  template: '<div>' +
  '<child v-model="message"></child>' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  },
  components: {
    Child
  }
})
```
可以看到，父组件引用 child 子组件的地方使用了 v-model 关联了数据 message；而子组件定义了一个 value 的 prop，并且在 input 事件的回调函数中，通过 this.$emit('input', e.target.value) 派发了一个事件，为了让 v-model 生效，这两点是必须的。

父组件经过编译之后变成
```
let vm = new Vue({
  el: '#app',
  template: '<div>' +
  + '<child :value="message" @input="message=arguments[0]"></child>' +
  '<p>Message is: {{ message }}</p>' +
  '</div>',
  data() {
    return {
      message: ''
    }
  },
  components: {
    Child
  }
})
```
子组件传递的 value 绑定到当前父组件的 message，同时监听自定义 input 事件，当子组件派发 input 事件的时候，父组件会在事件回调函数中修改 message 的值，同时 value 也会发生变化，子组件的 input 值被更新。

这就是典型的 Vue 的父子组件通讯模式，父组件通过 prop 把数据传递到子组件，子组件修改了数据后把改变通过 $emit 事件的方式通知父组件，所以说组件上的 v-model 也是一种语法糖。

另外我们注意到组件 v-model 的实现，子组件的 value prop 以及派发的 input 事件名是可配的

一个组件上的 v-model 默认会利用名为 value 的 prop 和名为 input 的事件，但是像单选框、复选框等类型的输入控件可能会将 value attribute 用于不同的目的。model 选项可以用来避免这样的冲突：
```
Vue.component('base-checkbox', {
  model: {
    prop: 'checked',
    event: 'change'
  },
  props: {
    checked: Boolean
  },
  template: `
    <input
      type="checkbox"
      v-bind:checked="checked"
      v-on:change="$emit('change', $event.target.checked)"
    >
  `
})
```
现在在这个组件上使用 v-model 的时候：

<base-checkbox v-model="lovingVue"></base-checkbox>
这里的 lovingVue 的值将会传入这个名为 checked 的 prop。同时当 <base-checkbox> 触发一个 change 事件并附带一个新的值的时候，这个 lovingVue 的 property 将会被更新。

注意你仍然需要在组件的 props 选项里声明 checked 这个 prop。

## .sync 修饰符

在有些情况下，我们可能需要对一个 prop 进行“双向绑定”。不幸的是，真正的双向绑定会带来维护上的问题，因为子组件可以变更父组件，且在父组件和子组件两侧都没有明显的变更来源。

这也是为什么我们推荐以 update:myPropName 的模式触发事件取而代之。举个例子，在一个包含 title prop 的假设的组件中，我们可以用以下方法表达对其赋新值的意图：

this.$emit('update:title', newTitle)
然后父组件可以监听那个事件并根据需要更新一个本地的数据 property。例如：
```
<text-document
  v-bind:title="doc.title"
  v-on:update:title="doc.title = $event"
></text-document>
为了方便起见，我们为这种模式提供一个缩写，即 .sync 修饰符：

<text-document v-bind:title.sync="doc.title"></text-document>
```
注意带有 .sync 修饰符的 v-bind 不能和表达式一起使用 (例如 v-bind:title.sync=”doc.title + ‘!’” 是无效的)。取而代之的是，你只能提供你想要绑定的 property 名，类似 v-model。

当我们用一个对象同时设置多个 prop 的时候，也可以将这个 .sync 修饰符和 v-bind 配合使用：
```
<text-document v-bind.sync="doc"></text-document>
```
这样会把 doc 对象中的每一个 property (如 title) 都作为一个独立的 prop 传进去，然后各自添加用于更新的 v-on 监听器。

将 v-bind.sync 用在一个字面量的对象上，例如 v-bind.sync=”{ title: doc.title }”，是无法正常工作的，因为在解析一个像这样的复杂表达式的时候，有很多边缘情况需要考虑。