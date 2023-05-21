// https://zhuanlan.zhihu.com/p/335508889
// 闭包 + 递归方式
// const compose = function(...funcs) {
//   let length = funcs.length
//   let count = length - 1
//   let result
//   return function f1 (...arg1) {
//     result = funcs[count].apply(this, arg1)
//     if (count <= 0) return result
//     count--
//     return f1.call(null, result)
//   }
// }

// const compose = function(...funcs) {
//   let currentFnIndex = funcs.length - 1
//   let result
//   return function fn(...args) {
//     result = funcs[currentFnIndex].apply(null, args)
//     if (currentFnIndex <= 0) return result
//     currentFnIndex--
//     return fn.call(null, result)
//   }
// }

// redux中compose的实现
// function compose(...funcs) {
//   if (funcs.length === 0) {
//       return arg => arg
//   }

//   if (funcs.length === 1) {
//       return funcs[0]
//   }
//   return funcs.reduce((a, b) => (...args) => a(b(...args)))
// }

function compose(...funcs) {
  if (funcs.length === 0) return (...args) => [...args]
  if (funcs.length === 1) return (...args) => funcs[0].apply(null, args)
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

// pipe
function pipe(...funcs) {
  if (funcs.length === 0) return (...args) => [...args]
  if (funcs.length === 1) return (...args) => funcs[0].apply(null, args)
  return funcs.reduce((a, b) => (...args) => b(a(...args)))
}

  /** 数字加一 */
function addOne (num) {
  return num + 1
}

/** 数字减去十 */
function subTen (num) {
  return num - 10
}

/** 数字乘以二 */
function double (num) {
  return num * 2
}

/** 数组除以三 */
function divThree (num) {
  return num / 3
}

// 组成新的函数s
const compose1 =  compose(divThree, addOne, subTen, double)
// 执行新的函数
console.log('compose1 result:', compose1(9))
// compose1 result: 3

