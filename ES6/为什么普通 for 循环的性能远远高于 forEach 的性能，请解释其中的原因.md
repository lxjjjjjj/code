[原文链接](https://juejin.cn/post/7018097650687803422)
[js给出的forEach规范](https://user-images.githubusercontent.com/9465232/57593081-70bf1700-756c-11e9-8199-0386076f9b3d.png)

其中 forEach 里操作了 toObject 以及判断是否终止循环条件比 for loop 复杂一点。

for 循环没有任何额外的函数调用栈和上下文；

forEach函数签名实际上是

array.forEach(function(currentValue, index, arr), thisValue)

它不是普通的 for 循环的语法糖，还有诸多参数和上下文需要在执行的时候考虑进来，这里可能拖慢性能；

for循环是js提出时就有的循环方法。forEach是ES5提出的，挂载在可迭代对象原型上的方法，例如Array Set Map String arguments NodeList

既然 for 比 forEach 快为什么还要forEach呢，因为 forEach 其实是一个迭代器，他与 for 循环本质上的区别是 forEach 是负责遍历（Array Set Map）可迭代对象的，而 for 循环是一种循环机制，只是能通过它遍历出数组。

forEach 的参数
我们真正了解 forEach 的完整传参内容吗？它大概是这样：
arr.forEach((self,index,arr) =>{},this)

self： 数组当前遍历的元素，默认从左往右依次获取数组元素。
index： 数组当前元素的索引，第一个元素索引为0，依次类推。
arr： 当前遍历的数组。
this： 回调函数中this指向。
let arr = [1, 2, 3, 4];
let person = {
    name: '技术直男星辰'
};
arr.forEach(function (self, index, arr) {
    console.log(`当前元素为${self}索引为${index},属于数组${arr}`);
    console.log(this.name+='真帅');
}, person)

在js中有break return continue 对函数进行中断或跳出循环的操作，我们在 for循环中会用到一些中断行为，对于优化数组遍历查找是很好的，但由于forEach属于迭代器，只能按序依次遍历完成，所以不支持上述的中断行为。

forEach 删除自身元素，index不可被重置
在 forEach 中我们无法控制 index 的值，它只会无脑的自增直至大于数组的 length 跳出循环。所以也无法删除自身进行index重置，先看一个简单例子：
let arr = [1,2,3,4]
arr.forEach((item, index) => {
    console.log(item); // 1 2 3 4
    index++;
});

index不会随着函数体内部对它的增减而发生变化。在实际开发中，遍历数组同时删除某项的操作十分常见，在使用forEach删除时要注意。
for 循环可以控制循环起点
如上文提到的 forEach 的循环起点只能为0不能进行人为干预，而for循环不同：
let arr = [1, 2, 3, 4],
    i = 1,
    length = arr.length;

for (; i < length; i++) {
    console.log(arr[i]) // 2 3 4
};

那之前的数组遍历并删除滋生的操作就可以写成
let arr = [1, 2, 1],
    i = 0,
    length = arr.length;

for (; i < length; i++) {
    // 删除数组中所有的1
    if (arr[i] === 1) {
        arr.splice(i, 1);
        //重置i，否则i会跳一位
        i--;
    };
};
console.log(arr); // [2]
//等价于
var arr1 = arr.filter(index => index !== 1);
console.log(arr1) // [2]

for循环和forEach的性能区别

在性能对比方面我们加入一个 map 迭代器，它与 filter 一样都是生成新数组。我们对比 for forEach map 的性能在浏览器环境中都是什么样的：
性能比较：for > forEach > map
在chrome 62 和 Node.js v9.1.0环境下：for 循环比 forEach 快1倍，forEach 比 map 快20%左右。
原因分析

for：for循环没有额外的函数调用栈和上下文，所以它的实现最为简单。

forEach：对于forEach来说，它的函数签名中包含了参数和上下文，所以性能会低于 for 循环。

map：map 最慢的原因是因为 map 会返回一个新的数组，数组的创建和赋值会导致分配内存空间，因此会带来较大的性能开销。如果将map嵌套在一个循环中，便会带来更多不必要的内存消耗。

当大家使用迭代器遍历一个数组时，如果不需要返回一个新数组却使用 map 是违背设计初衷的。在我前端合作开发时见过很多人只是为了遍历数组而用 map 的

