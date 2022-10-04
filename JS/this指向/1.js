const o1 = {
    text: 'o1',
    fn: function() {
        return this.text
    }
}
const o2 = {
    text: 'o2',
    fn: function() {
        return o1.fn()
    }
}
const o3 = {
    text: 'o3',
    fn: function() {
        var fn = o1.fn
        return fn()
    }
}

console.log(o1.fn())
console.log(o2.fn())
console.log(o3.fn())
// 答案是：o1、o1、undefined

// 第一个 console 最简单，o1 没有问题。难点在第二个和第三个上面，关键还是看调用 this 的那个函数。
// 第二个 console 的 o2.fn()，最终还是调用 o1.fn()，因此答案仍然是 o1。
// 最后一个，在进行 var fn = o1.fn 赋值之后，是“裸奔”调用，因此这里的 this 指向 window，答案当然是 undefined。

// 如果是在面试中，我作为面试官，就会追问：如果我们需要让：

// console.log(o2.fn())
// 输出 o2，该怎么做？

// 一般开发者可能会想到使用bind/call/apply来对this的指向进行干预，这确实是一种思路。但是我接着问，如果不能使用bind/call/apply，有别的方法吗？

const o1 = {
    text: 'o1',
    fn: function() {
        return this.text
    }
}
const o2 = {
    text: 'o2',
    fn: o1.fn
}

console.log(o2.fn())
// 还是应用那个重要的结论：this 指向最后调用它的对象，在 fn 执行时，挂到 o2 对象上即可，我们提前进行了类似赋值的操作。