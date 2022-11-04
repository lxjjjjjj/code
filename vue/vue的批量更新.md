[原文链接](https://juejin.cn/post/6844904198698434573)
vue在创建组件的时候会创建属于这个组件的render watcher、computed watcher、watch watcher
每个wacther都有个id并且watcher id 是根据父组件创建完创建子组件id自增的。每次set的对象属性的时候，会触发在get里面的watcher重新执行。Vue实现批量更新的原理是创建一个queueWacther，在队列中放入一次更新过程中所有的watcher，并且按照id的大小排序，放到队列中便利数组依次执行。
```
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}
```
# 例子
```
data() {
    return {
        msg: 'a'
    }
},
watch: {
    msg() {
        console.log('jianting')
    }
},
created() {
    this.msg = 'b'
    this.msg = 'c'
    this.msg = 'd'
}
```
## has[id]
我们对msg进行了3次set操作，对应三次Watcher的update方法，对应三次queueWatcher，而这三次排队每次传的参数，都是同一个Watcher实例，所以第一次has[id]才为null，第一次置为true之后，后面的两次就直接结束了。其实通俗地解释就是，第一次触发mutation，到Vue这就会告诉你，已经加入到队列了，后面就会处理，同一个Watcher的其他mutation就不再接待了。
那么首次mutation其实会把Wathcer实例加入到queue队列里，然后在未来的某个时间，会遍历queue并调用所有Watcher实例的cb。

## flushing
关于flushing这个变量，其实我们看这个if else，在if分支watcher会被放到队列末尾，而else分支其实会按照watcher的id放到queue的相应位置，queue中的所有watcher是按照Id升序排列的，而如果这个id的watcher已经被执行过了，那么就会被放到队列的下一项，下个就执行该watcher的cb。其实可以看出来flushing就是为了保证queue中的所有watcher的顺序永远都是按id升序的。Vue源码里给了三点注释:
```
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
```
大致说的是为了保证父子组件按照顺序执行update、用户创建的watcher（像这个例子中在watch这个option中监听msg就会创建一个user wathcer）在render watcher之前执行、在父组件的watcher run的时候销毁了子组件，那么子组件的watcher就不会被执行了。
这里我觉得知道queue中所有watcher是按照id升序排列的，而id是创建watcher时自增的就够了，具体为什么这么干以后遇到具体场景就理解了。

## waiting

waiting这个变量，这个变量很简单，就是保证完成一次对queue的遍历之前不会开启新的遍历。