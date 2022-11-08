[原文链接](https://juejin.cn/post/7109257658447691784)
```
源码分析版本：3.2.36

function ref(value) {
    return createRef(value, false);
}

ref 函数跳转到 createRef 函数。
function createRef(rawValue, shallow) {
    ...
    return new RefImpl(rawValue, shallow);
}

createRef 函数返回的是 RefImpl 类的实例，换句话说，ref 创建出来的响应式就是 RefImpl 实例对象。

class RefImpl {
    constructor(value, __v_isShallow) {
        ... 
        this._value = __v_isShallow ? value : toReactive(value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        newVal = this.__v_isShallow ? newVal : toRaw(newVal);
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal;
            this._value = this.__v_isShallow ? newVal : toReactive(newVal);
            triggerRefValue(this, newVal);
        }
    }
}
复制代码
__v_isShallow 参数在这里默认是 false，这里也顺带讲一嘴，当我们在使用 shallowRef 时，这个参数为 true。
function shallowRef(value) {
    return createRef(value, true);
}

```
Ref 与 Reactive 创建的都是递归响应的，将每一层的 json 数据解析成一个 proxy 对象，shallowRef 与 shallowReactive 创建的是非递归的响应对象，
shallowReactive 创建的数据第一层数据改变会重新渲染 dom。
```
 var state = shallowReactive({
    a:'a',
    gf:{
       b:'b',
       f:{
          c:'c',
          s:{d:'d'}
       }
    }
 });
// 改变第一层的数据会导致页面重新渲染
state.a = '1'
// 如果不改变第一层，只改变其他的数据页面不会重新渲染 
state.gf.b = 2
通过 shallowRef 创建的响应式对象，需要修改整个 value 才能重新渲染 dom。
```

### ref 能做，但是 reactive 不能做
我们通过源码来分析了两个响应式 API，发现 Vue3 中有没有 reactive 能做而 ref 做不了的场景？
结论是：没有
简单来说 ref 是在 reactive 上在进行了封装进行了增强，所以在 Vue3 中 reactive 能做的，ref 也能做，reactive 不能做的，ref 也能做。

