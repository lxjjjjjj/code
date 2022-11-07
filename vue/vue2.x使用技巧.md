1.子组件的值改变父组件对应的值
```
model: {
  prop: 'filter',
  event: 'change'
},
this.$emit('change',Object.assign({},this.filter,{
    delivery_type_second_level: val[0] ? val[0] : 0,
    delivery_type_third_level: val[1] ? val[1] : 0
}))
父组件
<SearchFilter v-model="filter" >
</SearchFilter>
```
2.各种样式
```
1):class="[sideOutputSwitch ? 'select-formItem-style':'']"
2):style="{width: `${chart.type_attr.scale || 100}%`}"
3):style="widthHandle(scope,item)"
widthHandle(scope, item) {
    const width = scope.row[`width_${item.label}`]
    if (width) {
      return {
        background: 'linear-gradient(to right, #aaccf0, #4296ee)',
        width
      }
    } else {
      return ''
    }
}
4):style="item.copy ? 'cursor: pointer;' : ''"
5):style="'background-color: ' + backgroundColor"
6):style="`max-height: ${height}px`"

```
3.指令
https://github.com/jd-smart-fe/shared/issues/7
```
（一）生命周期
Vue.directive('my-directive', {
  bind: function(){
    // 指令第一次绑定到元素时调用，做绑定的准备工作
    // 比如添加事件监听器，或是其他只需要执行一次的复杂操作 触发一次
  },
  inserted: function(){
    // 被绑定标签的父节点加入 DOM 时立即触发 触发一次
  },
  update: function(){
    //当组件(或VNode)更新的时候，会执行 update
    // 根据获得的新值执行对应的更新
    //如果值不变就不会执行
    // 对于初始值也会调用一次
  },
  componentUpdated: function(){
    // 指令所在组件的 VNode 及其子 VNode 全部更新后调用，一般使用 update 即可
    // 被绑定的元素所在模板完成一次更新更新周期的时候调用
  },
  unbind: function(){
    // 做清理操作 只触发一次
    // 比如移除bind时绑定的事件监听器
  }
})

（二）踩坑
bind在Vue实例创建期间执行created函数时执行，但此时并未将数据渲染到内存中的DOM树，对不在DOM树中的元素调用方法是无效的，在插入DOM树之后调用方法才有效。
所以和JS行为有关的操作，最好在inserted中去执行，防止JS行为不生效。和样式相关的操作，一般都可以在 bind 执行，不管这个元素有没有被插入到页面中去，这个元素肯定有了一个内联样式，浏览器的渲染引擎会解析样式，应用给这个元素。

update和componentUpdate方法里写if判断如果判定条件没成立第一次if判断没有执行。 那么无论后面if语句里面的值如何变化if执行的判定条件成立了update都不会执行

一个页面中有多个相同的vue指令， vue指令里调用相同的vue组件，如果一个vue组件的update方法执行，那么也会影响同一页面的其他vue指令的生命周期执行。

当只是用到 update 函数的时候，可以简化写法
Vue.directive('my-directive', function(){
  // update 内的代码块
})

（三）参数
el: 指令所绑定的元素，可以用来直接操作DOM 。
binding: 一个对象，包含以下属性：
name: 指令名，不包括 v- 前缀。
value: 指令的绑定值， 例如： v-directive="1 + 1"，value 的值是 2。
oldValue: 指令绑定的前一个值,仅在 update 和 componentUpdated 钩子中可用。无论值是否改变都可用。
expression: 绑定值的字符串形式。 例如 v-directive="1 + 1" ， expression 的值是 "1 + 1"。
arg: 传给指令的参数。例如 v-directive:foo, arg 的值是 "foo"。
modifiers: 一个包含修饰符的对象。 例如： v-directive.foo.bar, 修饰符对象 modifiers 的值是 { foo: true, bar: true }。
vnode: Vue 编译生成的虚拟节点。
oldVnode: 上一个虚拟节点，仅在 update 和 componentUpdated 钩子中可用。

（四）区别
bind 和 inserted 的区别
// 注册一个全局自定义指令v-focus
Vue.directive('focus', {
// 当绑定元素插入到DOM中
    inserted: function (el) {
    // 聚焦元素
        el.focus()
    }
    //聚焦不到元素
    bind: function(el){
        el.focus()
    }
});
var app = new Vue({
    el: '#app'
});
以上例子中，如果将代码写在 bind 钩子函数内，el.focus() 并未生效，这是因为在 bind 钩子函数被调用时，虽然能够通过 bind 的第一个参数 el 拿到对应的 DOM 元素，但是此刻该 DOM 元素还未被插入进 DOM 树中，因此在这个时候执行 el.focus() 是无效的。


update 和 componentUpdated 的区别
update: function (el, binding, vnode) {
    console.log('update')
    console.log(el.innerHTML)   // Hello
},
componentUpdated: function (el, binding, vnode) {
    console.log('componentUpdated')
    console.log(el.innerHTML)   // Hi
}
update 钩子函数触发时机是自定义指令所在组件的 VNode 更新时， componentUpdated 触发时机是指令所在组件的 VNode 及其子 VNode 全部更新后。此处使用 el.innerHTML 获取 data 值，从运行结果上看 update 和 componentUpdated 是 DOM 更新前和更新后的区别。

（五）Vue自定义指令优先级顺序
系统默认指令会先于自定义指令执行

自定义指令在标签上的位置越靠前就越早执行

<!-- v-show 先于 v-block 执行 -->
<div v-block v-show="false"></div>

<!-- v-none 先于 v-block 执行 -->
<div v-none v-block></div>

（六）Vue指令的用途
尽管Vue推崇数据驱动视图的理念，但并非所有情况都适合数据驱动。自定义指令就是一种有效的补充和扩展，不仅可用于定义任何的 DOM 操作，并且是可复用的。
1.操作dom
eg: 很多时候我们会遇到图片加载慢的问题，那么，在图片未完成加载前，可以用随机的背景色占位，图片加载完成后才直接渲染出来。˙这里，用自定义指令可以非常方便的实现这个功能。
Vue.directive('img',{
    //DOM
    inserted:function(el,binding){
        var color =Math.floor(Math.random()*1000000);
        el.style.backgroundColor = '#' + color;
        var img = new Image();
        img.src = binding.value;
        img.onload = function(){
            el.style.backgroundImage = 'url(' + binding.value + ')';
        }
    }
})
<div v-img="val.url" v-for="val in list"></div>
//此处图片路径为示意结果，为了能够更好的看出本段测试代码的效果，建议大家选择网上比较高清的图片
list:[
    {url:'1.jpg'},
    {url:'1.jpg'},
    {url:'1.jpg'}
]

2.用于集成第三方插件
文档通常会用到 highlight.js，我们可以直接将其封装为一个自定义指令，这样 highlight.js 就变成了 Vue 的一个新功能。

var hljs = require('highlight.js');
Vue.directive('highlight',function(el){
    hljs.hightlightBlock(el);
})
<pre>
    <code v-hightlight>&lt;alert-menu
        :menudata="menu"
        :e="eventObj"
        ref="menu"
        v-on:menuEvent="handle"&gt;
        &lt;/alert-menu&gt;
    </code>
</pre>
运行结果：

输出<alert-menu>标签里的所有内容，而且按照 html 的高亮显示规则显示。

（七）Vue指令和Vue组件之间的关系
很多时候，对于初学者来说，看完指令的使用会发现组件的使用和指令的自定义有几分相似之处。其实，并非如此，组件和指令完全不是一个层级上的概念。打个比方：组件是一个房子，它可以嵌套使用，房子里边又有窗户，门，桌子，床，柜子等这些子组件。而指令是附着在组件上的某种行为或者功能，门和窗户可以打开关闭，桌子可以折叠，柜子可以打开关上等等。以下是对于组件和指令的定义，希望能够让大家更清晰的理解：

组件：一般是指一个独立实体，组件之间的关系通常都是树状。

Vue指令：用以改写某个组件的默认行为，或者增强使其获得额外功能，一般来说可以在同一个组件上叠加若干个指令，使其获得多种功能。比如 v-if，它可以安装或者卸载组件。

根据需求的不同，我们要选择恰当的时机去初始化指令、更新指令调用参数以及释放指令存在时的内存占用等。一个健壮的库通常会包含：初始化实例、参数更新和释放实例资源占用等操作。

Vue.directive('hello', {
    bind: function (el, binding) {
        // 在 bind 钩子中初始化库实例
        // 如果需要使用父节点，也可以在 inserted 钩子中执行
        el.__library__ = new Library(el, binding.value)
    },
    update: function (el, binding) {
        // 模版更新意味着指令的参数可能被改变，这里可以对库实例的参数作更新
        // 酌情使用 update 或 componentUpdated 钩子
        el.__library__.setOptions(Object.assign(binding.oldValue, binding.value))
    },
    unbind: function (el) {
        // 释放实例
        el.__library__.destory()
    }
})
```
4.mixin

参考文章
https://juejin.cn/post/6844903828735655949
https://juejin.cn/post/6844903903746588680

5.关于this.$set （flinkSQL）

```
对象
<ul @click=clickFn>
  <li v-for="(item,key) of list" :key='item'>
  obj--{{key}}-{{item}}
  </li>
</ul>
list: {
a: 1,
b: 2
}
clickFn() {
  if (this.list.c) {
    this.list.c = 333; //视图更新
  } else {
    this.list = { // 视图更新
      a: 1,
      b: 2,
      c: 3
    };
  }
}

数组

视图更新：重新赋值；this.$set()；原生方法：比如splice()、 push()、pop()、shift()、unshift()、sort()、reverse()。

视图不更新：ary[0] = 11

<ul>
  <li v-for="item in list" :key="item.id">{{item.name}}</li>
</ul>
list: [
  { name: 'a', id: 0 },
  { name: 'b', id: 1 },
  { name: 'c', id: 2 },
  { name: 'd', id: 3 },
  { name: 'e', id: 4 },
  { name: 'f', id: 5 },
  { name: 'g', id: 6 }
],
this.list[0] = { name: 'aa', id: 0 } // 视图不会更新
this.list[0].name = 'aaa' // 视图不会更新
this.$set(this.list[0],'name','aaa') // 视图不会更新
this.$set(this.list,0,{name:'e',id:9}) // 视图更新
this.list = [ // 视图更新
   { name: 'a', id: 0 },
   { name: 'b', id: 1 }
   ]
this.list.reverse()// 视图更新
```

```
6.关于生命周期
7.watch
8.compute
9.一般弹窗的写法
10.this.$emit
11.props
12.$refs 拿到渲染之后的原生dom结构进行渲染
```

```
13.router跳转路由 path和name的区别 chilren路由的使用
```

```
14.Vue 路由切换时页面刷新页面
https://blog.csdn.net/z9061/article/details/82179988
```
17.Vue实例的生命周期
```
每个 Vue 实例在被创建时要经历设置数据监听、编译模板、将实例挂载到DOM并在数据变化时更新 DOM 等初始化工作。
https://img-blog.csdnimg.cn/20200725011528766.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzQ2NDY5MTM3,size_16,color_FFFFFF,t_70
```
18 mutating props vue-warn

```
直接将props绑定v-model的值
index.vue
<SearchFilter
  v-model="filter">
</SearchFilter>
data() {
  return {
    filter: {}
  }
}

SearchFilter.vue
model: {
  prop: 'filter',
  event: 'change'
},
props: {
  filter: {
    type: Object,
    default: () => {
      return {}
    }
  }
}
```

19 双向绑定问题

```
1.this.$set(this.field,lalaal,'dsfsfs')
vue监听不到数据的变化
所以应当
this.$set(this.field,lalaal,'dsfsfs')
const field = JSON.parse(JSON.strigify(this.field))
//实现双向绑定
this.field = field
```

```
<bm-radio-group v-model="item.storageMqType">
    <bm-radio v-for="option in item.storageOptions"
      :label="option.storageName"
      :key="option.storageName">{{option.storageName}}</bm-radio>
</bm-radio-group>
this.selectedDataSource.forEach((item, index) => {
    if (item.tableId === table_id && storageOptions && storageOptions.length) {
      updateIndex = index
      //实现双向绑定
      this.$set(item, 'storageMqType', storageType || storageOptions[0].storageName)
    }
})
```

```
<bm-form-item label="灰度配置">
    <bm-radio-group v-model="modalSelf.data.grayConfig.grayConfigType" size="small">
      <bm-radio :label="item.value" border  v-for="item in grayConfigList">{{item.label}}</bm-radio>
    </bm-radio-group>
</bm-form-item>
watch: {
  modal: {
    handler(val) {
      this.modalSelf = Object.assign({}, val.data.grayConfig ? val:{
      show: val.show,
      data: {
        grayStrategy: Number(val.data.grayStrategy) === 0 ? '' : Number(val.data.grayStrategy),
        grayConfig: {
          grayConfigType:''//如果此时设定初始值的话，就不能实现双向绑定
        },
        id:val.data.id
      }
    })
    }
  },
  'modalSelf.data.grayStrategy': {
    handler(val) {
      if (val === 2) {
        this.grayConfigList = grayConfigList.filter(item => {
          return item.value === 'ratio'
        })
      } else if (val === 3) {
        this.grayConfigList = grayConfigList.filter(item => {
          return item.value === 'value' || item.value === 'regex'
        })
      } else if( val===1 ) {
        this.grayConfigList = grayConfigList
      }
      this.modalSelf.data.grayConfig.grayConfigType = ''
    }
  }
},
```

```
computed: {
  filteredDataSource: function () {
    const keyword = this.datasourceFilter
    return keyword ? this.dataSourceOptions.map(option => {
      return option.tableName.toLowerCase().includes(keyword.toLowerCase())
    }) : this.dataSourceOptions
    
    // 如果写成const filteredDataSource = JSON.parse(JSON.stringify(this.dataSourceOptions))
    // return filteredDataSource
    // 就会报错不能实现双向绑定
  },
},
methods: {
  // 获取可用数据源的列表
  getDatasourceOptions() {
    this.$http.get(this.PATH_PREFIX.ONEDATA + this.API.GOVERNMENT.GETALLTABLEINFOS).then(res => {
      if (res.code === 0) {
        this.dataSourceOptions = res.data.map(option => {
          option.selected = false
          return option
        })
      } else {
        this.$message.error(res.msg)
      }
    }).catch(() => {
      this.$message.error('网络错误')
    })
  }
}
<bm-collapse class="datasource-accordionWrapper"
    accordion>
    <bm-collapse-item v-for="(datasource,index) in filteredDataSource"
      @change="changeDataSource($event)"
      :key="index">
      <bm-checkbox class="mr-1"
        v-model="datasource.selected"
        //双向绑定的重点
        @change="selectDataSource(datasource)"></bm-checkbox>
      <template slot="title">
    </bm-collapse-item>
</bm-collapse>
```



#### 常见Vue报错整理

```
vue项目报错'Do not use built-in or reserved HTML elements as component id:'

这是因为组件的命名和html标签重复导致警告，所以创建组件的时候要注意组件命名与html标签区分开

对组件的名称有两处检查

if (type === 'component' && (commonTagRE.test(id) || reservedTagRE.test(id))) {
  warn('Do not use built-in or reserved HTML elements as component ' + 'id: ' + id);
}

// var commonTagRE = /^(div|p|span|img|a|b|i|br|ul|ol|li|h1|h2|h3|h4|h5|h6|code|pre|table|th|td|tr|form|label|input|select|option|nav|article|section|header|footer)$/i;
// var reservedTagRE = /^(slot|partial|component)$/i;

https://cnodejs.org/topic/5816aabdcf18d0333412d323
```
#### Vue 代码更加简洁

```
watch: {
  config(config) {
    const props = config.props;
    props.forEach(item => {
      // 初始化校验规则
      this.rules[item.prop] = [{
        required: item.required || false,
        message: item.message || '请输入',
        trigger: item.trigger || 'blur',
      }]
    })
  }
},
```
#### 父子组件传值的12种方法

https://zhuanlan.zhihu.com/p/109700915
```
updated 生命周期函数 不能监听到子组件的子组件中值的变化

$emit/$on隔代、兄弟组件通信
Bus，通过一个空的 Vue 实例作为中央事件总线（事件中心），用它来触发事件和监听事件，巧妙而轻量地实现了任何组件间的通信，包括父子、兄弟、跨级。

const Bus = new Vue()
Vue.prototype.$bus = new Vue();
this.$Bus.$emit("sendMessage", this.message)
this.$Bus.$on("sendMessage", data => {
    this.data = data;
})
一次注册监听事件，永久都会监听
mounted() {
  this.$Bus.$on('sendParams',data=>{
    console.log('data :', data);
  })
},
```

```
npm 包 只要不重新安装使用的就是本地之前的版本
所以如果有问题 重新npm i 一次 包就能回到正常状态
```
#### 父组件监听子组件生命周期
父组件监听到子组件mounted就做一些逻辑处理。可以通过@hook:mounted来监听。
```
<template lang="html">
  <div id="app">
    <list
      :items="['Wonderwoman', 'Ironman']"
      :item-click="item => (clicked = item)"
    ></list>
    <p>Clicked hero: {{ clicked }}</p>
    <子组件
      @hook:mounted="doSomething"
      @hook:created="doSomething(1)"
    ></子组件>
  </div>
</template>
<script>
methods:{
    doSomething(data){
        console.log(data)
    }
}
</script>
```
#### 同一组件，不同路由复用

```
从/detail/a跳到/detail/b时，发现组件的生命钩子没有执行，原因是vue-router发现这是同一个组件，复用了这个组件。

const router = new VueRouter({
  routes: [
    {
      path: '/detail/:id',
      name: 'detail',
      component: () => import('../components/home/route'),
    }
  ]
})

通常可以监听$route的变化来处理一些逻辑，比如数据初始化。

watch: {
 '$route': { // 使用watch来监控是否是同一个路由
 		handler: 'resetData',
 }
},
还可以给 router-view 添加一个不同的key，这样即使是公用组件，只要url变化了，就一定会重新创建这个组件。
<router-view :key="$route.fullPath"></router-view>
```

#### Vue属性绑定函数注意问题

```
不要在选项属性或回调上使用箭头函数
比如 created: () => console.log(this.a) 或 vm.$watch('a', newValue => this.myMethod())，因为箭头函数并没有 this，this不是vm实例。
```
#### props传递

```
如果子组件需要父组件对象的每个属性，可以通过v-bind='objProp'传递objProp.a，objProp.b
// app.vue
<wprop v-bind="objProp"></wprop>
	data:function(){
      return {
        objProp:{
          a:1,
          b:2
        }
      }
    },

//wprop.vue
export default {
  props:['a','b'],
}
```
#### $attrs 和 inheritAttrs 搭配起来使用

```
// 子组件
<template>
  <label>
    {{ label }}
    <input 
    v-bind="$attrs" v-bind:value="value" v-on:input="$emit('input', $event.target.value)"> // $attrs：除了props之外的属性，如required和placeholder
  </label>
</template>
<script>
export default {
  inheritAttrs: false, // 禁用特性继承，否则label和input标签都会继承父组件绑定的required和placeholder的值
  name: "BaseInput",
  props: ["label", "value"],
  data() {
    return {};
  }
};
</script>

// 父组件
<base-input
   v-model="username"
   required
   label="用户名"
   placeholder="Enter your username"
   ></base-input> 
```
#### 修改input表单原有的input事件

```
事件名推荐使用中划线，如果$emit('clickEvent')，则需要$on('clickevent')，$on('clickEvent')监听不到，因为事件监听器在 DOM 模板中会被自动转换为全小写。


代码块
JavaScript
<template lang="html">
  <div>
    <input
      type="checkbox"
      v-bind:checked="checked"
      v-on:change="$emit('change', $event.target.checked)"
    >
  </div>
</template>
<script>
export default {
  name: "wcheckbox",
  model: {
    prop: "checked", // 绑定checked属性，，
    event: "change" // 触发change事件，emit出去。
  },
  props: {
    checked: Boolean
  }
};
</script>
```
#### 利用sync属性，子组件改变父组件的值

```
// 子组件
<label @click="labelC">多选框</label>
methods: {
    labelC() {
      this.$emit('update:data',this.data+123) // 这里emit事件的名称必须是update:[prop]
    }
  }

// 父组件
<wcheckbox 
    :data.sync="checkboxValue" // 等于prop+@'update:data'
v-model="checkbox"></wcheckbox>
```
#### 表格组件的插槽用法

```
<template>
  ...
    <my-table>
    <template #row={ item }>
            /* 一些内容，你可以在这里自由使用“item” */
        </template>
  </my-table>  
    ...
</template>
```
#### 在 created 或 mounted 的钩子中定义自定义事件监听器或第三方插件，并且需要在 beforeDestroy 钩子中删除它以避免引起任何内存泄漏

```
mounted () {
  window.addEventListener('resize', this.resizeHandler);
  this.$on("hook:beforeDestroy", () => {
    window.removeEventListener('resize', this.resizeHandler);
  })
}
```
####  watch 的 immediate: true 代替mounted中计算两次值

```
watch: {
    title: {
      immediate: true,
      handler(newTitle, oldTitle) {
        console.log("Title changed from " + oldTitle + " to " + newTitle)
      }
    }
}
```
#### 验证prop的一个字符串列表

```
props: {
  status: {
    type: String,
    required: true,
    validator: function (value) {
      return [
        'syncing',
        'synced',
        'version-conflict',
        'error'
      ].indexOf(value) !== -1
    }
  }
}
```
#### 动态指令参数
假设你有一个按钮组件，并且在某些情况下想监听单击事件，而在其他情况下想监听双击事件
```
<template>
    ...
    <aButton @[someEvent]="handleSomeEvent()" />...
</template>
<script>
  ...
  data(){
    return{
      ...
      someEvent: someCondition ? "click" : "dbclick"
    }
  },
  methods: {
    handleSomeEvent(){
      // handle some event
    }
  }  
</script>
```
#### 重用相同路由的组件

```
const routes = [
  {
    path: "/a",
    component: MyComponent
  },
  {
    path: "/b",
    component: MyComponent
  },
];

<template>
    <router-view :key="$route.path"></router-view>
</template>
```
#### 把所有Props传到子组件很容易

```
<template>
  <childComponent v-bind="$props" />
</template>

代替：

<template>
  <childComponent :prop1="prop1" :prop2="prop2" :prop="prop3" :prop4="prop4" ... />
</template>


```
#### 把所有事件监听传到子组件很容易

```
<template>
    <div>
    ...
        <childComponentv-on="$listeners" />...    
  <div>
</template>
```
参考文章链接
https://zhuanlan.zhihu.com/p/321765600

#### 使用watch还是computed

```
需要的值如果同时依赖的是props传进来的值和组件内部的某个值
那么使用watch比较好

而不是使用computed 使用computed需要建一个额外的没有用的变量
```
#### 计算属性getter不执行的场景
当包含计算属性的节点被移除并且模板中其他地方没有再引用该属性的时候，那么对应的计算属性的getter函数方法不会执行
```
<template>
  <div>
    <h4>测试</h4>
    <div>
      <button @click="toggleShow">Toggle Show Total Price</button>
      <p v-if="showTotal">Total Price = {{totalPrice}}</p>
    </div>
  </div>

</template>

<script>
   export default {
    data () {
       return {
        showTotal: true,
        basePrice: 100
       }
     },
    computed: {
      totalPrice () {
        return this.basePrice + 1
      }
    },
    methods: {
      toggleShow () {
        this.showTotal = !this.showTotal
      }
    }
  }
</script>

```
#### 在v-for中使用计算属性，起到类似"过滤器的作用"


```
<template>
  <div>
    <h4>测试</h4>
    <div>
      <ul>
      	<li v-for="n in evenNumbers">{{n}}</li>
      </ul>
    </div>
  </div>

</template>

<script>
   export default {
    data () {
       return {
        numbers: [ 1, 2, 3, 4, 5 ]
       }
     },
    computed: {
      evenNumbers () {
        return this.numbers.filter(function (number) {
          return number % 2 === 0
        })
      }
    }
  }
</script>

```
#### computed【getter和setter的一些思考】
不是说更改了getter里使用的变量，就会触发computed的更新，前提是computed里的值必须要在模板里使用才行
```
<template>
    <div id="demo">
         <!-- <p> {{ fullName }} </p> -->
         <input type="text" v-model="firstName">
         <input type="text" v-model="lastName">
    </div>
</template>

var vm = new Vue({
  el: '#demo',
  data: {
    firstName: 'zhang',
    lastName: 'san'
  },
  computed: {
    fullName: function () {
      console.log('computed getter...')
      return this.firstName + ' ' + this.lastName
    }
  },
  updated () {
     console.log('updated')
  }
})
就算我们更改了firstName以及lastName都不会触发computed 中的 getter 中的console.log('computed getter...')，而只会触发console.log('updated')

```

```
<template>
    <div id="demo">
         <p> {{ fullName }} </p>
         <input type="text" v-model="fullName">
         <input type="text" v-model="firstName">
         <input type="text" v-model="lastName">
    </div>
</template>

var vm = new Vue({
  el: '#demo',
  data: {
    firstName: 'zhang',
    lastName: 'san'
  },
  computed: {
    fullName: {
      //getter 方法
        get(){
            console.log('computed getter...')
            return this.firstName + ' ' + this.lastName
        }，
   //setter 方法
        set(newValue){
            console.log('computed setter...')
            var names = newValue.split(' ')
            this.firstName = names[0]
            this.lastName = names[names.length - 1]
            return this.firstName + ' ' + this.lastName
        }
      
    }
  },
  updated () {
     console.log('updated')
  }
})
```
在template 中，我们可以看到，input 是直接绑 v-model="fullName"，如果我们这里直接修改了fullName的值，那么就会触发setter，同时也会触发getter以及updated函数。其执行顺序是setter -> getter -> updated，如下：


```
console.log('computed setter...')
console.log('computed getter...')
console.log('updated')
这里需要注意的是，并不是触发了setter也就会触发getter，他们两个是相互独立的。
我们这里修改了fullName会触发getter是因为setter函数里有改变firstName 和 lastName 值的代码。
也就是说我们如果注释掉上边的setter中修改firstName 和lastName的代码后就不会执行getter，如下：
set(newValue){
    console.log('computed setter...')
    // var names = newValue.split(' ')
   //  this.firstName = names[0]
  //  this.lastName =     names[names.length - 1]
  return this.firstName + ' ' + this.lastName
}
console.log('computed setter...')
console.log('updated')
```
