# wacth 和 watchEffect 的区别

你可以认为他们是同一个功能的两种不同形态，底层的实现是一样的。
watch 和 watchEffect 都能监听响应式数据的变化，不同的是它们监听数据变化的方式不同。
watch 会明确监听某一个响应数据，而 watchEffect 则是隐式的监听回调函数中响应数据。
watch 在响应数据初始化时是不会执行回调函数的(除非加第三个参数{ immediate: true })，watchEffect 在响应数据初始化时就会立即执行回调函数。

## watch()

* 懒执行副作用；
* 更加明确是应该由哪个状态触发侦听器重新执行；
* 可以访问所侦听状态的前一个值和当前值。

## watchEffect

* watchEffect第一个参数的参数是可以清空无用的回调。在下一次watchEffect执行之前调用函数清空上一个异步的副作用，
比如在某个请求的某个参数变化的时候需要重新发请求，可以cancel掉上一个没有返回的请求。

* 在异步中写的watchEffect在组件销毁的时候不会被销毁，所以需要手动调用watchEffect返回值取消监听

[watch & watchEffect](https://cn.vuejs.org/api/reactivity-core.html#watch)
## watch
### 参数

watch() 默认是懒侦听的，即仅在侦听源发生变化时才执行回调函数。

第一个参数是侦听器的源。这个来源可以是以下几种：

* 一个函数，返回一个值
* 一个 ref
* 一个响应式对象
* ...或是由以上类型的值组成的数组


第二个参数是在发生变化时要调用的回调函数。这个回调函数接受三个参数：新值、旧值，以及一个用于注册副作用清理的回调函数。该回调函数会在副作用下一次重新执行前调用，可以用来清除无效的副作用，例如等待中的异步请求。

当侦听多个来源时，回调函数接受两个数组，分别对应来源数组中的新值和旧值。
第三个可选的参数是一个对象，支持以下这些选项：

* immediate：在侦听器创建时立即触发回调。第一次调用时旧值是 undefined。
* deep：如果源是对象，强制深度遍历，以便在深层级变更时触发回调。参考深层侦听器。
* flush：调整回调函数的刷新时机。参考回调的刷新时机及 watchEffect()。
* onTrack / onTrigger：调试侦听器的依赖。参考调试侦听器。
### 基本使用, 监听响应式状态发生变化的，当响应式状态发生变化时，都会触发一个回调函数。

```
const message = ref("小猪课堂");
watch(message, (newValue, oldValue) => {
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
const changeMsg = () => {
  message.value = "张三";
};
```
上段代码中我们点击按钮就会更改响应式变量 message 的值。我们又使用 watch 监听器监听了 message 变量，当它发生变化时，就会触发 watch 监听函数中的回调函数，并且回调函数默认接收两个参数：新值和旧值。当我们第一进入页面时，watch 监听函数的回调函数是不会执行的。

### watch 监听类型
watch 监听的是响应式数据，如果我们监听的数据不是响应式的，那么可能会抛出警告。watch 监听器可以监听哪些形式的数据呢

#### ref
ref 定义的数据我们是可以监听到的，除此之外，计算属性也是可以监听到的
```
const message = ref("小猪课堂");
const newMessage = computed(() => {
  return message.value;
});
watch(newMessage, (newValue, oldValue) => {
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
```
当我们 message 发生变化时，计算属性 newMessage 也会重新计算得出新的结果，我们 watch 监听函数是可以监听到计算属性变化的。

#### getter 函数
这里的 getter 函数大家可以简单的理解为获取数据的一个函数，说白了该函数就是一个返回值的操作，有点类似与计算属性。
```
const x1 = ref(12);
const x2 = ref(13);
watch(
  () => x1.value + x2.value,
  (newValue, oldValue) => {
    console.log("新的值:", newValue);
    console.log("旧的值:", oldValue);
  }
);
const changeMsg = () => {
  x1.value = 14;
  x2.value = 23;
};

```
#### 监听响应式对象
当 watch 监听的是一个响应式对象时，会隐式地创建一个深层侦听器，即该响应式对象里面的任何属性发生变化，都会触发监听函数中的回调函数。
```
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watch(number, (newValue, oldValue) => {
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
```
**需要注意的，watch 不能直接监听响应式对象的属性，即下面的写法是错误的**
```
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watch(number.count, (newValue, oldValue) => {
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
```
上段代码中相当于你直接向 watch 传递了一个非响应式的数字，然而 watch 只能监听响应式数据。如果我们非要监听响应式对象中的某个属性，我们可以使用 getter 函数的形式，代码如下是可以的
```
watch(
  () => number.count,
  (newValue, oldValue) => {
    console.log("新的值:", newValue);
    console.log("旧的值:", oldValue);
  }
);
```
上段代码也是可以监听到 count 变化的。

#### 监听多个来源的数组

```
const x1 = ref(12);
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watch([x1, () => number.count], (newValue, oldValue) => {
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
```
#### 深度监听
在前面的代码中，如果我们将一个响应式对象传递给 watch 监听器时，只要对象里面的某个属性发生了变化，那么就会执行监听器回调函数。究其原因，因为我们传入响应对象给 watch 时，隐式的添加一个深度监听器，这就让我们造成了我们牵一发而至全身的效果。但是，如果我们是使用的 getter 函数返回响应式对象的形式，那么响应式对象的属性值发生变化，是不会触发 watch 的回调函数的。

```
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watch(
  () => number,
  (newValue, oldValue) => {
    console.log("新的值:", newValue);
    console.log("旧的值:", oldValue);
  },
);
```
上段代码中我们使用 getter 函数返回了响应式对象，当我们更改 number 中 count 的值时，watch 的回调函数是不会执行的。为了实现上述代码的监听，我们可以手动给监听器加上深度监听的效果。

```
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watch(
  () => number,
  (newValue, oldValue) => {
    console.log("新的值:", newValue);
    console.log("旧的值:", oldValue);
  },
  { deep: true }
);
```

上段代码中的 newValue 和 oldValue 的值是一样的，除非我们把响应式对象即 number 整个替换掉，那么这两个值才会变得不一样。除此之外，深度监听会遍历响应式对象的所有属性，开销较大，当对象体很大时，需要慎用。所以我们推荐 getter 函数只返回相应是对象中的某一个属性！！

### 第一次进入页面， watch 第三个参数 { immediate: true } ，也可以实现首次监听

## WatchEffect

我们前面使用 watch 监听数据状态时，不知道大家有没有发现这样一个问题：只有当我们监听的数据源发生了变化，监听函数的回调函数才会执行。但是需求总是多变的，有些场景下我们可能需要刚进页面，或者说第一次渲染页面的时候，watch 监听器里面的回调函数就执行一遍。

### 参数/返回值

第一个参数就是要运行的副作用函数。这个副作用函数的参数也是一个函数，用来注册清理回调。清理回调会在该副作用下一次执行前被调用，可以用来清理无效的副作用，例如等待中的异步请求 (参见下面的示例)。

第二个参数是一个可选的选项，可以用来调整副作用的刷新时机或调试副作用的依赖。

默认情况下，侦听器将在组件渲染之前执行。设置 flush: 'post' 将会使侦听器延迟到组件渲染之后再执行。详见回调的触发时机。在某些特殊情况下 (例如要使缓存失效)，可能有必要在响应式依赖发生改变时立即触发侦听器。这可以通过设置 flush: 'sync' 来实现。然而，该设置应谨慎使用，因为如果有多个属性同时更新，这将导致一些性能和数据一致性的问题。

返回值是一个用来停止该副作用的函数。

### 立即执行一次
watchEffect 也是一个监听器，只不过它不会像 watch 那样接收一个明确的数据源，它只接收一个回调函数。而在这个回调函数当中，它会自动监听响应数据，当回调函数里面的响应数据发生变化，回调函数就会立即执行。所以我们可以将方式一中的代码使用 watchEffect 优雅的实现。
```
const number = reactive({ count: 0 });
const countAdd = () => {
  number.count++;
};
watchEffect(()=>{
  console.log("新的值:", number.count);
})
```
上段代码中，当我们第一次进入页面时，number 响应数据从无到有，这个时候就会触发 watchEffect 的回调函数，因为在 watchEffect 回调函数中使用了 number 响应数据，所以它会自动跟踪 number 数据的变化。当我们点击按钮更改 count 的值时，watchEffect 中的回调函数便会再次执行。

### 清空无用的回调
```
watchEffect(async (onCleanup) => {
  const { response, cancel } = doAsyncWork(id.value)
  // `cancel` 会在 `id` 更改时调用
  // 以便取消之前
  // 未完成的请求
  onCleanup(cancel)
  data.value = await response
})

```
#### 停止侦听器：
```
const stop = watchEffect(() => {})

// 当不再需要此侦听器时:
stop()
```
## 回调中的 DOM

如果我们在监听器的回调函数中或取 DOM，这个时候的 DOM 是更新前的还是更新后的？

```
<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <p ref="msgRef">{{ message }}</p>
  <button @click="changeMsg">更改 message</button>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch, watchEffect } from "vue";


const message = ref("小猪课堂");
const msgRef = ref<any>(null);
const changeMsg = () => {
  message.value = "张三";
};
watch(message, (newValue, oldValue) => {
  console.log("DOM 节点", msgRef.value.innerHTML);
  console.log("新的值:", newValue);
  console.log("旧的值:", oldValue);
});
</script>
```
我们通过点击按钮更改 message 的值，从“小猪课堂”变为“张三”。但是我们发现在监听器的回调函数里面获取到的 DOM 元素还是“小猪课堂”，说明 DOM 还没有更新。

如果我们想要在回调函数里面获取更新后的 DOM，非常简单，我们只需要再给监听器多传递一个参数选项即可：flush: 'post'。watch 和 watchEffect 同理。

```
watch(
  message,
  (newValue, oldValue) => {
    console.log("DOM 节点", msgRef.value.innerHTML);
    console.log("新的值:", newValue);
    console.log("旧的值:", oldValue);
  },
  {
    flush: "post",
  }
);
```
虽然 watch 和 watchEffect 都可以用上述方法解决 DOM 问题，但是 Vue3 单独给 watchEffect 提供了一个更方便的方法，也可以叫做 watchEffect 的别名，代码如下：
```
watchPostEffect(() => {
  /* 在 Vue 更新后执行 */
})
```
## 手动停止监听器

通常来说，我们的一个组件被销毁或者卸载后，监听器也会跟着被停止，并不需要我们手动去关闭监听器。但是总是有一些特殊情况，即使组件卸载了，但是监听器依然存在，这个时候其实式需要我们手动关闭它的，否则容易造成内存泄漏。比如下面这中写法，我们就需要手动停止监听器：
```
<script setup>
import { watchEffect } from 'vue'
// 它会自动停止
watchEffect(() => {})
// ...这个则不会！
setTimeout(() => {
  watchEffect(() => {})
}, 100)
</script>
```
上段代码中我们采用异步的方式创建了一个监听器，这个时候监听器没有与当前组件绑定，所以即使组件销毁了，监听器依然存在。
关闭方法很简单，代码如下：
```
const unwatch = watchEffect(() => {})
// ...当该侦听器不再需要时
unwatch()
```
我们需要用一个变量接收监听器函数的返回值，其实就是返回的一个函数，然后我们调用该函数，即可关闭当前监听器。

