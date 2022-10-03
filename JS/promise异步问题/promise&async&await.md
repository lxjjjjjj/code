# Promise的出现为了解决什么问题
## 解决回调地狱问题
```
setTimeout(()=>{
    doSomething();
    setTimeout(){
        doSomething();
        setTimeout(){
            doSomething();
            setTimeout(){
                doSomething();
            },1000};
        },1000};
    },1000};
,1000);
```
## 解决信任问题
GitHub上或自己都会有对xhr进行封装，例如Ajax，这些封装的第三方库的回调是否真的可靠呢？对成功或失败等回调能保证只调用一次吗.回调过早（一般是异步被同步调用）, 回调过晚或没有回调.

Promise有这些特征：
1.只能决议一次，决议值只能有一个，决议之后无法改变。
2.任何then中的回调也只会被调用一次。
所以Promise的特征保证了Promise可以解决信任问题。
## 解决捕获错误能力

```
p.then(res => {
    console.log('这是resovle的回调.then方法', res);
    console.log(undefinedData) //未定义的变量
})
.catch(reason => {
    console.log('这是reject的回调.catch方法', reason);
})
```
# async/await 的 优点
async/await关键字让我们可以用一种更简洁的方式写出基于Promise的异步行为，而无需刻意地链式调用promise。更符合人类的思考方式，使用Promise时，需要写.then()等多个回调，去获取内部的数据，阅读起来多少还是有些不便，async/await书写顺序即是执行顺序，容易理解。Promise是根据函数式编程的范式，对异步过程进行了一层封装，async/await基于协程的机制，是对异步过程更精确的一种描述。

## AsyncFunction 构造函数
调用 AsyncFunction构造函数时可以省略 new，其效果是一样的。
```
let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
async function asyncExpression(){}
let asyncFn = new AsyncFunction()
console.log(asyncExpression instanceof AsyncFunction) // true
console.log(asyncFn instanceof AsyncFunction) // true
// 但不建议这样使用new这个实例，就像创建数组直接使用字面量一样。
// 因为函数表达式更高效，异步函数是与其他代码一起被解释器解析的，而使用new函数体是单独解析的。
```
## 语法

1、它与Generator函数很像，内部可以有多个await，执行到await表达式时会暂停阻塞整个async函数并等待await表达式后面的Promise异步结果，直到拿到Promise 返回的 resovle 结果后恢复async函数的执行。
2、await必须在async函数体内执行，不然会报语法错误。
3、由于await是同步执行，如果await后的异步任务报错，会导致后面代码无法执行，所以要用try/catch来捕获错误，可以让后续代码继续执行。
4、在 async函数中await在执行Promise异步任务时会阻塞async函数体内后面的代码，但 async函数调用并不会造成阻塞，它内部所有的阻塞都被封装在一个 Promise 对象中异步执行，这也正是 await 必须用在 async函数中的原因。
5、多个await且没有互相的依赖时，使用Promise.all请求可以同时请求，加快速度。

