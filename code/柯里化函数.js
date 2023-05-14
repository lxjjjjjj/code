// 预先处理的思想，利用闭包的机制
// 柯里化的定义：接收一部分参数，返回一个函数接收剩余参数，接收足够参数后，执行原函数。
// 函数柯里化的主要作用和特点就是参数复用、提前返回和延迟执行。

// 分批传入参数
// redux 源码的compose也是用了类似柯里化的操作
const curry = (fn, arr = []) => {// arr就是我们要收集每次调用时传入的参数
  let len = fn.length; // 函数的长度，就是参数的个数

  return function(...args) {
    let newArgs = [...arr, ...args] // 收集每次传入的参数

    // 如果传入的参数个数等于我们指定的函数参数个数，就执行指定的真正函数
    if(newArgs.length === len) {
      return fn(...newArgs)
    } else {
      // 递归收集参数
      return curry(fn, newArgs)
    }
  }
}

function curry1(fn, ...args1) {
  const len = fn.length;

  return function (...args2) {
    const newArr = [...args1, ...args2]

    if (newArr.length >= len) {
      return fn(...newArr)
    } else {
      return curry1(fn, ...newArr)
    }
  }
}

function addNum(a,b,c,d) {
  return a + b + c + d
}

const res = curry1(addNum)(1)(2)(3,4)
console.log('res', res)