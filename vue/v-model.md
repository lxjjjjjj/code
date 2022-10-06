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
```
export default function model (
  el: ASTElement,
  dir: ASTDirective,
  _warn: Function
): ?boolean {
  warn = _warn
  const value = dir.value
  const modifiers = dir.modifiers
  const tag = el.tag
  const type = el.attrsMap.type

  if (process.env.NODE_ENV !== 'production') {
    // inputs with type="file" are read only and setting the input's
    // value will throw an error.
    if (tag === 'input' && type === 'file') {
      warn(
        `<${el.tag} v-model="${value}" type="file">:\n` +
        `File inputs are read only. Use a v-on:change listener instead.`
      )
    }
  }

  if (el.component) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
  } else if (tag === 'select') {
    genSelect(el, value, modifiers)
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers)
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers)
  } else if (tag === 'input' || tag === 'textarea') {
    genDefaultModel(el, value, modifiers)
  } else if (!config.isReservedTag(tag)) {
    genComponentModel(el, value, modifiers)
    // component v-model doesn't need extra runtime
    return false
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `<${el.tag} v-model="${value}">: ` +
      `v-model is not supported on this element type. ` +
      'If you are working with contenteditable, it\'s recommended to ' +
      'wrap a library dedicated for that purpose inside a custom component.'
    )
  }

  // ensure runtime directive metadata
  return true
}
```