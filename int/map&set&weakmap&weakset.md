# WeakMap & Map 区别
传统的Object只能以字符串作为键名，这具有非常大的限制,于是有了map数据结构，它可以用任意数据类型作为键名，有get和set方法，用于取值和添加键值对

WeakMap结构与Map结构类似，也是用于生成键值对的集合。WeakMap与Map的区别有两点。首先，WeakMap只接受对象作为键名（null除外），不接受其他类型的值作为键名。 WeakMap 与 Map 在 API 上的区别主要是两个，一是没有遍历操作（即没有keys()、values()和entries()方法），也没有size属性。

# Set & WeakSet 区别
Set是ES6 提供的新的数据结构 。它类似于数组，但是成员的值都是唯一的，没有重复的值。有add和delete方法，用于添加和删除。还有size属性，用于获取长度

WeakSet 结构与 Set 类似，也是不重复的值的集合。但是，它与 Set 有两个区别。首先，WeakSet 的成员只能是对象，而不能是其他类型的值。其次，WeakSet 中的对象都是弱引用。

# 弱引用
WeakMap,WeakSet都是弱引用(具体是WeakMap中的key是弱引用)。

一般我们将数据存在堆当中，需要我么手动去把这些数据清除这些数据的引用。将它们设置为null,很容易造成内存泄漏。然而如果我们使用WeakMap或者WeakSet,WeakMap中的键和WeakSet一旦没有其他对象的引用时，他会消失，也就是会自动被垃圾回收自动回收。

