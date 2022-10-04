# call

第一个为函数上下文也就是this，后边参数为函数本身的参数

立即执行


```
function myCall(context, ...args) {
    context = context || window
    const symbolFn = new Symbol()
    context[symbolFn] = this
    const fn = context[symbolFn](...args)
    delete context[symbolFn]
    return fn
}
```

# apply

apply接收两个参数，第一个参数为函数上下文this，第二个参数为函数参数只不过是通过一个数组的形式传入的

立即执行


```
function apply(context,args){
    context = context || window
    const symbolFn = new Symbol()
    context[symbolFn] = this
    const fn = context[symbolFn](...args)
    delete context[symbolFn]
    return fn
}
```

# bind

接收多个参数，返回一个函数，不会立即执行

bind之后不能再次修改this的执行，bind多次后执行，函数this还是指向第一次bind的对象
```
function bind(context, ...outerArgs) {
    context = context || window
    let self = this
    return function F(...innerArgs) {
        // 考虑new的方式
        if(self instanceof F) {
            return new self(...outerArgs, ...innerArgs)
        }
        let symbolfn =symbol()
        context[symbolfn] = self
        let res = context[symbolfn](...outerArgs, ...innerArgs)
        delete context[symbolfn]
        return result
    }
}
```


# 如果对象自己有个apply方法我们怎么调用原有的apply方法呢

```
function fn () {
    console.log('hello this is apply)
}

fn.apply = function () {
    console.log('调用apply')
}

解决方式

原型思路

Function.prototype.apply.call(fn,null,[1,2,3])


Reflect

Reflect.apply(fn, null, [1, 2, 3]);
```
