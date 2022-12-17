```
const obj = { a: 1, b: 2 }; 
const proxy = new Proxy(obj,{
    get(target, key, receiver){
        return target[key]
    },
    set(target, key, newVal,receiver){
        target[key] = newVal
        return target
    }
});
const bb = {...proxy}; 
console.log(bb);
console.log(proxy)
bb: {a: 1, b: 2}
proxy: Proxy {a: 1, b: 2}
// 解构之后bb是一个普通对象不是一个proxy对象
```
export default {
    setup() {
        const obj = reactive({ foo: 1, bar: 2 })
        setTimeout(() => {
            obj.foo = 100
        }, 1000)
        return {
            ...obj
        }
    }
}
<template>
  <p>{{foo}} / {{bar}}</p>
</template>
所以在解构返回对象的时候会导致数据失去响应性

如何在副作用函数内，即使通过普通对象newObj来访问属性，也能建立响应联系。
// obj是响应数据
const obj = reactive({ foo: 1, bar: 2 })
// newObj对象具有与obj对象同名的属性，并且每个属性值都是一个对象
// 该对象具有一个访问器属性 value 当读取 value 的值时，其实读取的都是 obj 对象下相应的属性值
const newObj = {
    foo: {
        get value() {
            return obj.foo
        }
    },
    bar: {
        get value() {
            return obj.bar
        }
    }
}
effect(() => {
    console.log(newObj.foo.value)
})
// 这时能够触发响应了
obj.foo = 100

也就是说当在副作用函数内读取newObj.foo时，等价于间接读取了obj.foo的值，这样响应式数据自然能够和副作用函数建立响应联系。

function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        }
    }
    return wrapper
}
如果响应式数据obj的键非常多，我们还要话费很多精力来处理，所以封装toRefs
function toRefs(obj) {
    const ret = {}
    for(const key in obj) {
        ret[key] = toRef(obj, key)
    }
    return ret
}
我们需要将toRef或者toRefs转换后得到的结果视为真正的ref数据，为此我们需要为toRef函数增加一段代码
function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        }
    }
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })
    return wrapper
}
但是上述实现的toRef有缺陷，因为是只读的。我们应该为它加上setter函数
function toRef(obj, key) {
    const wrapper = {
        get value() {
            return obj[key]
        },
        set value(val) {
            obj[key] = val
        }
    }
    Object.defineProperty(wrapper, '__v_isRef', {
        value: true
    })
    return wrapper
}
toRefs确实会把响应式数据的第一层属性值转换为ref，因此必须通过value属性访问值
const obj = reactive({ foo: 1, bar: 2 })
const newObj = { ...toRefs(obj) }
newObj.foo.value // 1
newObj.bar.value // 2
自动脱ref的能力 所谓自动脱ref，指的是属性的访问行为，即如果读取的属性是一个ref，则直接将该ref对应的value属性值返回
比如 newObj.foo // 1, 可以利用__v_isRef属性来实现自动脱ref
function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            return value.__v_isRef ? value.value : value
        }
    })
}
const newObj = proxyRefs({ ...toRefs(obj) })
