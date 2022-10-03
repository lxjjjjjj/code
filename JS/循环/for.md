# 本质
for 循环是一种循环机制，只是能通过它遍历出数组。

# 中断行为
在js中有break return continue 对函数进行中断或跳出循环的操作,我们在 for循环中会用到一些中断行为，对于优化数组遍历查找是很好的。
```
let arr = [1, 2, 3, 4],
    i = 0,
    length = arr.length;
for (; i < length; i++) {
    console.log(arr[i]); //1,2
    if (arr[i] === 2) {
        break;
    };
};

输出结果
1
2
```
# for 循环可以控制循环起点
```
let arr = [1, 2, 3, 4],
    i = 1,
    length = arr.length;

for (; i < length; i++) {
    console.log(arr[i]) // 2 3 4
};
```
# 遍历并删除的操作可以写成
```
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
```