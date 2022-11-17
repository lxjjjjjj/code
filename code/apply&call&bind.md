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
    const symbolFn = Symbol()
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
        let symbolfn = Symbol()
        context[symbolfn] = self
        let result = context[symbolfn](...outerArgs, ...innerArgs)
        delete context[symbolfn]
        return result
    }
}
```

```
Function.prototype.myBind = function (ctx, ...args) {
 // fn.myBind(ctx, [arg1, arg2])

 // this是正在执行的函数
 const fn = this
 // 保证 ctx[key] 的唯一性，避免和用户设置的 context[key] 冲突
 const key = Symbol()
 // 将执行函数设置到指定的上下文对象上
 ctx[key] = fn
 // 返回一个可执行函数
 // bind 方法支持预设一部分参数，剩下的参数通过返回的函数设置，具有柯里化的作用
 return function(...otherArgs) {
  // 执行函数
  return ctx[key](...args, ...otherArgs)
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
