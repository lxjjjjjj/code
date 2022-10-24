# 代理的粒度不同
defineProperty 只能代理属性，Proxy 代理的是对象。
也就是说，如果想代理对象的所有属性，defineProperty 需要遍历属性一个个加 setter 和 getter。
而 Proxy 只需要配置一个可以获取属性名参数的函数即可。
当然，如果出现嵌套的对象，Proxy 也是要递归进行代理的，但可以做惰性代理，即用到嵌套对象时再创建对应的 Proxy。

# 是否破坏原对象

defineProperty 的代理行为是在破坏原对象的基础上实现的，它通常会将原本的 value 变成了 setter 和 getter。
Proxy 则不会破坏原对象，只是在原对象上覆盖了一层。当新增属性时，希望属性被代理，defineProperty 需要显式调用该 API，而 Proxy 则可以直接用 obj.key = val的形式；

# 代理数组属性
defineProperty 不适合监听数组属性，因为数组长度可能很大，比如几百万，一个个对索引使用 defineProperty 是无法接受的。
一种方式是重写数组的 API 方法（比如 splice），通过它们来实现代理，但它是有缺陷的：直接用 arr[1] = 100 无法触发代理。这是 Vue2 的做法。
另外，我们无法对数组的 length 做代理。这暴露了 defineProperty 的一个缺陷：设置了 configurable 为 false 的属性无法进行代理。数组的 length 就是这种情况。

Proxy 则没有这个问题，它只需要设置一个 setter 和 getter，在属性变化时，能够在函数参数上拿到索引值。

# 代理范围
defineProperty 只能代理属性的 get 和 set。

Proxy 还能代理其他的行为，比如 delete 和 handler.getPrototypeOf()  等方法。

# 兼容性
Proxy 是 ES6 新增的特性，兼容性不如 defineProperty。
IE 不支持 Proxy。
且 Proxy 不能被完美 polyfill，因为它是在编程语言的层面上的修改。
Proxy 貌似还会有些性能问题，但作为标准，浏览器会持续做重点性能优化。

