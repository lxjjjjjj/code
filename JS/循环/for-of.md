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
for in 遍历的是数组的索引（index），而for of遍历的是数组元素值（value）

for in更适合遍历对象，当然也可以遍历数组，但是会存在一些问题

index索引为字符串型数字，不能直接进行几何运算
```
var arr = [1,2,3]
    
for (let index in arr) {
  let res = index + 1
  console.log(res)
}
//01 11 21
```
使用for in会遍历数组所有的可枚举属性，包括原型，如果不想遍历原型方法和属性的话，可以在循环内部判断一下，使用hasOwnProperty()方法可以判断某属性是不是该对象的实例属性
```
var arr = [1,2,3]
Array.prototype.a = 123
    
for (let index in arr) {
  let res = arr[index]
  console.log(res)
}
//1 2 3 123

for(let index in arr) {
    if(arr.hasOwnProperty(index)){
        let res = arr[index]
  		console.log(res)
    }
}
// 1 2 3
```
for of遍历的是数组元素值，而且for of遍历的只是数组内的元素，不包括原型属性和索引

for of适用遍历数/数组对象/字符串/map/set等拥有迭代器对象（iterator）的集合，但是不能遍历对象，因为没有迭代器对象，但如果想遍历对象的属性，你可以用for in循环（这也是它的本职工作）或用内建的Object.keys()方法
var myObject={
　　a:1,
　　b:2,
　　c:3
}
for (var key of Object.keys(myObject)) {
  console.log(key + ": " + myObject[key]);
}
//a:1 b:2 c:3

for in遍历的是数组的索引（即键名），而for of遍历的是数组元素值

for in总是得到对象的key或数组、字符串的下标

for of总是得到对象的value或数组、字符串的值