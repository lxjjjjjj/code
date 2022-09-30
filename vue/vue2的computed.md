# computed的实现过程
1）初始化计算属性时，遍历computed对象，给其中每一个计算属性分别生成唯一computed watcher，并将该watcher中的dirty设置为true
初始化时，计算属性并不会立即计算（vue做的优化之一），只有当获取的计算属性值才会进行对应计算
2）初始化计算属性时，将Dep.target设置成当前的computed watcher，将computed watcher添加到所依赖data值对应的dep中（依赖收集的过程），然后计算computed对应的值，后将dirty改成false
3）当所依赖data中的值发生变化时，调用set方法触发dep的notify方法，将computed watcher中的dirty设置为true
4）下次获取计算属性值时，若dirty为true, 重新计算属性的值
5）dirty是控制缓存的关键，当所依赖的data发生变化，dirty设置为true，再次被获取时，就会重新计算


new watcher的过程 

initState ---> Observer 定义好get和set方法 get收集依赖dep set发布消息

```
// 空函数
const noop = () => {};
// computed初始化的Watcher传入lazy: true，就会触发Watcher中的dirty值为true
const computedWatcherOptions = { lazy: true };
//Object.defineProperty 默认value参数
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};
// 初始化computed
class initComputed {
  constructor(vm, computed) {
    // 新建存储watcher对象，挂载在vm对象执行
    const watchers = (vm._computedWatchers = Object.create(null));
    // 遍历computed
    for (const key in computed) {
      const userDef = computed[key];
      //getter值为computed中key的监听函数或对象的get值
      let getter = typeof userDef === "function" ? userDef : userDef.get;
      // 新建computed watcher
      // vm._computedWatchers和watchers用的是同一个内存地址，defineComputed中会用到
      watchers[key] = new Watcher(vm, getter, noop, computedWatcherOptions);
      if (!(key in vm)) {
        // 定义计算属性
        this.defineComputed(vm, key, userDef);
      }
    }
  }

  // 重新定义计算属性  对get和set劫持
  // 利用Object.defineProperty来对计算属性的get和set进行劫持
  // 因为访问computed的属性值是直接this.访问的，所以需要将属性挂载在this上
  defineComputed(target, key, userDef) {
    // 如果是一个函数，需要手动赋值到get上
    if (typeof userDef === "function") {
      sharedPropertyDefinition.get = this.createComputedGetter(key);
      sharedPropertyDefinition.set = noop;
    } else {
      sharedPropertyDefinition.get = userDef.get
        ? userDef.cache !== false
          ? this.createComputedGetter(key)
          : userDef.get
        : noop;
      // 如果有设置set方法则直接使用，否则赋值空函数
      sharedPropertyDefinition.set = userDef.set ? userDef.set : noop;
    }
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  // 计算属性的getter 获取计算属性的值时会调用
  createComputedGetter(key) {
    return function computedGetter() {
      // 获取对应的计算属性watcher
      const watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        // dirty为true,计算属性需要重新计算
        if (watcher.dirty) {
          // 这个evaluate方法是computed单独用的，在这个方法中会将dirty设置成false
          // evaluate () {
          //    this.value = this.get()
          //    this.dirty = false
          // }
          watcher.evaluate();
        }
        // 获取依赖
        if (Dep.target) {
          watcher.depend();
        }
        //返回计算属性的值
        return watcher.value;
      }
    };
  }
}

```

