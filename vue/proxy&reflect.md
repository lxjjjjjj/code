# 深入Proxy & Reflect

### Proxy中的第三个参数receiver存在的意义
```
const obj = {
  name: 'wang.haoyu',
};

const proxy = new Proxy(obj, {
  // get陷阱中target表示原对象 key表示访问的属性名
  get(target, key, receiver) {
    console.log(receiver === proxy); // true
    return target[key];
  },
});
proxy.name;

```
如果真正的调用者是继承了proxy对象呢

```
const parent = {
  get value() {
    return '19Qingfeng';
  },
};

const proxy = new Proxy(parent, {
  // get陷阱中target表示原对象 key表示访问的属性名
  get(target, key, receiver) {
    console.log(receiver === proxy); // false
    console.log(obj === receiver); // true
    return target[key];
  },
});

const obj = {
  name: 'wang.haoyu',
};

// 设置obj继承与parent的代理对象proxy
Object.setPrototypeOf(obj, proxy);

// log: 19Qingfeng
console.log(obj.value)
```
此时 receiver指的是真正的调用者，而不是实现Proxy的原对象

**get 陷阱中的 receiver 存在的意义就是为了正确的在陷阱中传递上下文。**

**Proxy 中 get 陷阱的 receiver 不仅仅代表的是 Proxy 代理对象本身，同时也许他会代表继承 Proxy 的那个对象。**

**第三个参数 receiver 代表的是代理对象本身或者继承与代理对象的对象，它表示触发陷阱时正确的上下文。**

### get 陷阱中的this关键字表示的是代理的 handler 对象。

```
const parent = {
  get value() {
    return '19Qingfeng';
  },
};

const handler = {
  get(target, key, receiver) {
    console.log(this === handler); // log: true
    console.log(receiver === obj); // log: true
    return target[key];
  },
};

const proxy = new Proxy(parent, handler);

const obj = {
  name: 'wang.haoyu',
};

// 设置obj继承与parent的代理对象proxy
Object.setPrototypeOf(obj, proxy);

obj.value

```
### Reflect中的receiver

```
const parent = {
  name: '19Qingfeng',
  get value() {
    return this.name;
  },
};

const handler = {
  get(target, key, receiver) {
    return Reflect.get(target, key);
    // 这里相当于 return target[key]
  },
};

const proxy = new Proxy(parent, handler);

const obj = {
  name: 'wang.haoyu',
};

// 设置obj继承与parent的代理对象proxy
Object.setPrototypeOf(obj, proxy);

// log: 19Qingfeng
console.log(obj.value);

```

```
const parent = {
  name: '19Qingfeng',
  get value() {
    return this.name;
  },
};

const handler = {
  get(target, key, receiver) {
   
  return Reflect.get(target, key, receiver);
  },
};

const proxy = new Proxy(parent, handler);

const obj = {
  name: 'wang.haoyu',
};

// 设置obj继承与parent的代理对象proxy
Object.setPrototypeOf(obj, proxy);

// log: wang.haoyu
console.log(obj.value);
```

# Proxy可以拦截的操作和其对应的名称

内部方法Handler  方法何时触发 
[[Get]]get读取属性
[[Set]]set写入属性
[[HasProperty]]hasin 操作符
[[Delete]]deletePropertydelete 操作符
[[Call]]apply函数调用
[[Construct]]constructnew 操作符
[[GetPrototypeOf]]getPrototypeOf Object.getPrototypeOf
[[SetPrototypeOf]]setPrototypeOf Object.setPrototypeOf
[[IsExtensible]]isExtensibleObject.isExtensible
[[PreventExtensions]]preventExtensions Object.preventExtensions
[[DefineOwnProperty]]definePropertyObject.defineProperty, Object.defineProperties
[[GetOwnProperty]]getOwnPropertyDescriptorObject.getOwnPropertyDescriptor, for..in, Object.keys/values/entries
[[OwnPropertyKeys]]ownKeysObject.getOwnPropertyNames, Object.getOwnPropertySymbols, for..in, Object.keys/values/entries

