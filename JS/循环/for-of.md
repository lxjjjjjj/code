# 实现原理

只要是可迭代对象，调用内部的 Symbol.iterator 都会提供一个迭代器，并根据迭代器返回的next 方法来访问内部。把调用 next 方法返回对象的 value 值并保存在 item 中，直到 done 为 true 跳出循环。“for of”是ES6的产物，它是迭代器的遍历方式，也属于特殊语法,“for of”需要对遍历对象进行一次判定，即存不存在“Symbol.iterator”属性，所以遍历空对象会报错。

```
let arr = [1, 2, 3, 4]  // 可迭代对象
let iterator = arr[Symbol.iterator]()  // 调用 Symbol.iterator 后生成了迭代器对象
console.log(iterator.next()); // {value: 1, done: false}  访问迭代器对象的next方法
console.log(iterator.next()); // {value: 2, done: false}
console.log(iterator.next()); // {value: 3, done: false}
console.log(iterator.next()); // {value: 4, done: false}
console.log(iterator.next()); // {value: undefined, done: true}

let arr = [1, 2, 3, 4]
for (const item of arr) {
    console.log(item); // 1 2 3 4 
}
```

