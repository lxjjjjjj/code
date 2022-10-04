function foo (a) {
    console.log(this.a)
}

const obj1 = {
    a: 1,
    foo: foo
}

const obj2 = {
    a: 2,
    foo: foo
}

obj1.foo.call(obj2)
obj2.foo.call(obj1)

// 输出分别为 2、1，也就是说 call、apply 的显式绑定一般来说优先级比隐式绑定更高。

function foo (a) {
    this.a = a
}

const obj1 = {}

var bar = foo.bind(obj1)
bar(2)
console.log(obj1.a)
// 上述代码通过 bind，将 bar 函数中的 this 绑定为 obj1 对象。执行 bar(2) 后，obj1.a 值为 2。即经过 bar(2) 执行后，obj1 对象为：{a: 2}。

// 当再使用 bar 作为构造函数时：

var baz = new bar(3)
console.log(baz.a)
// 将会输出 3。我们看 bar 函数本身是通过 bind 方法构造的函数，其内部已经对将 this 绑定为 obj1，它再作为构造函数，通过 new 调用时，返回的实例已经与 obj1 解绑。也就是说：

// new 绑定修改了 bind 绑定中的 this，因此 new 绑定的优先级比显式 bind 绑定更高。

function foo() {
    return a => {
        console.log(this.a)
    };
}

const obj1 = {
    a: 2
}

const obj2 = {
    a: 3
}

const bar = foo.call(obj1)
console.log(bar.call(obj2))
// 将会输出 2。由于 foo() 的 this 绑定到 obj1，bar（引用箭头函数）的 this 也会绑定到 obj1，箭头函数的绑定无法被修改。

var a = 123
const foo = () => a => {
    console.log(this.a)
}

const obj1 = {
    a: 2
}

const obj2 = {
    a: 3
}

var bar = foo.call(obj1)
console.log(bar.call(obj2))
// 将会输出 123。因为foo是箭头函数，在一开始定义的时候this指向就已经确定了

const a = 123
const foo = () => a => {
    console.log(this.a)
}

const obj1 = {
    a: 2
}

const obj2 = {
    a: 3
}

var bar = foo.call(obj1)
console.log(bar.call(obj2))
// 答案将会输出为 undefined，原因是因为使用 const 声明的变量不会挂载到 window 全局对象当中。因此 this 指向 window 时，自然也找不到 a 变量了。关于 const 或者 let 等声明变量的方式不再本课的主题当中，我们后续也将专门进行介绍。