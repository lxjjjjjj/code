组件通信常用方式有以下8种：


# props
# $emit/$on
```
vm.$on( event, callback )
参数：

{string | Array<string>} event (数组只在 2.2.0+ 中支持)
{Function} callback
用法：

监听当前实例上的自定义事件。事件可以由 vm.$emit 触发。回调函数会接收所有传入事件触发函数的额外参数。

示例：

vm.$on('test', function (msg) {
  console.log(msg)
})
vm.$emit('test', 'hi')
// => "hi"

```
$children/$parent
```
```
$attrs/$listeners
```
vm.$listeners
2.4.0 新增

类型：{ [key: string]: Function | Array<Function> }

只读

详细：

包含了父作用域中的 (不含 .native 修饰器的) v-on 事件监听器。它可以通过 v-on="$listeners" 传入内部组件——在创建更高层次的组件时非常有用。

vm.$attrs
2.4.0 新增

类型：{ [key: string]: string }

只读

详细：

包含了父作用域中不作为 prop 被识别 (且获取) 的 attribute 绑定 (class 和 style 除外)。当一个组件没有声明任何 prop 时，这里会包含所有父作用域的绑定 (class 和 style 除外)，并且可以通过 v-bind="$attrs" 传入内部组件——在创建高级别的组件时非常有用。
```
# ref
# $root
```
vm.$root
类型：Vue instance

只读

详细：

当前组件树的根 Vue 实例。如果当前实例没有父实例，此实例将会是其自己。
```
eventbus

vuex

# provide+inject
2.2.0 新增

类型：

provide：Object | () => Object
inject：Array<string> | { [key: string]: string | Symbol | Object }
详细：

这对选项需要一起使用，以允许一个祖先组件向其所有子孙后代注入一个依赖，不论组件层次有多深，并在其上下游关系成立的时间里始终生效。如果你熟悉 React，这与 React 的上下文特性很相似。

provide 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的 property。在该对象中你可以使用 ES2015 Symbols 作为 key，但是只在原生支持 Symbol 和 Reflect.ownKeys 的环境下可工作。

inject 选项应该是：

一个字符串数组，或
一个对象，对象的 key 是本地的绑定名，value 是：
在可用的注入内容中搜索用的 key (字符串或 Symbol)，或
一个对象，该对象的：
from property 是在可用的注入内容中搜索用的 key (字符串或 Symbol)
default property 是降级情况下使用的 value
提示：provide 和 inject 绑定并不是可响应的。这是刻意为之的。然而，如果你传入了一个可监听的对象，那么其对象的 property 还是可响应的。

示例：

// 父级组件提供 'foo'
var Provider = {
  provide: {
    foo: 'bar'
  },
  // ...
}

// 子组件注入 'foo'
var Child = {
  inject: ['foo'],
  created () {
    console.log(this.foo) // => "bar"
  }
  // ...
}
利用 ES2015 Symbols、函数 provide 和对象 inject：

const s = Symbol()

const Provider = {
  provide () {
    return {
      [s]: 'foo'
    }
  }
}

const Child = {
  inject: { s },
  // ...
}
接下来 2 个例子只工作在 Vue 2.2.1 或更高版本。低于这个版本时，注入的值会在 props 和 data 初始化之后得到。

使用一个注入的值作为一个 property 的默认值：

const Child = {
  inject: ['foo'],
  props: {
    bar: {
      default () {
        return this.foo
      }
    }
  }
}
使用一个注入的值作为数据入口：

const Child = {
  inject: ['foo'],
  data () {
    return {
      bar: this.foo
    }
  }
}
在 2.5.0+ 的注入可以通过设置默认值使其变成可选项：

const Child = {
  inject: {
    foo: { default: 'foo' }
  }
}
如果它需要从一个不同名字的 property 注入，则使用 from 来表示其源 property：

const Child = {
  inject: {
    foo: {
      from: 'bar',
      default: 'foo'
    }
  }
}
与 prop 的默认值类似，你需要对非原始值使用一个工厂方法：

const Child = {
  inject: {
    foo: {
      from: 'bar',
      default: () => [1, 2, 3]
    }
  }
}

# 注意vue3中废弃的几个API

$children https://v3-migration.vuejs.org/breaking-changes/children.html
$listeners https://v3-migration.vuejs.org/breaking-changes/listeners-removed.html
$on/$off https://v3-migration.vuejs.org/breaking-changes/events-api.html#overview


# 根据组件之间关系讨论组件通信最为清晰有效

父子组件

props/$emit/$parent/ref/$attrs



兄弟组件

$parent/$root/eventbus/vuex



跨层级关系

eventbus/vuex/provide+inject

