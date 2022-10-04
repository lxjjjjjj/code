# generator函数特点

* 函数体内部使用yield语句，定义不同的内部状态（yield在英语里的意思就是“产出”）
* generate函数调用()并不会执行generate函数，返回的也不是函数运行结果，而是一个指向内部状态的指针对象，也就是迭代器对象（Iterator Object）
* 调用g().next分段执行函数，切换yield状态结果
* generate函数.next()返回一个非常非常简单的对象{value: "a", done: false}，'a'就是g函数执行到第一个yield语句之后得到的值，false表示g函数还没有执行完，只是在这暂停。当done是true的时候函数执行完毕
* 函数执行完毕之后，即使gen.next()执行，函数结果返回{ value:undefined, done: true }

## 有return 语句的执行结果
```
function* g() {
    yield 'a';
    yield 'b';
    yield 'c';
    return 'ending';
};
var gen = g();
gen.next(); 
{value: 'a', done: false}
gen.next(); 
{value: 'b', done: false}
gen.next(); 
{value: 'c', done: false}
gen.next(); 
{value: 'ending', done: true}
```

## 无return 语句的执行结果
```
function* g() {
    yield 'a';
    yield 'b';
    yield 'c';
};
var gen = g();
gen.next(); 
{value: 'a', done: false}
gen.next(); 
{value: 'b', done: false}
gen.next(); 
{value: 'c', done: false}
gen.next(); 
{value: undefined, done: true}
```
## 如果g函数的return语句后面依然有yield呢
js的老规定：return语句标志着该函数所有有效语句结束，return下方还有多少语句都是无效，白写。

## 如果g函数没有yield和return语句呢？

第一次调用next就返回{value: undefined, done: true}，之后也是{value: undefined, done: true}。

## 如果只有return语句呢？

第一次调用就返回{value: xxx, done: true}，其中xxx是return语句的返回值。之后永远是{value: undefined, done: true}。

## 两个迭代器之间不会相互影响，作用域独立
```
function* g() {
    var o = 1;
    yield o++;
    yield o++;
    yield o++;

}
var gen = g();

console.log(gen.next()); // 1

var xxx = g();

console.log(gen.next()); // 2
console.log(xxx.next()); // 1
console.log(gen.next()); // 3
```
## next方法

next方法可以有参数

一句话说，next方法参数的作用，是为上一个yield语句赋值。由于yield永远返回undefined，这时候，如果有了next方法的参数，yield就被赋了值，比如下例，原本a变量的值是0，但是有了next的参数，a变量现在等于next的参数，也就是11。

next方法的参数每次覆盖的一定是undefined。next在没有参数的时候，函数体里面写let xx = yield oo;是没意义的，因为xx一定是undefined。
```
function* g() {
    var o = 1;
    var a = yield o++;
    console.log('a = ' + a);
    var b = yield o++;
}
var gen = g();

console.log(gen.next());
console.log('------');
console.log(gen.next(11));

// {value: 1, done: false}
// ------
// a = 11
// {value: 2, done: false}
```
首先说，console.log(gen.next());的作用就是输出了{value: 1, done: false}，注意var a = yield o++;，由于赋值运算是先计算等号右边，然后赋值给左边，所以目前阶段，只运算了yield o++，并没有赋值。

然后说，console.log(gen.next(11));的作用，首先是执行gen.next(11)，得到什么？首先：把第一个yield o++重置为11，然后，赋值给a，再然后，console.log('a = ' + a);，打印a = 11，继续然后，yield o++，得到2，最后打印出来。

从这我们看出了端倪：带参数跟不带参数的区别是，带参数的情况，首先第一步就是将上一个yield语句重置为参数值，然后再照常执行剩下的语句。总之，区别就是先有一步先重置值，接下来其他全都一样。

这个功能有很重要的语法意义，通过next方法的参数，就有办法在Generator函数开始运行之后，继续向函数体内部注入值。也就是说，可以在Generator函数运行的不同阶段，从外部向内部注入不同的值，从而调整函数行为。

提问：第一个.next()可以有参数么？
答：设这样的参数没任何意义，因为第一个.next()的前面没有yield语句。

# 总结generator函数特点

1、分段执行，可以暂停
2、可以控制阶段和每个阶段的返回值
3、可以知道是否执行到结尾

# 总结yield函数特点

yield语句 迭代器对象的next方法的运行逻辑如下。

（1）遇到yield语句，就暂停执行后面的操作，并将紧跟在yield后面的那个表达式的值，作为返回的对象的value属性值。

（2）下一次调用next方法时，再继续往下执行，直到遇到下一个yield语句。

（3）如果没有再遇到新的yield语句，就一直运行到函数结束，直到return语句为止，并将return语句后面的表达式的值，作为返回的对象的value属性值。

（4）如果该函数没有return语句，则返回的对象的value属性值为undefined。

yield语句与return语句既有相似之处，也有区别。

相似之处在于，都能返回紧跟在语句后面的那个表达式的值。

区别在于每次遇到yield，函数暂停执行，下一次再从该位置继续向后执行，而return语句不具备位置记忆的功能。一个函数里面，只能执行一次（或者说一个）return语句，但是可以执行多次（或者说多个）yield语句。

# 总结next方法

可以给yield传参数

# 手写
```
class Context {
    constructor() {
        this.next = 0
        this.prev = 0
        this.done = false
    }
    stop() {
        this.done = true
    }
}
let foo = function () {
    var context = new Context() 新增代码
    return {
        next: function () {
            value = gen$(context);
            done = context.done
            return {
                value,
                done
            }
        }
    }
}

参数就会作为Context的参数。将传入的参数保存到context中。

let foo = function () {
    var context = new Context(222) //修改代码
    return {
        next: function () {
            value = gen$(context);
            done = context.done
            return {
                value,
                done
            }
        }
    }
}
然后在gen$()执行的时候再赋值给变量

function gen$(context) {
    var xxx；
    while (1) {
        switch (context.prev = context.next) {
            case 0:
                context.next = 2;
                return 'result1';

            case 2:
                xxx = context._send 新增代码
                context.next = 4;
                return 'result2';

            case 4:
                context.next = 6;
                return 'result3';

            case 6:
                context.stop();
                return undefined
        }
    }
}
```