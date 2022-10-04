# Vue组件data为什么必须是个函数而Vue的根实例则没有这个限制

```
src/core/instance/state.js  initData
函数每次执行完都会返回全新的data对象实例

function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
    // ......
}
vue组件可能存在多个实例，如果使用对象形式定义data，会导致他们共用一个data对象，那么状态变更将会影响所有组件实例，这是不合理的，采用函数形式定义，在initData时会将其作为工厂函数返回全新的data对象，有效规避多实例之间状态污染问题，而vue根实例中则不存在该限制，也是因为根实例只有一个不用担心这种状况。

使用new Vue创建实例data是个对象不会报错为什么呢

if (options && options._isComponent) {
  // optimize internal component instantiation
  // since dynamic options merging is pretty slow, and none of the
  // internal component options needs special treatment.
  initInternalComponent(vm, options)
} else {
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
}
因为在mergeOption的时候做校验提醒
如果是new Vue会传一个vm对象不会走校验流程

```