# JS整数是怎么表示的
JavaScript 内部，所有数字都是以64位浮点数形式储存，即使整数也是如此。所以，1与1.0是相同的，是同一个数。
```
typeof 1 // number
typeof 1.0 // number
1 === 1.0
```
## Number类型的表示范围 - 浮点数的结构
[图片链接](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a4c2e995a18c4fe4ad2594723c79a626~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

第一部分（蓝色）：用来存储符号位（sign），第1位：符号位，0表示正数，1表示负数
第二部分（绿色）：用来存储指数（exponent），第2位到第12位（共11位）：指数部分
第三部分（红色）：用来存储小数（fraction），第13位到第64位（共52位）：小数部分（即有效数字）

52位为什么可以表示53位小数
因为小数部分只需要表示尾数就可以，整数部分可定等于一
52位太多不好理解，假设我们以3位(bit)数

0.10 (二进制) 可以表示为 1.00 * 2^-1
0.01 (二进制) 可以表示为 1.00 * 2^-2

这样的话由于整数部分一定等于1，所以可以把整数部分省略。
也就是说3位数可以表示做小数表示的时候可以表示4位小数

为什么不是指数部分决定的
0.1123 * 2^1024

当然这里面有人会问为什么不是指数部分决定呢。上面这个数的范围是不是比我们的讨论的数据范围更大呢。

其实并不是这样，因为实用指数表示并不能表示连续的数字。所以这个方案不可取。

**整数的表示范围**
```
Math.pow(2,53)  - 1 // 最大 
Number.MAX_SAFE_INTEGER // 常数表示
- (Math.pow(2,53)  - 1) // 最大 
Number.MIN_SAFE_INTEGER // 常数表示
```
# 0.1 + 0.2 === 0.3
[原文链接](https://juejin.cn/post/7048554678858022925)

0.1 + 0.2 不等于0.3 ，因为浮点数表示小数的时候有精度损失。为什么浮点数无法精确表示小数。因为数字在计算机中是二进制存放的，所以如果要把二进制的数变成我们熟悉的十进制需要。十进制换算二进制叫做除二取余法。

二进制表示整数-----以5为例,余数连接起来就是5的二进制表示。
```
5 / 2 = 2 余  1
2 / 2 = 1 余  0
1 / 2 = 0 余  1
```
结论：整数只要有足够的的二进制位可以连续表示

二进制表示小数-----乘二取整法,首先我们用0.75举例
```
0.75 * 2 = 1.5 取整 1 剩下 0.5
0.5 * 2 = 1 取整  1 剩下 0 运算结束

是不是所有整数部分连接起来正好是0.75的二进制部分
```
(0.75).toString(2) ---- 0.11

但是悲催的0.1是如何用二进制表示的呢？
```
0.1 * 2 = 0.2 取整 0 剩下 0.2
0.2 * 2 = 0.4 取整 0 剩下 0.4
0.4 * 2 = 0.8 取整 0 剩下 0.8
0.8 * 2 = 1.6 取整 1 剩下 0.6
0.6 * 2 = 1.2 取整 1 剩下 0.2
0.2 * 2 = 0.4 取整 0 剩下 0.4
0.4 * 2 = 0.8 取整 0 剩下 0.8
0.8 * 2 = 1.6 取整 1 剩下 0.6
0.6 * 2 = 1.2 取整 1 剩下 0.2
.....
我去BaBQ了感觉算不完了

其实0.2同理的大家可以试试
(0.1).toString(2) '0.000110011001100.....'
所以在有限精度内是无法取到五分之一和十分之一的。所以有限的52个bit是无法表示0.1这种数字的唯一的方法就是截取。
```
初级：Number是浮点数，表示小数会有精度损失。
中级： 浮点数的表示规则
高级： 高精度运算、适合高精度的语言和解决方案
# BigInt 
是一种内置对象，它提供了一种方法来表示大于 2^53 - 1 的整数。这原本是 Javascript 中可以用 Number 表示的最大数字。BigInt 可以表示任意大的整数。可以用在一个整数字面量后面加 n 的方式定义一个 BigInt ，如：10n，或者调用函数 BigInt()（但不包含 new 运算符）并传递一个整数值或字符串值。
```
const theBiggestInt = 9007199254740991n;

const alsoHuge = BigInt(9007199254740991);
// ↪ 9007199254740991n

const hugeString = BigInt("9007199254740991");
// ↪ 9007199254740991n

const hugeHex = BigInt("0x1fffffffffffff");
// ↪ 9007199254740991n

const hugeBin = BigInt("0b11111111111111111111111111111111111111111111111111111");
// ↪ 9007199254740991n   Math.pow(2,53) ---> 9007199254740992
```
### 和Number不同点

不能用于 Math 对象中的方法；不能和任何 Number 实例混合运算，两者必须转换成同一种类型。在两种类型来回转换时要小心，因为 BigInt 变量在转换成 Number 变量时可能会丢失精度。

使用 typeof 测试时， BigInt 对象返回 "bigint" ：
```
typeof 1n === 'bigint'; // true
typeof BigInt('1') === 'bigint'; // true
```

使用 Object 包装后， BigInt 被认为是一个普通 "object" ：
```
typeof Object(1n) === 'object'; // true
```
### 运算
以下操作符可以和 BigInt 一起使用： +、*、-、**、%。除 >>> （无符号右移）之外的 位操作 (en-US) 也可以支持。因为 BigInt 都是有符号的， >>> （无符号右移）不能用于 BigInt。为了兼容 asm.js，BigInt 不支持单目 (+) 运算符。
```
const previousMaxSafe = BigInt(Number.MAX_SAFE_INTEGER);
// ↪ 9007199254740991n

const maxPlusOne = previousMaxSafe + 1n;
// ↪ 9007199254740992n

const theFuture = previousMaxSafe + 2n;
// ↪ 9007199254740993n, this works now!

const multi = previousMaxSafe * 2n;
// ↪ 18014398509481982n

const subtr = multi – 10n;
// ↪ 18014398509481972n

const mod = multi % 10n;
// ↪ 2n

const bigN = 2n ** 54n;
// ↪ 18014398509481984n

bigN * -1n
// ↪ –18014398509481984n

const expected = 4n / 2n;
// ↪ 2n

const rounded = 5n / 2n;
// ↪ 2n, not 2.5n

```
BigInt 和 Number 不是严格相等的，但是宽松相等的。
```
0n === 0
// ↪ false

0n == 0
// ↪ true

Number 和 BigInt 可以进行比较。

1n < 2
// ↪ true

2n > 1
// ↪ true

2 > 2
// ↪ false

2n > 2
// ↪ false

2n >= 2
// ↪ true
```
两者也可以混在一个数组内并排序。
```
const mixed = [4n, 6, -12n, 10, 4, 0, 0n];
// ↪  [4n, 6, -12n, 10, 4, 0, 0n]

mixed.sort();
// ↪ [-12n, 0, 0n, 10, 4n, 4, 6]
```
注意被 Object 包装的 BigInt 使用 object 的比较规则进行比较，只用同一个对象在比较时才会相等。
```
0n === Object(0n); // false
Object(0n) === Object(0n); // false

const o = Object(0n);
o === o // true
```
# 数字超过最大限制如何处理
[原文链接](https://juejin.cn/post/7048998409067298830)
```
//除法函数，用来得到精确的除法结果  
//说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。  
//调用：accDiv(arg1,arg2)  
//返回值：arg1除以arg2的精确结果 
   
function accDiv(arg1,arg2){  
var t1=0,t2=0,r1,r2;  
try{t1=arg1.toString().split(".")[1].length}catch(e){}  
try{t2=arg2.toString().split(".")[1].length}catch(e){}  
with(Math){  
r1=Number(arg1.toString().replace(".",""))  
r2=Number(arg2.toString().replace(".",""))  
return (r1/r2)*pow(10,t2-t1);  
}  
}  
//给Number类型增加一个div方法，调用起来更加方便。  
Number.prototype.div = function (arg){  
return accDiv(this, arg);  
}  
   
   
//乘法函数，用来得到精确的乘法结果  
//说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。  
//调用：accMul(arg1,arg2)  
//返回值：arg1乘以arg2的精确结果  
   
function accMul(arg1,arg2)  
{  
var m=0,s1=arg1.toString(),s2=arg2.toString();  
try{m+=s1.split(".")[1].length}catch(e){}  
try{m+=s2.split(".")[1].length}catch(e){}  
return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)  
}  
//给Number类型增加一个mul方法，调用起来更加方便。  
Number.prototype.mul = function (arg){  
return accMul(arg, this);  
}  
   
   
//加法函数，用来得到精确的加法结果  
//说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。  
//调用：accAdd(arg1,arg2)  
//返回值：arg1加上arg2的精确结果  
   
function accAdd(arg1,arg2){  
var r1,r2,m;  
try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0}  
try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0}  
m=Math.pow(10,Math.max(r1,r2))  
return (arg1*m+arg2*m)/m  
}  
//给Number类型增加一个add方法，调用起来更加方便。  
Number.prototype.add = function (arg){  
return accAdd(arg,this);  
} 
   
//在你要用的地方包含这些函数，然后调用它来计算就可以了。  
//比如你要计算：7*0.8 ，则改成 (7).mul(8)  
//其它运算类似，就可以得到比较精确的结果。 
   
   
   
//减法函数 
function Subtr(arg1,arg2){ 
     var r1,r2,m,n; 
     try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0} 
     try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0} 
     m=Math.pow(10,Math.max(r1,r2)); 
     //last modify by deeka 
     //动态控制精度长度 
     n=(r1>=r2)?r1:r2; 
     return ((arg1*m-arg2*m)/m).toFixed(n); 
} 
```