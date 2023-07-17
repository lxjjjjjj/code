# 为什么typeof null 的结果是object

```
null是一种基本数据类型，存储在栈区；而typeof null的结果却是Object，而Object是引用数据类型，存储在堆区。其次，根据代码alert (person instance of Object)输出结果为false,我们可以知道null并不是Object的实例，两者之间存在矛盾

在 javascript 的最初版本中，使用的 32位系统，js为了性能优化，使用低位来存储变量的类型信息

对象(Object)	000
整数	1
浮点数	010
字符串	100
布尔	110
undefined	-2^31(即全为1)
null	全为0

在判断数据类型时，是根据机器码低位标识来判断的，而null的机器码标识为全0，而对象的机器码低位标识为000。所以typeof null的结果被误判为Object
```
# 如何判断一个对象是Promise对象
```
let a = new Promise((resolve,reject)=>{resolve()});
console.log(a instanceof Promise);// true
```
# ?. 中文名为可选链 和 ?? 中文名为空位合并运算符

```
const a = 0 || '林三心' // 林三心
const b = '' || '林三心' // 林三心
const c = false || '林三心' // 林三心
const d = undefined || '林三心' // 林三心
const e = null || '林三心' // 林三心

??和||最大的区别是，在??这，只有undefined和null才算假值

const a = 0 ?? '林三心' // 0
const b = '' ?? '林三心' // ''
const c = false ?? '林三心' // false
const d = undefined ?? '林三心' // 林三心
const e = null ?? '林三心' // 林三心

```
# Promise.any

```
E12新增的Promise的方法

接收一个Promise数组，数组中如有非Promise项，则此项当做成功
如果有一个Promise成功，则返回这个成功结果
如果所有Promise都失败，则报错

// 当有成功的时候，返回最快那个成功
function fn(time, isResolve) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      isResolve ? resolve(`${time}毫秒后我成功啦！！！`) : reject(`${time}毫秒后我失败啦！！！`)
    }, time)
  })
}

Promise.any([fn(2000, true), fn(3000), fn(1000, true)]).then(res => {
  console.log(res) // 1秒后 输出  1000毫秒后我成功啦
}, err => {
  console.log(err)
})

// 当全都失败时
function fn(time, isResolve) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      isResolve ? resolve(`${time}毫秒后我成功啦！！！`) : reject(`${time}毫秒后我失败啦！！！`)
    }, time)
  })
}

Promise.any([fn(2000), fn(3000), fn(1000)]).then(res => {
  console.log(res)
}, err => {
  console.log(err) // 3秒后 报错 all Error
})

```
# 数字分隔符


const num = 1000000000

// 使用数字分隔符
const num = 1_000_000_000


# ||= 和 &&=

```
或等于(||=)   a ||= b 等同于 a || (a = b);

且等于(&&=)   a &&= b 等同于 a && (a = b);

```
# 对象计算属性

```
if (type === 'boy') {
  this.setData({
    boyName: name
  })
} else if (type === 'girl') {
  this.setData({
    girlName: name
  })
}

this.setData({
  [`${type}Name`]: name
})

```
# Promise.allSettled

ES11新增的Promise的方法

接收一个Promise数组，数组中如有非Promise项，则此项当做成功
把每一个Promise的结果，集合成数组，返回

function fn(time, isResolve) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      isResolve ? resolve(`${time}毫秒后我成功啦！！！`) : reject(`${time}毫秒后我失败啦！！！`)
    }, time)
  })
}

Promise.allSettled([fn(2000, true), fn(3000), fn(1000)]).then(res => {
  console.log(res)
  // 3秒后输出 
  [
  { status: 'fulfilled', value: '2000毫秒后我成功啦！！！' },
  { status: 'rejected', reason: '3000毫秒后我失败啦！！！' },
  { status: 'rejected', reason: '1000毫秒后我失败啦！！！' }
]
})

# Promise.all输出

function fn(time, isResolve) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      isResolve ? resolve(`${time}毫秒后我成功啦！！！`) : reject(`${time}毫秒后我失败啦！！！`)
    }, time)
  })
};
Promise.all([fn(2000, true), fn(3000), fn(1000)]).then(res => {
  console.log(res);
});
Promise {<pending>}[[Prototype]]: Promise[[PromiseState]]: "rejected"[[PromiseResult]]: "1000毫秒后我失败啦！！！"
6995334897065787422:1 Uncaught (in promise) 1000毫秒后我失败啦！！！
Promise.then (async)
(anonymous) @ VM84:8



function fn(time, isResolve) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      isResolve ? resolve(`${time}毫秒后我成功啦！！！`) : reject(`${time}毫秒后我失败啦！！！`)
    }, time)
  })
};

Promise.all([fn(2000, false), fn(3000), fn(1000,true)]).then(res => {
  console.log(res);
});


Promise {<pending>}[[Prototype]]: Promise[[PromiseState]]: "rejected"[[PromiseResult]]: "2000毫秒后我失败啦！！！"
6995334897065787422:1 Uncaught (in promise) 2000毫秒后我失败啦！！！
Promise.then (async)
(anonymous) @ VM188:9

所以Promise.all是输出截止到输出错误为止 有错误 后面的就不再输出了



# String.trimStart && String.trimEnd

```
咱们都知道JavaScript有个trim方法，可以清除字符串首尾的空格
const str = '    林三心    '
console.log(str.trim()) // '林三心'
复制代码
trimStart和trimEnd用来单独去除字符串的首和尾的空格
const str = '    林三心    '

// 去除首部空格
console.log(str.trimStart()) // '林三心   '
// 去除尾部空格
console.log(str.trimEnd()) // '   林三心'

```

# Object.fromEntries

```
前面ES8的Object.entries是把对象转成键值对数组，而Object.fromEntries则相反，是把键值对数组转为对象
const arr = [
  ['name', '林三心'],
  ['age', 22],
  ['gender', '男']
]

console.log(Object.fromEntries(arr)) // { name: '林三心', age: 22, gender: '男' }


还有一个用处，就是把Map转为对象
const map = new Map()
map.set('name', '林三心')
map.set('age', 22)
map.set('gender', '男')

console.log(map) // Map(3) { 'name' => '林三心', 'age' => 22, 'gender' => '男' }

const obj = Object.fromEntries(map)
console.log(obj) // { name: '林三心', age: 22, gender: '男' }

```

# 求幂运算符

```
以前求幂，我们需要这么写

const num = Math.pow(3, 2) // 9

ES7提供了求幂运算符：**

const num = 3 ** 2 // 9
```
# for await of

```
function fn (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`${time}毫秒后我成功啦！！！`)
    }, time)
  })
}

fn(3000).then(res => console.log(res))
fn(1000).then(res => console.log(res))
fn(2000).then(res => console.log(res))

如何输出这个结果
3000毫秒后我成功啦！！！
1000毫秒后我成功啦！！！
2000毫秒后我成功啦！！！


function fn (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`${time}毫秒后我成功啦！！！`)
    }, time)
  })
}

async function asyncFn () {
  const arr = [fn(3000), fn(1000), fn(1000), fn(2000), fn(500)]
  for await (let x of arr) {
    console.log(x)
  }
}

asyncFn()
3000毫秒后我成功啦！！！
1000毫秒后我成功啦！！！
1000毫秒后我成功啦！！！
2000毫秒后我成功啦！！！
500毫秒后我成功啦！！！

```
```
function fn (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`${time}毫秒后我成功啦！！！`)
    }, time)
  })
}
function async() { console.log('这是个同步任务')}
async function asyncFn () {
  const arr = [fn(3000), fn(1000),async(),fn(1000), fn(2000), async(),fn(500)]
  for await (let x of arr) {
    console.log(x)
  }
}

asyncFn();
这是个同步任务
这是个同步任务
3000毫秒后我成功啦！！！
1000毫秒后我成功啦！！！
undefined
1000毫秒后我成功啦！！！
2000毫秒后我成功啦！！！
undefined
500毫秒后我成功啦！！！
```
# Promise.finally

```
新增的Promise方法，无论失败或者成功状态，都会执行这个函数
// cheng
new Promise((resolve, reject) => {
  resolve('成功喽')
}).then(
  res => { console.log(res) },
  err => { console.log(err) }
).finally(() => { console.log('我是finally') })

new Promise((resolve, reject) => {
  reject('失败喽')
}).then(
  res => { console.log(res) },
  err => { console.log(err) }
).finally(() => { console.log('我是finally') })


```
# Array.flat

```
有一个二维数组，我想让他变成一维数组：
const arr = [1, 2, 3, [4, 5, 6]]

console.log(arr.flat()) // [ 1, 2, 3, 4, 5, 6 ]

还可以传参数，参数为降维的次数
const arr = [1, 2, 3, [4, 5, 6, [7, 8, 9]]]

console.log(arr.flat(2))
[
  1, 2, 3, 4, 5,
  6, 7, 8, 9
]

如果传的是一个无限大的数字，那么就实现了多维数组(无论几维)降为一维数组
const arr = [1, 2, 3, [4, 5, 6, [7, 8, 9, [10, 11, 12]]]]

console.log(arr.flat(Infinity))
[
   1,  2, 3, 4,  5,
   6,  7, 8, 9, 10,
   11, 12
]

```

# Array.flatMap

```

现在给你一个需求
let arr = ["科比 詹姆斯 安东尼", "利拉德 罗斯 麦科勒姆"];

将上面数组转为
[ '科比', '詹姆斯', '安东尼', '利拉德', '罗斯', '麦科勒姆' ]

第一时间想到 map + flat
console.log(arr.map(x => x.split(" ")).flat());
// [ '科比', '詹姆斯', '安东尼', '利拉德', '罗斯', '麦科勒姆' ]

flatMap 就是flat + map，一个方法顶两个
console.log(arr.flatMap(x => x.split(" ")));
// [ '科比', '詹姆斯', '安东尼', '利拉德', '罗斯', '麦科勒姆' ]
```
# BigInt

```
BigInt是ES10新加的一种JavaScript数据类型，用来表示表示大于 2^53 - 1 的整数，2^53 - 1是ES10之前，JavaScript所能表示最大的数字
const theBiggestInt = 9007199254740991n;

const alsoHuge = BigInt(9007199254740991);
// 9007199254740991n

const hugeString = BigInt("9007199254740991");
// 9007199254740991n

const hugeHex = BigInt("0x1fffffffffffff");
// 9007199254740991n

const hugeBin = BigInt("0b11111111111111111111111111111111111111111111111111111");
// 9007199254740991n

哦对了，既然是JavaScript新的数据类型，那他的typeof是啥？
const bigNum = BigInt(1728371927189372189739217)
console.log(typeof bigNum) // bigint

所以以后面试官问你JavaScript有多少种数据类型，别傻傻答6种了，要答8种，把ES6的Symbol和ES10的BigInt也加上去

```

# 数组的 indexOf 和 includes 方法的区别

```
const arr = [1, 2, NaN]

console.log(arr.indexOf(NaN)) // -1  indexOf找不到NaN
console.log(arr.includes(NaN)) // true includes能找到NaN

```


# Set

```
先说说Set的基本用法
// 可不传数组
const set1 = new Set()
set1.add(1)
set1.add(2)
console.log(set1) // Set(2) { 1, 2 }

// 也可传数组
const set2 = new Set([1, 2, 3])
// 增加元素 使用 add
set2.add(4)
set2.add('林三心')
console.log(set2) // Set(5) { 1, 2, 3, 4, '林三心' }
// 是否含有某个元素 使用 has
console.log(set2.has(2)) // true
// 查看长度 使用 size
console.log(set2.size) // 5
// 删除元素 使用 delete
set2.delete(2)
console.log(set2) // Set(4) { 1, 3, 4, '林三心' }

```
# Map

```
Map对比object最大的好处就是，key不受类型限制
// 定义map
const map1 = new Map()
// 新增键值对 使用 set(key, value)
map1.set(true, 1)
map1.set(1, 2)
map1.set('哈哈', '嘻嘻嘻')
console.log(map1) // Map(3) { true => 1, 1 => 2, '哈哈' => '嘻嘻嘻' }
// 判断map是否含有某个key 使用 has(key)
console.log(map1.has('哈哈')) // true
// 获取map中某个key对应的value 使用 get(key)
console.log(map1.get(true)) // 2
// 删除map中某个键值对 使用 delete(key)
map1.delete('哈哈')
console.log(map1) // Map(2) { true => 1, 1 => 2 }

// 定义map，也可传入键值对数组集合
const map2 = new Map([[true, 1], [1, 2], ['哈哈', '嘻嘻嘻']])
console.log(map2) // Map(3) { true => 1, 1 => 2, '哈哈' => '嘻嘻嘻' }

```

# for of 和 for in

## for...in 遍历key
数组和对象 不能是set、map

## for...of 遍历value
遍历可迭代对象，set、map、数组
```
for in ：遍历方法，可遍历对象和数组，得到的是key
for of ：遍历方法，只能遍历数组，不能遍历非iterable对象 遍历的是值

先看for in：
const obj = { name: '林三心', age: 22, gender: '男' }
const arr = [1, 2, 3, 4, 5]

for(let key in obj) {
  console.log(key)
}
name
age
gender

for(let index in arr) {
  console.log(index)
}
0 1 2 3 4

再看 for of：
for(let item of arr) {
  console.log(item)
}
1 2 3 4 5

const map2 = new Map([[true, 1], [1, 2], ['哈哈', '嘻嘻嘻']]);
for(let item of map2) {
  console.log(item)
};
// [true, 1] [1, 2] ['哈哈', '嘻嘻嘻']

const set2 = new Set([1, 2, 3, 'aaaa', 'bbbb']); 
for(let item of set2) {
  console.log(item)
};
// 1 2 3 aaaa bbbb
```
# WeakMap & Map 区别
传统的Object只能以字符串作为键名，这具有非常大的限制,于是有了map数据结构，它可以用任意数据类型作为键名，有get和set方法，用于取值和添加键值对

WeakMap结构与Map结构类似，也是用于生成键值对的集合。WeakMap与Map的区别有两点。首先，WeakMap只接受对象作为键名（null除外），不接受其他类型的值作为键名。 WeakMap 与 Map 在 API 上的区别主要是两个，一是没有遍历操作（即没有keys()、values()和entries()方法），也没有size属性。

# Set & WeakSet 区别
Set是ES6 提供的新的数据结构 。它类似于数组，但是成员的值都是唯一的，没有重复的值。有add和delete方法，用于添加和删除。还有size属性，用于获取长度

WeakSet 结构与 Set 类似，也是不重复的值的集合。但是，它与 Set 有两个区别。首先，WeakSet 的成员只能是对象，而不能是其他类型的值。其次，WeakSet 中的对象都是弱引用。

# 弱引用
WeakMap,WeakSet都是弱引用(具体是WeakMap中的key是弱引用)。

一般我们将数据存在堆当中，需要我么手动去把这些数据清除这些数据的引用。将它们设置为null,很容易造成内存泄漏。然而如果我们使用WeakMap或者WeakSet,WeakMap中的键和WeakSet一旦没有其他对象的引用时，他会消失，也就是会自动被垃圾回收自动回收。

# 函数的length
```
123['toString'].length + 123 = 124

function fn1 (name) {}

function fn2 (name = '林三心') {}

function fn3 (name, age = 22) {}

function fn4 (name, age = 22, gender) {}

function fn5(name = '林三心', age, gender) { }

console.log(fn1.length) // 1
console.log(fn2.length) // 0
console.log(fn3.length) // 1
console.log(fn4.length) // 1
console.log(fn5.length) // 0

function的length，就是第一个具有默认值之前的参数个数

剩余参数

在函数的形参中，还有剩余参数这个东西，那如果具有剩余参数，会是怎么算呢？
function fn1(name, ...args) {}

console.log(fn1.length) // 1
可以看出，剩余参数是不算进length的计算之中的

length 是函数对象的一个属性值，指该函数有多少个必须要传入的参数，即形参的个数。形参的数量不包括剩余参数个数，仅包括第一个具有默认值之前的参数个数
```
# a == 1 && a == 2 && a == 3 如何让这个表达式的结果是true

```
对象类型转换

当两个类型不同时进行==比较时，会将一个类型转为另一个类型，然后再进行比较。 比如Object类型与Number类型进行比较时，Object类型会转换为Number类型。 Object转换为Number时，会尝试调用Object.valueOf()和Object.toString()来获取对应的数字基本类型。

var a = {
    i: 1,
    toString: function () {
        return a.i++;
    }
}
console.log(a == 1 && a == 2 && a == 3) // true

数组类型转换

与上面这个类型转换一样，数组调用toString()会隐含调用Array.join()方法 而数组shift方法的用法：shift() 方法用于把数组的第一个元素从其中删除，并返回第一个元素的值。如果数组是空的，那么 shift() 方法将不进行任何操作，返回 undefined 值。请注意，该方法不创建新数组，而是直接修改原有的 数组。 所以我们可以看到 a == 1时会调用toString(),toString()调用join()，join()等于shift，则转换为Number类型后为1.

var a = [1, 2, 3];
a.join = a.shift;
console.log(a == 1 && a == 2 && a == 3); // true

defineProperty
使用一个defineProperty，让 a 的返回值为三个不同的值。
var val = 0;
Object.defineProperty(window, 'a', { // 这里要window，这样的话下面才能直接使用a变量去 ==
    get: function () {
        return ++val;
    }
});
console.log(a == 1 && a == 2 && a == 3) // true

```
# 将Map对象排序

```
const map = new Map()
map.set(2, '林二心')
map.set(1, '林一心')
map.set(5, '林五心')
map.set(4, '林四心')
map.set(3, '林三心')
console.log(map) // Map { 2 => '林二心', 1 => '林一心', 5 => '林五心', 4 => '林四心', 3 => '林三心' }
const arr = Array.from(map)
console.log(arr) /* [ [ 2, '林二心' ],
                      [ 1, '林一心' ],
                      [ 5, '林五心' ],
                      [ 4, '林四心' ],
                      [ 3, '林三心' ] ] */
arr.sort((a, b) => a[0] - b[0])
console.log(arr) /* [ [ 1, '林一心' ],
                      [ 2, '林二心' ],
                      [ 3, '林三心' ],
                      [ 4, '林四心' ],
                      [ 5, '林五心' ] ] */
const map2 = new Map(arr) // 成功转化
console.log(map2) // Map { 1 => '林一心', 2 => '林二心', 3 => '林三心', 4 => '林四心', 5 => '林五心' }

```
# 解构
[原文链接](https://juejin.cn/post/6844904119342202888)
[原文链接](https://juejin.cn/post/6844904119342202888)
[原文链接](https://juejin.cn/post/6994634734634696734)
## 默认解构
let [ a, b = 1 ] = [ '林三心' ]
console.log(a, b) // a = '林三心'  b = 1

let [ a, b = 1 ] = [ '林三心', undefined ]
console.log(a, b) // a = '林三心'  b = 1

let [ a, b = 1 ] = [ '林三心', '林三心' ]
console.log(a, b) // a = '林三心'  b = '林三心'

let [ a, b = 1 ] = [ '林三心', null ]
console.log(a, b) // a = '林三心'  b = null

当解构变量对应的数组元素是undefined且解构变量拥有默认值时，该变量等于默认值，如果对应的元素非undefined，则该变量等于对应的元素

## “模式匹配”赋值

这属于“模式匹配”，只要等号两边的模式相同，左边的变量就会被赋予对应的值。
let [num_s,nums,num_e] = [1,[2,3,4],5];
console.log(num_s) // logs 1
console.log(nums) // logs [2,3,4]
console.log(num_e) // logs 5

## 用逗号跳过元素
let [num1,,,num4] = [1,2,3,4];
console.log(num1) // logs 1
console.log(num4) // logs 4

let [,num2,,num4] = [1,2,3,4];
console.log(num2) // logs 2
console.log(num4) // logs 4

查看变量赋值左侧的数组。注意这里不是只有一个逗号，而是三个。逗号分隔符用于跳过数组中的值。所以如果你想要跳过数组中的一个项，只要用逗号就可以了。

## 数组中的其余部分的赋值
如果我们想将数组中的一些元素赋值给变量，而将数组中的其余元素存为一个数组赋值给指定的变量怎么办？在这种情况下，我们可以这样做：
let [num1,...nums] = [1,2,3,4];
console.log(num1) // logs 1
console.log(nums) // logs [2,3,4]
应用这种方式，你可以轻松的把剩余的元素赋值给一个指定的变量。

## 解构失败，赋值undefined
let [num1] = [];
let [num2, num3] = [1];
console.log(num1) // logs undefined
console.log(num3) // logs undefined
代码中的变量num1与变量num3 按照模式匹配原则，并没有对应的值与之匹配，故而返回undefined。而变量num2  按照模式匹配原则，被赋值为2。

## 函数的解构赋值
解构赋值还可以从函数返回的数组中提取数据。假设我们有一个返回数组的函数，如下例所示：
function getLists() {
    let lists = [1,2,3,4,5]
    return lists;
}
let [num1,...nums] = getLists();

console.log(num1); // logs 1
console.log(nums); // logs [2,3,4,5]
## 使用默认值
数组的解构赋值可以给变量设定默认值，以防万一从数组中提取的值是 undefined（防止解构失败的情况）
let [name = "暂无姓名",sex = "女"] = ["April"];

console.log(name); // "April"
console.log(sex); // "女"
代码中变量name 默认的值为 "暂无姓名" 但是按照左右模式匹配的原则,name 被赋值为 "April" ,因为变量sex并未匹配到值，所以它的值依旧是默认值"女"。

注意点1：ES6 内部使用严格相等运算符（===），判断一个位置是否有值。所以，只有当一个数组成员严格等于undefined，默认值才会生效。
let [num1 = 1] = [undefined];
console.log(num1) // logs 1

let [num2 = 2] = [null];
console.log(num2) // logs null
代码中，因为null不严格等于undefined，默认值就不会生效。故而输出了 null

注意点2：如果默认值是函数，这个函数就会非常的懒，即只有在用到的时候，才会执行函数。
 function getLists(){
    let lists = [1,2,3,4,5]
    return lists; 
 }
let [lists = getLists()] = [1];
console.log(lists) // logs 1
// 因为变量 lists 可以匹配到值，所以函数 getLists() 并不会执行。

 function getLists(){
    let lists = [1,2,3,4,5]
    return lists; 
 }
let [lists = getLists()] = [];
console.log(lists) // logs [1,2,3,4,5]
// 因为变量 lists 无法匹配到值，函数 getLists() 就会执行。故而返回数据 [1,2,3,4,5]

注意点3：默认值可以引用解构赋值的其他变量，但该变量必须已经声明。
let [x = 1, y = x] = [];     // logs x=1; y=1
let [x = 1, y = x] = [2];    // logs x=2; y=2
let [x = 1, y = x] = [1, 2]; // logs x=1; y=2
let [x = y, y = 1] = [];     //logs 这就要报错啦，因为x用y做默认值时，y还没有声明。

## 交换变量
let num1 = 1;
let num2 = 2;

[num1,num2] = [num2,num1];

console.log({num1}); // logs 2
console.log({num2}); // logs 1

## 对象的解构赋值
为什么要用对象的解构赋值呢？？
 let profiles = {
    name:'April',
    nickname:"二十七刻",
    sign:"不以物喜，不以己悲。"
 }
   
let name = profiles.name;
let nickname = profiles.nickname;
let sign = profiles.sign;

console.log({name}) // "April"
console.log({nickname})// "二十七刻"
console.log({sign}) // "不以物喜，不以己悲。"
假设我们要从对象profiles中获取数据并赋值给新变量。就得不断的重复着取值与赋值。代码冗长且不利于维护。利用对象的解构赋值，就不存在这一问题了。
## 同属性名赋值
对象的解构赋值变量必须与属性同名，才能取到正确的值。如下：
let profiles = {
     name:'April', 
     nickname:"二十七刻", 
     sign:"不以物喜，不以己悲。"
}
let {name,nickname,sign} = profiles;

console.log({name})    // logs "April"
console.log({nickname})// logs "二十七刻"
console.log({sign})    // logs "不以物喜，不以己悲。"
解构失败，赋值undefined
let profiles = {
    name:'April',
    nickname:"二十七刻",
    sign:"不以物喜，不以己悲。"
}
let {name,sex} = profiles;

console.log(name) // logs "April"
console.log(sex) // logs undefined
上面代码中，因为profiles对象没有 sex属性，所以变量sex取不到值，所以就赋值undefined。
在赋值之前申明变量
在对象的解构赋值中，变量可以在赋值之前申明。如下：
let profiles = {
    name:'April',
    nickname:"二十七刻",
    sign:"不以物喜，不以己悲。"
}
let name,nickname,sign;
{name,nickname,sign} = profiles;

console.log(name) // logs Error : "Unexpected token ="
嘿呀～报错了！为什么？？？
原因：因为忘记在{}外层写()了。
注意1 ：当使用没有声明的对象字面量解构赋值时，必须使用()的赋值语句。因为 JavaScript 引擎会将{name,nickname,sign}理解成一个代码块，而不是对象字面量。
注意2 ：使用此语法时，上一行代码一定要以;结束掉，否则的话会被当作函数，执行上一行的代码。
就是这个奇怪的语法 :({} = '');
正确的做法如下：
let profiles = {
    name:'April',
    nickname:"二十七刻",
    sign:"不以物喜，不以己悲。"
}
let name,nickname,sign;
({name,nickname,sign} = profiles);

console.log({name},{nickname},{sign})
// logs {name: "April"} {nickname: "二十七刻"} {sign: "不以物喜，不以己悲。"}
## 使用新的变量名
如果我们想用新的变量名来替代对象的属性名怎么办呢？代码如下：
let profiles = {
    name:"April",
    age:"27"
}
let {name:userName,age:userAge} = profiles;

console.log(userName) // logs "April"
console.log(userAge) // logs "27"
由此可知，对象的解构赋值其实就是let {name:name,age:age} = {name:"April",age:"27"}代码的简写。也就是说，对象的解构赋值的内部机制，是先找到同名属性，然后再赋给对应的变量。真正被赋值的是后者，而不是前者。
上面代码中，name是匹配的模式，userName才是变量。真正被赋值的是变量userName，而不是模式name。
## 使用默认值
对象的解构赋值可以给变量设定默认值，以防万一从对象中获取的值是 undefined（防止解构失败的情况）需要注意的是：默认值生效的条件是，对象的属性值严格等于undefined。
let staff = {name: "April", country: "China", job: "Developer"};
let {name = "暂无姓名", age = "暂无年龄"} = staff;

console.log({name}); // logs "April"
console.log({age}); // logs "暂无年龄"
代码中变量name的默认值为“暂无姓名”,但是对象staff中有属性为name的字段，所以就被赋值April,而对象staff中并没有age这个属性，所以被赋值为"暂无年龄"，取了它自己的默认值。
## 计算属性名称
计算属性名是另一个对象特性，也适用于对象的解构赋值。你可以通过一个表达式指定一个属性的名称，把它放在[]中，如下：
let staff = {name: "April", country: "China", job: "Developer"};
let prop = "name";
let {[prop]: name} = staff;

console.log({name}); // logs "April"
## 对象中的其余部分的赋值
解构运算也可以被应运到解构赋值当中，来获取那些还没有被赋值的键值对，这些键值对都被放在一个新的对象里。如下：
let staff = {name: "April", country: "China", job: "Developer",nickname:"二十七刻"};
let {country,...infos} = staff;

console.log(country) //logs "China"
console.log(infos) // logs {name: "April", job: "Developer", nickname: "二十七刻"}
## 嵌套对象的解构赋值
let staffs = {
    group1:[ { id:"007", name:"April"}]
}
let {group1,group1:[{id,name}]} = staffs;

console.log(group1) // logs [{ id:"007", name:"April"}]
console.log(id) // logs "007"
console.log(name) // logs "April"
注意，代码中group1是模式，不是变量。如果想把group1也作为变量赋值，就要先进行定义再去赋值。


# 输出练习1

```
var x = 1;
function f(x, y = function () { x = 3; console.log(x); }) {
  console.log(x)
  var x = 2
  y()
  console.log(x)
}
f()
console.log(x)
// //1、上面的代码输出的是什么？
// //2、如果把var x = 2注释掉，输出的又是什么？
// //3、如果把f函数第一个参数x改成xx，输出的又是什么？
// //4、如果把f函数第一个参数x设置了默认值为4，输出的又是什么？

var x = 1;
function f(x, y = function () { x = 3; console.log(x); }) {
  console.log(x) // 参数x没有默认值，所以：undefined
  var x = 2 
  y() // 改变的是参数x，且输出参数x，所以：3
  console.log(x) // 输出的是局部x，所以：2
}
f()
console.log(x) // 全局x无影响，所以：1

```
# 输出练习2
```
var x = 1;
function f(x, y = function () { x = 3; console.log(x); }) {
  console.log(x) // 参数没有默认值，所以：undefined
  // var x = 2
  y() // 改变参数x = 3，且输出参数x，所以：3
  console.log(x) // 实时参数x的值，所以：3
}
f()
console.log(x) // 全局x无影响，所以：1

```
# 输出练习3
```
var x = 1;
function f(xx, y = function () { x = 3; console.log(x); }) {
  console.log(x) // var变量提升但未赋值，所以：undefined
  var x = 2
  y() // x = 3改变的是全局x，且输出全局x，所以：3
  console.log(x) // x = 3改变的是全局x，与局部x无关，所以：2
}
f()
console.log(x) // 全局x被y函数改变了，所以：3

```
# 输出练习4
```
var x = 1;
function f(x = 4, y = function () { x = 3; console.log(x); }) {
  console.log(x) // 参数x默认值，所以：4
  var x = 2 
  y() // 改变的是参数x = 3，且输出参数x，所以：3
  console.log(x) // 输出的是局部x，所以：2
}
f()
console.log(x) // 全局x无影响，所以：1

```

```
1.["1", "2", "3"].map(parseInt) parseInt第一个参数是要转换的字符串 第二个参数是 2-36进制的数 map的三个参数分别是(element, index, array)

answer：[1,NaN,NaN]
```

```
1. [typeof null, null instanceof Object]     answer:["object", false]
```


```
3. [ [3,2,1].reduce(Math.pow), [].reduce(Math.pow) ]  
   answer:an error    
   reduce on an empty array without an initial value throws TypeError
```


```
4. var val = 'smtg'; console.log('Value is ' + (val === 'smtg') ? 'Something' : 'Nothing’);  
   answer:Something
```


```
5. var name = 'World!'; (function () { if (typeof name === 'undefined') { var name = 'Jack'; console.log('Goodbye ' + name); } else { console.log('Hello ' + name); } })();  
   answer: Goodbye Jack
```


```
6. 
var END = Math.pow(2, 53);
var START = END - 100;
var count = 0;
for (var i = START; i <= END; i++) {
    count++;
}
console.log(count);

answer:Math.pow(base, exponent)  js的最大存储2^53
```


```
7. var ary = [0,1,2]; ary[10] = 10; ary.filter(function(x) { return x === undefined;});
   answer:[]
filter 不能被含有undefined的数组使用
```


```
8. What is the result of this expression? (or multiple ones)

          
function showCase(value) {
    switch(value) {
    case 'A':
        console.log('Case A');
        break;
    case 'B':
        console.log('Case B');
        break;
    case undefined:
        console.log('undefined');
        break;
    default:
        console.log('Do not know!');
    }
}
1.showCase(new String('A'));//do not know
2.showCase2(String('A'));//case A

1.switch uses === internally and new String(x) !== x

2.String(x) does not create an object but does return a string, i.e. typeof String(1) === "string"

```

```
9.What is the result of this expression? (or multiple ones)

          
function isOdd(num) {
    return num % 2 == 1;
}
function isEven(num) {
    return num % 2 == 0;
}
function isSane(num) {
    return isEven(num) || isOdd(num);
}
var values = [7, 4, '13', -9, Infinity];
values.map(isSane);

Infinity % 2 gives NaN, -9 % 2 gives -1 (模运算符保留符号 所以和0比较是合理的)
```

```
parseInt(3, 8)//3
parseInt(3, 2)//NaN
3在基数是2的情况下不存在
parseInt(3, 0)//将0视为10 所以是3
```

```
Array.isArray( Array.prototype )
//true
```

```
[]==[] //false
```

```
'5' + 3 // "53"
'5' - 3 // 2
```

```
正则匹配

this.testResult = res.data.replace(new RegExp(',', 'g'), ',  \n  ')
this.testResult = this.testResult.replace(new RegExp('\\{', 'g'), '\{\n  ')
this.testResult = this.testResult.replace(new RegExp('\\[', 'g'), '\[\n  ')
this.testResult = this.testResult.replace(new RegExp('\\}', 'g'), '\n  }')
this.testResult = this.testResult.replace(new RegExp('\\]', 'g'), '\n]')
        

```


```
var ary = Array(3);
ary[0]=2
ary.map(function(elem) { return '1'; });

//["1", empty × 2] 因为map只能被不是undefined的数据调用

```

```
const res1=3 % 2; console.log(res1);
//取余数
```

```
function sidEffecting(ary) {
  ary[0] = ary[2];
}
function bar(a,b,c) {
  c = 10
  sidEffecting(arguments);
  return a + b + c;
}
bar(1,1,1)

结果21

更改局部变量也会更改值
```

```
var x = [].reverse;
x();
[] .reverse将返回此值，并且在没有显式接收者对象的情况下调用时，它将默认为默认的此AKA窗口
```

```
Number.MIN_VALUE > 0 //true
Number.MIN_VALUE是大于零的最小值，-Number.MAX_VALUE可为您提供对诸如最大负数之类的引用。
```

```
2 == [[[2]]]
两个对象都转换为字符串，并且在两种情况下，结果字符串均为“ 2”
```

```
[1 < 2 < 3, 3 < 2 < 1]
//[true,true]
```


```
3.toString() //error
3..toString() //"3"
3...toString() //error
```


```
var a = /123/,
    b = /123/;
a == b
a === b
//false, false
符合规范程序中的两个正则表达式文字求值为即使两个文字的内容相同，它们也永远不会以===相互比较的正则表达式对象。
```

```
var a = {}, b = Object.prototype;
[a.prototype === b, Object.getPrototypeOf(a) === b]
//[false, true]

函数具有原型属性，但其他对象则没有，因此a.prototype是未定义的。
每个对象都具有可通过Object.getPrototypeOf访问的内部属性。
```

```
function f() {}
var a = f.prototype, b = Object.getPrototypeOf(f);
a === b 
//false

f.prototype是将成为使用新f创建的任何对象的父对象的对象，而Object.getPrototypeOf返回继承层次结构中的父对象。
```

```
function foo() { }
var oldName = foo.name;
foo.name = "bar";
[oldName, foo.name] 
//["foo", "foo"]
name is a read only property
```

```
"1 2 3".replace(/\d/g, parseInt)
//"1 NaN 3"

```

```
([]+[]).length
//0
```

```
typeof [{x:1}] // 'object'
typeof NaN //"number"
typeof 能判断Symbol undefined 类型 不能判断数组类型
```

```
关于Symbol
Symbol()函数会返回symbol类型的值，该类型具有静态属性和静态方法。它的静态属性会暴露几个内建的成员对象；它的静态方法会暴露全局的symbol注册，且类似于内建对象类，但作为构造函数来说它并不完整，因为它不支持语法："new Symbol()"。

每个从Symbol()返回的symbol值都是唯一的。一个symbol值能作为对象属性的标识符；这是该数据类型仅有的目的
const symbol1 = Symbol();
const symbol2 = Symbol(42);
const symbol3 = Symbol('foo');

console.log(typeof symbol1);
// expected output: "symbol"

console.log(symbol2 === 42);
// expected output: false

console.log(symbol3.toString());
// expected output: "Symbol(foo)"

console.log(Symbol('foo') === Symbol('foo'));
// expected output: false

Symbol("foo") 不会强制将字符串 “foo” 转换成symbol类型。它每次都会创建一个新的 symbol类型：

Symbol("foo") === Symbol("foo"); // false
Copy to Clipboard
下面带有 new 运算符的语法将抛出 TypeError 错误：

var sym = new Symbol(); // TypeError

全局共享的 Symbol
上面使用Symbol() 函数的语法，不会在你的整个代码库中创建一个可用的全局的symbol类型。 要创建跨文件可用的symbol，甚至跨域（每个都有它自己的全局作用域） , 使用 Symbol.for() 方法和  Symbol.keyFor() 方法从全局的symbol注册表设置和取得symbol。
```

```
以下关于JavaScript中数据类型的说法错误的是\(\)
A. 数据类型分为基本数据类型和引用数据类型
B. JavaScript一共有8种数据类型
C. Object是引用数据类型，且只存储于堆(heap)中
D. BigInt是可以表示任意精度整数的基本数据类型，存储于栈(stack)中
C错误
```

```
请选择结果为ture的表达式？
A. null instanceof Object //false
B. null === undefined //false 
C. null == undefined // true
D. NaN == NaN // false
```

```
A.Symbol.for('a') === Symbol.for('a') // true
B. Symbol('a') === Symbol('a') // false
C. NaN === NaN // false
D. {} === {} // false
```

```
根据如下变量，下列表达式中返回值为true的是
var a = 1;
var b = [];
var c = '';
var d = true;

A. (a || b) === true // false
B. (b && c) === true // false
C. (c && d) === true // false
D. (d || a) === true // false
```

```
console.log(undefined == 0); // false
console.log(undefined == false); // false
console.log(false == '');//true
console.log (typeof(null) === typeof(window)) // true
console.log ([1,2,3] === [1,2,3]) // false
Number('a') == Number('a') // false
![] == ''//true
Infinity + 1 !== Infinity // false
```

```
如何把 7.25 四舍五入为最接近的整数
A. Math.round(7.25)
B. Math.ceil(7.25)
C. round(7.25)
D. Math.rnd(7.25)
```

```
Math.round(7.25) //7
Math.ceil(7.25)   //8
```


```
下面哪个选项可以产生0\<=num\<=10的随机整数CD
A. Math.floor(Math.random()*6)
B. Math.floor(Math.random()*10)
C. Math.floor(Math.random()*11)
D. Math.ceil(Math.random()*10)
```

```
String对象的indexOf()和search()可以找到字符串的位置
```

```
下面分别使用 JSON.stringify 方法，返回值 res 分别是
const fn = function(){}
const res = JSON.stringify(fn)
const num = 123
const res = JSON.stringify(num)
const res = JSON.stringify(NaN)
const b = true
const res = JSON.stringify(b)
undefined、'123'、undefined,'true'
```

```
数组去重的几种方法
const newNums = nums.filter((n, i) => {
    return nums.indexOf(n) === i
})
const newNums = Array.from(new Set(nums))
const newNums = nums.reduce((acc, n, i) => {
    return [].concat(acc, nums.indexOf(n) === i ? n : []
)
})
```

```
javascript的全局函数
encodeURI parseFloat
```

```
1和2都会引起内存泄漏
// (1)
function getName() {
    name = 'javascript'
}
getName()

// (2)
const elements = {
    button: document.getElementById('button')
};
function removeButton() {
    document.body.removeChild(elements.button);
}
removeButton()

// (3)
let timer = setInterval(() => {
    const node = document.querySelector('#node') 
    if(node) {
        clearInterval(timer)
    }
}, 1000);
```

```
将A元素拖拽并放置到B元素中，B元素需要做哪项操作\(\)？ A
A. event.preventDefault()
B. event.prevent()
C. event.drag()
D. event.drop()
```

```
以下不支持冒泡的鼠标事件为\( \)？C
A. mouseover
B. click
C. mouseleave
D. mousemove

```

```
在javascript中，用于阻止默认事件的默认操作的方法是 C
A. stopDeafault()
B. stopPropagation()
C. preventDefault()
D. preventDefaultEven()

```

```
事件传播的三个阶段是什么 D
目标 -> 捕获 -> 冒泡
冒泡 -> 目标 -> 捕获
目标 -> 冒泡 -> 捕获
捕获 -> 目标 -> 冒泡

```

```
下列哪项不属于DOM查找节点的属性\(\)？D
A. parentObj.firstChild
B. parentObj.children
C. neborNode.previousSibling
D. neborNode.siblings
```

```
OM元素的以下属性改变会导致重排\(reflows\)的是C
outline
visiblity
font-size
background-color

```

```
使用方法\( \)可以获取到地理位置所在的经纬度？B
A. Geolocation.watchPosition()
B. Geolocation.getCurrentPosition()
C. Geolocation.getPosition()
D. Geolocation.Position()
```

```
关于将 Promise.all 和 Promise.race 传入空数组的两段代码的输出结果说法正确的是：
Promise.all([]).then((res) => {
    console.log('all');
});
Promise.race([]).then((res) => {
    console.log('race');
});
C. all 会被输出，而 race 不会被输出
```

```
关于ES6解构表达式,描述正确的是\(\) C
let [a,b, c,d, e] = "hello"; 

A. e = "hello";
B. 其它都为undefined
C. 当中 a = "h", b = "e";
D. 语法报错
```

```
下面可以声明数字的js代码是 ABD
A. const a = 0xa1
B. const a = 076
C. const a = 0b21
D. const a = 7e2
```

```
以下属于操作符 typeof 的返回值的是：1268
(1)function
(2) object
(3) null
(4) array
(5) NaN
(6) bigint
(7) regexp
(8) undefined

```

```
function Person() { } var person = new Person(); ACD

A. 每一个原型都有一个constructor属性指向关联的构造函数。
B. 每一个对象都有一个prototype属性。
C. Object.getPrototypeOf(person) === Person.prototype
D. person.constructor === Person

```

```
下列方法可用于阻止事件冒泡的有 ABD
A. event.cancelBubble = true;
B. event.stopPropagation();
C. event.preventDefault();
D. return false;
```

```
function showCase(value) {
    switch(value) {
    case 'A':
        console.log('Case A');
        break;
    case 'B':
        console.log('Case B');
        break;
    case undefined:
        console.log('Case undefined');
        break;
    default:
        console.log('Case default');
    }
}
showCase(new String('A'));
Case default
```

```
function showCase(value) {
    switch(value) {
    case 'A':
        console.log('Case A');
        break;
    case 'B':
        console.log('Case B');
        break;
    case undefined:
        console.log('Case undefined');
        break;
    default:
        console.log('Case default');
    }
}
showCase(String('A'));
Case A
```
