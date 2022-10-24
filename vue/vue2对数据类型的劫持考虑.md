http://soiiy.com/Vue-js/11190.html

在 Vue2.x 中，不支持通过修改数组索引和长度的数据劫持；

那么，为什么原本可以实现对数组索引的观测，Vue 却选择了不支持呢？

主要是考虑了性能问题，比如，数组中的数据量非常大时：

let vm = new Vue({
  el: '#app',
  data() {
    return { arr:new Array(9999) }
  }
});

这时，数组中 9999 条数据，将全部被添加 get、set 方法

而这一套操作就比较费劲了：为了实现数组索引劫持，需要对数组中每一项进行处理

还有就是，虽然数组能够通过 defineProperty 实现对索引更新劫持

但在实际开发场景真的需要吗？似乎很少会使用 arr[888] = x 这种操作

所以，权衡性能和需求，Vue 源码中没有采用 defineProperty 对数组进行处理

当然，这也就导致了在 Vue 中无法通过直接修改索引、length 触发视图的更新


数组的劫持思路
核心目标是要实现数组的响应式：

Vue 认为这 7 个方法能够改变原数组：push、pop、splice、shift、unshift、reverse、sort

所以，只要对这 7 个方法进行处理，就能劫持到数组的数据变化，实现数组数据的响应式

备注：这种实现思路，也直接导致了 vue2 修改数组的索引和长度不能触发视图更新


4，数组方法的拦截思路
重写方法需要在原生方法基础上，实现对数据变化的劫持操作
仅对响应式数据中的数组进行方法重写，不能影响非响应式数组
所以，对响应式数据中数组这 7 个方法进行拦截，即优先使用重写方法，其他方法还走原生逻辑

数组方法的查找，先查找自己身上的方法（即重写方法），找不到再去链上查（原生方法）


Object.defineProperty是可以劫持数组的下标变化的
```
  var ary = [1,2]
  var temp = 0
  Object.defineProperty(ary,2,{
    configurable:true,
    set(value){
      temp = value
      console.log('变化了',value)
    },
    get(){
      console.log('获取值')
      return temp
    }
  })

```

Object.defineProperty只能劫持已有属性,要监听数组变化,必须预设数组长度,遍历劫持,但数组长度在实际引用中是不可预料的

Object.defineProperty无法劫持数组长度length属性得变化,而数组length属性会影响数组的变动
例如: 上面代码,设置数组长度length为0,ary[2]得值变成了undefined,但没有触发set,未监听到变动
复制代码



Object.defineProperty只能劫持已有属性,要监听数组变化,必须预设数组长度,遍历劫持,但数组长度在实际引用中是不可预料的

数组删除新增会导致索引key发生变动,每次变动都需要重新遍历,添加劫持,数据量大时非常影响性能

例如:如上代码删除数组第一个元素,ary[2]的监听失效了

以上原因vue2抛弃了使用Object.defineProperty对数组的监听


