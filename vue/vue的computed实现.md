首先 vue 初始化过程中，会执行 initComputed，遍历 computed 对象中的每个 key，对每个属性进行 new Watcher 操作，这里的 new Watcher 与 data 中的 new Watcher 传参不同，这里传入 { lazy: true } 参数，将 Watcher 内部的 dirty 设成 true，然后将 computed 的属性定义到 vm 上（也就是 this 上），computed 对应属性的值进行 getter 处理，获取对应的 watcher，判断 watcher 上 dirty 值是否为 true，如果为 true，执行 watcher 的 evaluate 重新计算，执行 evaluate 后会将 dirty 设成 false，后续读取 computed 中的值则不会重新计算。如果 computed 中的依赖项发生变化，其中的依赖项会触发 Object.definedProperty 的 setter，进而触发 notify， notify 触发 watcher 的 update，执行 update 后会将 dirty 设成 ture，因此，再次读取 computed 中属性值时会重新计算。

# 关键代码

watcher 
```
update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
evaluate () {
    this.value = this.get()
    this.dirty = false
  }
```

initComputed

```
var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}
```