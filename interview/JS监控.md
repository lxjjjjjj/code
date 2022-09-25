# JS的几种错误类型

## 基类 Error
Error是基类型,其他内置错误类型都是继承该类型,因此所有内置错误类型都是共享相同的属性(所有错误对象上的方法都是这个默认类型定义的方法)。浏览器很少会抛出Error类型的错误,该类型主要用于抛出自定义错误。

```
new Error([message[, fileName[,lineNumber]]])

message 可选。人类可阅读的错误描述信息。
fileName 可选。被创建的Error对象的fileName属性值。默认是调用Error构造器代码所在的文件 的名字。
lineNumber 可选。被创建的Error对象的lineNumber属性值。默认是调用Error构造器代码所在的文件的行号。
当像函数一样使用 Error 时 -- 如果没有 new，它将返回一个 Error 对象。所以， 仅仅调用 Error 产生的结果与通过new 关键字构造 Error 对象生成的结果相同。 

// this:
const x = Error('I was created using a function call!');
// has the same functionality as this:
const y = new Error('I was constructed via the "new" keyword!');
```
Error实例上有哪些属性
```
Error.prototype 可以添加自定义属性和方法
Error.prototype.columnNumber 引发此错误的文件行中的列号
Error.prototype.fileName 引发此错误的文件的路径
Error.prototype.lineNumber 抛出错误的代码在其源文件中所在的行号
Error.prototype.message 错误描述 在实例化的时候可以被重写
Error.prototype.name 表示error类型的名称 初始值为Error
Error.prototype.stack 错误堆栈
```
## ReferenceError（引用错误）
表示引用错误，使用了未声明的变量。错误之前的代码会执行，之后代码不会执行

```
1.console.log(aaaa) //使用一个没有定义的变量
2.Math.random()=1 //把变量赋值给一个无法赋值的xx
```
捕获一个错误

```
try {
  var a = undefinedVariable;
} catch (e) {
  console.log(e instanceof ReferenceError); // true
  console.log(e.message);                   // "undefinedVariable is not defined"
  console.log(e.name);                      // "ReferenceError"
  console.log(e.fileName);                  // "Scratchpad/1"
  console.log(e.lineNumber);                // 2
  console.log(e.columnNumber);              // 6
  console.log(e.stack);                     // "@Scratchpad/2:2:7\n"
}
```
新建错误

```
try {
  throw new ReferenceError('Hello', 'aaa.js', 10);
} catch (e) {
  console.log(e instanceof ReferenceError); // true
  console.log(e.message);                   // "Hello"
  console.log(e.name);                      // "ReferenceError"
  console.log(e.fileName);                  // "aaa.js"
  console.log(e.lineNumber);                // 10
  console.log(e.columnNumber);              // 0
  console.log(e.stack);                     // "@Scratchpad/2:2:9\n"
}
```

## RangeError

```
var arr=new Array(-1)
//Uncaught RangeError: Invalid array length at <anonymous>:1:11
function a(number){
    if(number>0){
        return a(number)
    }
}
a(100) //Maximum call stack size exceeded
var a=new Array(Number.MAX_SAFE_INTEGER)
```
## TypeError
TypeError在JavaScript中很常见,主要发生变量在运行时的访问不是预期类型,或者访问不存在的方法时,尤其是在使用类型特定的操作而变量类型不对时。在给函数传参前没有验证的情况下,错误发生较多。比如a变量是个基本类型，却被当做函数调用
```

//Uncaught TypeError: a is not a function at <anonymous>:3:1
1.var a=100 a() 
2.var a={} a.foo()
```
## SyntaxError
当我们输入 JS 引擎不能理解的代码时，就会发生这个错误。JS引擎在解析期间会捕获了这个错误，而不是运行时。或者给eval()传入的字符串包含JavaScript语法错误时，也会抛出此异常

```
//Uncaught SyntaxError: Unexpected number
1.var aaa=function(){
    var p 1=199
}
aaa()
2.eval('hoo bar')
```
## URIError

```
URIError只会在使用encodeURL()或decodeURL()时，传入了格式错误的URL时发生,但非常罕见,因为上面两个函数非常稳健.
比如对空格进行编码，然后把编码的结果改为非法的结果，对该结果再进行解码，就会抛出异常

encodeURI(' ') '%20' decodeURI('%')
```

## EvalError
会在使用eval()函数发生异常时抛出。

# try catch 配合 await 捕获 Promise错误

# 无法捕获到的错误

## 无法捕获到的异步错误
```
new Promise(() => {
  setTimeout(() => {
    throw new Error('err') // uncaught
  }, 0)
}).catch((e) => {
  console.log(e)
})

这个情况要用 reject 方式抛出异常才能被捕获：

new Promise((res, rej) => {
  setTimeout(() => {
    rej('err') // caught
  }, 0)
}).catch((e) => {
  console.log(e)
})
```
```
另一种情况是，这个 await 没有被执行到：

const wait = (ms) => new Promise((res) => setTimeout(res, ms))

;(async () => {
  try {
    const p1 = wait(3000).then(() => {
      throw new Error('err')
    }) // uncaught
    await wait(2000).then(() => {
      throw new Error('err2')
    }) // caught
    await p1
  } catch (e) {
    console.log(e)
  }
})()

```
p1 等待 3s 后抛出异常，但因为 2s 后抛出了 err2 异常，中断了代码执行，所以 await p1 不会被执行到，导致这个异常不会被 catch 住。 而且有意思的是，如果换一个场景，提前执行了 p1，等 1s 后再 await p1，那异常就从无法捕获变成可以捕获了，这样浏览器会怎么处理？

```
const wait = (ms) => new Promise((res) => setTimeout(res, ms))

;(async () => {
  try {
    const p1 = wait(1000).then(() => {
      throw new Error('err')
    })
    await wait(2000)
    await p1
  } catch (e) {
    console.log(e)
  }
})()
```
结论是浏览器 1s 后会抛出一个未捕获异常，但再过 1s 这个未捕获异常就消失了，变成了捕获的异常。
这个行为很奇怪，当程序复杂时很难排查，因为并行的 Promise 建议用 Promise.all 处理：
```
await Promise.all([
  wait(1000).then(() => {
    throw new Error('err')
  }), // p1
  wait(2000),
])
```
另外 Promise 的错误会随着 Promise 链传递，因此建议把 Promise 内多次异步行为改写为多条链的模式，在最后 catch 住错误。
还是之前的例子，Promise 无法捕获内部的异步错误：
```
new Promise((res, rej) => {
  setTimeout(() => {
    throw Error('err')
  }, 1000) // 1
}).catch((error) => {
  console.log(error)
})
但如果写成 Promise Chain，就可以捕获了：
new Promise((res, rej) => {
  setTimeout(res, 1000) // 1
})
  .then((res, rej) => {
    throw Error('err')
  })
  .catch((error) => {
    console.log(error)
  })
```
原因是，用 Promise Chain 代替了内部多次异步嵌套，这样多个异步行为会被拆解为对应 Promise Chain 的同步行为，Promise 就可以捕获啦。

## DOM 事件监听内抛出的错误都无法被捕获

```
document.querySelector('button').addEventListener('click', async () => {
  throw new Error('err') // uncaught
})
同步也一样：
document.querySelector('button').addEventListener('click', () => {
  throw new Error('err') // uncaught
})
```
只能通过函数体内 try catch 来捕获。

## window.addEventListener('error') 

## window.addEventListener('unhandledrejection') 

可以监听所有同步、异步的运行时错误，但无法监听语法、接口、资源加载错误。
而 unhandledrejection 可以监听到 Promise 中抛出的，未被 .catch 捕获的错误。 

## React 的 Error Boundaries

## Vue 的 error handler
