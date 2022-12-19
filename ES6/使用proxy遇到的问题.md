[原文链接](https://juejin.cn/post/7138070814791827469)

# 总结
使用Proxy代理Set、Map、URL这样的对象访问对象内部提供的访问器属性，会和直接访问普通对象的属性不同。
比如访问set.size属性因为在set的内部是这样定义访问size属性的步骤的，Set.prototype.size是一个访问器属性，它的set访问器函数是undefined，它的get访问器函数会执行以下步骤，首先让this指向调用者，在Proxy内部调用者是proxy对象，因为proxy对象上没有size属性，所以报出错误。需要Reflect.get(target, property, target);这样访问对象链上的数据。

对于对象上的方法的访问需要手动改变this的指向，达到可以访问内部方法的目的。

const data = { a: 1, b: 2 };const obj = new Proxy(data, {
    get(target, key, receiver){
        return Reflect.get(target, key, receiver)
    }
}); console.log(data,obj.a); // 正常工作

function Data() {return { a: 1, b: 2 }}; const sub = new Data();const obj = new Proxy(sub, {
    get(target, key, receiver){
        return Reflect.get(target, key, receiver)
    }
}); console.log(sub, obj.a); // 正常工作

const url = new URL(location.href); 
proxy = new Proxy(url, { 
    get(target, property, receiver) { 
        return Reflect.get(target, property, receiver); 
    } 
}); console.log(typeof url) // object
proxy.pathname; // 报错Illegal invocation
# 示例
创建一个URL对象的代理。除去添加的行为外，代理的意义在于它们跟代理的对象相同，但是从attempt看，并非如此。
```
// attempt 1 
url = new URL(location.href); 
proxy = new Proxy(url, {}); 
proxy.pathname; // Uncaught TypeError: Illegal invocation 

// attempt 2 
url = new URL(location.href); 
proxy = new Proxy(url, { 
    get: (target, property, receiver) => { 
        return Reflect.get(target, property, target); 
    } 
}); 
proxy.pathname; // works 
proxy.toString(); // Uncaught TypeError: Illegal invocation 

// attempt 3 
url = new URL(location.href); 
proxy = new Proxy(url, { 
    get: (target, property) => { 
        return typeof target[property] === 'function' 
            ? (...args) => target[property](...args) 
            : target[property]; 
    } 
}); 
proxy.pathname; // works 
proxy.toString(); // works 
proxy.toString === proxy.toString; // false
```
报错的Illegal invocation是什么意思？

调用关键字this而未引用其最初执行的对象时将引发“非法调用”。换句话说，就是原始的“上下文”丢失了。
结合Proxy来看，就是在代理的情况下，目标对象内部的this关键字指向了Proxy代理对象，导致与目标对象的行为不一致。有些原生对象（Date、Set、Map等）的内部属性，只有通过正确的this才能拿到。

```
const target = { 
    foo() { 
        return { 
            isTarget: this === target, 
            isProxy: this === proxy
        };
    }
}; 

const proxy = new Proxy(target, {}); 
console.log(target.foo()); // { isTarget: true, isProxy: false } 
console.log(proxy.foo()); // { isTarget: false, isProxy: true }
```

## attempt 2

通过Reflect.get(target, property, target)解决了pathname属性的获取报错问题。

Reflect.get(target, propertyKey[, receiver])

target：需要取值的目标对象
propertyKey：需要获取的值的键值
receiver：如果target对象中指定了getter，receiver则为getter调用时的this值。

而 handler.get() 中的 receiver 是 Proxy 或者继承 Proxy 的对象。

所以 Reflect.get(target, property, target) 将 this 重新指向为 target 目标对象，就解决了属性的获取问题。

但是新的问题出现了，proxy.toString() 调用报错。而同时 url.toString === proxy.toString 为 true。

## attempt 3

attempt 3是通过判断获取的属性是否为函数：是的话，返回一个箭头函数，箭头函数的返回值是target对应的函数；否则，返回target对应的属性。
proxy.toString 可以正常调用了，但是问题也显而易见，每次调用都会返回一个新的函数，所以proxy.toString === proxy.toString始终为false。

所以Rich Harris真正关心的是在 url.toString === proxy.toString 为 true 的情况下，为什么 proxy.toString 会调用失败？反而需要重新去绑定this关键字的指向来让proxy.toString正常执行，但不管通过(...args) => target[property](...args)还是 target[property].bind(target) 也好，都无法解决 proxy.toString === proxy.toString 和 url.toString === proxy.toString为false。
也许可以通过WeakMap缓存或者在外部写具名函数来解决 proxy.toString === proxy.toString 的问题，但是 url.toString === proxy.toString 始终还是存在问题。

我觉得有两位的回复是解答了关于url.toString === proxy.toString的问题。
Bradley Farias的回答大致意思是Proxy代理了对象，但是也破坏了类似于身份检查的执行，Keith Cirkel也表示url.toString会确定调用对象是否为一个实际的URL对象，而不是其他类型的对象。

const proxify = (something, root) => new Proxy(something, {
    get(target, prop, receiver) {
        if ((typeof target[prop] === 'function') || (typeof target[prop] === 'object')) {
            return proxify(target[prop], something);
        }
        return Reflect.get(target, prop);
    },
    apply(target, thisArg, argumentsList) {
        return Reflect.apply(target, root || thisArg, argumentsList);
    }
});

const url = new URL('https://twitter.com/Rich_Harris/status/1539375179394056192');
const proxy = proxify(url);
console.log(proxy.pathname); // works
console.log(proxy.toString()); // works

众所周知，Vue3的reactive也是用Proxy实现的，支持Set和Map的响应式代理。而Vue3是通过重写get、set、has等方法，本质上是调用target的方法进行响应式的实现。大家也可以去reactivity/collectionHandlers.ts查看具体代码，掘金上也有很多响应式原理相关的文章，就不班门弄斧了。




