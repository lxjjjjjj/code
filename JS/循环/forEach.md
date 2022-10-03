# forEach的本质
forEach是ES5提出的，挂载在可迭代对象原型上的方法，例如Array Set Map。forEach是一个迭代器，负责遍历可迭代对象。那么遍历，迭代，可迭代对象分别是什么呢。
**遍历** 指的对数据结构的每一个成员进行有规律的且为一次访问的行为。
**迭代** 迭代是递归的一种特殊形式，是迭代器提供的一种方法，默认情况下是按照一定顺序逐个访问数据结构成员。迭代也是一种遍历行为。
**可迭代对象** ES6中引入了 iterable 类型，Array Set Map String arguments NodeList 都属于 iterable，他们特点就是都拥有 [Symbol.iterator] 方法，包含他的对象被认为是可迭代的 iterable。

# 实现原理
只要是可迭代对象，调用内部的 Symbol.iterator 都会提供一个迭代器，并根据迭代器返回的next 方法来访问内部。把调用 next 方法返回对象的 value 值并保存在 item 中，直到 done 为 true 跳出循环。

```
function num(params) {
    console.log(arguments); // Arguments(6) [1, 2, 3, 4, callee: ƒ, Symbol(Symbol.iterator): ƒ]
    let iterator = arguments[Symbol.iterator]()
    console.log(iterator.next()); // {value: 1, done: false}
    console.log(iterator.next()); // {value: 2, done: false}
    console.log(iterator.next()); // {value: 3, done: false}
    console.log(iterator.next()); // {value: 4, done: false}
    console.log(iterator.next()); // {value: undefined, done: true}
}
num(1, 2, 3, 4)

let set = new Set('1234')
set.forEach(item => {
    console.log(item); // 1 2 3 4
})
let iterator = set[Symbol.iterator]()
console.log(iterator.next()); // {value: 1, done: false}
console.log(iterator.next()); // {value: 2, done: false}
console.log(iterator.next()); // {value: 3, done: false}
console.log(iterator.next()); // {value: 4, done: false}
console.log(iterator.next()); // {value: undefined, done: true}
```
# 语法

## forEach 的参数

```
arr.forEach((self,index,arr) =>{},this)

self： 数组当前遍历的元素，默认从左往右依次获取数组元素。
index： 数组当前元素的索引，第一个元素索引为0，依次类推。
arr： 当前遍历的数组。
this： 回调函数中this指向。
```
```
let arr = [1, 2, 3, 4];
let person = {
    name: '技术直男星辰'
};
arr.forEach(function (self, index, arr) {
    console.log(`当前元素为${self}索引为${index},属于数组${arr}`);
    console.log(this.name+='真帅');
}, person)
```
我们可以利用 arr 实现数组去重：
```
let arr1 = [1, 2, 1, 3, 1];
let arr2 = [];
arr1.forEach(function (self, index, arr) {
    arr1.indexOf(self) === index ? arr2.push(self) : null;
});
console.log(arr2);   // [1,2,3]

```
## forEach的中断
在js中有break return continue 对函数进行中断或跳出循环的操作,我们在 for循环中会用到一些中断行为，对于优化数组遍历查找是很好的，但由于forEach属于迭代器，只能按序依次遍历完成，所以不支持上述的中断行为。如果我一定要在 forEach 中跳出循环呢？其实是有办法的，借助try/catch

若遇到 return 并不会报错，但是不会生效
```
let arr = [1, 2, 3, 4];arr.forEach((self,index) => {
    if (self === 2) { 
        console.log(self);
        return;
    };
    console.log('wa',self);
});
wa 1
2
wa 3
wa 4
```
```
try {
    var arr = [1, 2, 3, 4];
    arr.forEach(function (item, index) {
        //跳出条件
        if (item === 3) {
            throw new Error("LoopTerminates");
        }
        //do something
        console.log(item);
    });
} catch (e) {
    if (e.message !== "LoopTerminates") throw e;
};
```
## forEach 删除自身元素，index不可被重置
在 forEach 中我们无法控制 index 的值，它只会无脑的自增直至大于数组的 length 跳出循环。所以也无法删除自身进行index重置，先看一个简单例子,index不会随着函数体内部对它的增减而发生变化。在实际开发中，遍历数组同时删除某项的操作十分常见，在使用forEach删除时要注意。
```
let arr = [1,2,3,4]
arr.forEach((item, index) => {
    console.log(item); // 1 2 3 4
    index++;
});
```
# 性能 --- 对比 for > forEach > map 的性能
性能比较: for > forEach > map
原因分析:

for：for循环没有额外的函数调用栈和上下文，所以它的实现最为简单。
forEach：对于forEach来说，它的函数签名中包含了参数和上下文，所以性能会低于 for 循环。
map：map 最慢的原因是因为 map 会返回一个新的数组，数组的创建和赋值会导致分配内存空间，因此会带来较大的性能开销。如果将map嵌套在一个循环中，便会带来更多不必要的内存消耗。
