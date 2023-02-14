// https://juejin.cn/post/6844903669389885453#heading-4
// 防抖是在一段时间内 只执行最后一次，如果这段时间内多次触发，定时器重新计算时间

// 防抖：是指在事件被触发 n 秒后再执行回调，如果在这 n 秒内事件又被触发，则重新计时。这可以用在键盘输入上，等用户输入完成时自动进行字符串校验等
// 节流：是指规定一个单位时间，在这个单位时间内，只能有一次触发事件的回调函数执行，如果在同一个单位时间内某事件被触发多次，只有一次能生效。节流可以使用在 scroll 函数的事件监听上，通过事件节流来降低事件调用的频率。

function debounce (func, wait = 50) {
    let timer = 0
     return function (...args) {
         if(timer) clearTimeout(timer)
         timer = setTimeout(()=>{
            func.apply(this, args)
            clearTimeout(timer)
         }, wait)
     }
 }

//  debounce函数封装后，返回内部函数
//  每一次事件被触发，都会清除当前的timer然后重新设置超时并调用。这会导致每一次高频事件都会取消前一次的超时调用，导致事件处理程序不能被触发
//  只有当高频事件停止，最后一次事件触发的超时调用才能在delay时间后执行
 
   
let biu = function () {
    console.log('biu biu biu',new Date())
}

let boom = function () {
    console.log('boom boom boom',new Date())
}

const debounceBoom = debounce(boom,2000)
const debounceBiu = debounce(biu,500)

// setInterval(debounceBiu,1000)
// setInterval(debounceBoom,1000) // 实际运行node环境boom也会执行一次 但是 web不会执行一次 why ?

// 这个🌰就很好的解释了，如果在时间间隔内执行函数，会重新触发计时。
// biu会在第一次1.5s执行后，每隔1s执行一次，
// 而boom一次也不会执行。因为它的时间间隔是2s，而执行时间是1s，所以每次都会重新触发计时
// search搜索联想，用户在不断输入值时，用防抖来节约请求资源。
// window触发resize的时候，不断的调整浏览器窗口大小会不断的触发这个事件，用防抖来让其只触发一次
const func = debounce(biu,500)
// 使用时一定要这样使用才可以，要不然多个return function 不会公用同一个闭包timer


// 防抖函数 可以支持配置 第一次执行 或者 最后一次执行

// 原文链接 https://juejin.cn/post/6844904041189752845
function laterDebounce(func, wait = 50) {
    let timer = 0
    return function (...params) {
        timer && clearTimeout(timer)
        timer = setTimeout(() => func.apply(this, params), wait)
    }
}

/**
 * 立刻执行防抖
 * @param {function} func           防抖函数
 * @param {number} wait             防抖时间间隔
 * @return {function}               返回客户调用函数
 */
function immediateDebounce(func, wait = 50) {
    let timer
    let isRepeat = false // 是否重复点击
    const later = () => setTimeout(() => {
        isRepeat = false // 延时wait后 isRepeat=false，timer=null，便可以调用函数
        timer = null
    }, wait)

    return function (...params) {
        if (!timer && !isRepeat) { // isRepeat=false，timer=null，便可以调用函数
            func.apply(this, params)
        } else {
            isRepeat = true
        }
        timer && clearTimeout(timer)
        timer = later()
    }
}
const immeFunc = immediateDebounce(biu,300)
// setTimeout(immeFunc,1000)
// setTimeout(immeFunc,1000)
// setTimeout(immeFunc,1000)
// immeFunc() //立即执行会执行一次

const immeBoomFunc = immediateDebounce(boom,300)
setInterval(immeBoomFunc,1000)


/**
 * 可配置防抖函数
 * @param  {function} func        回调函数
 * @param  {number}   wait        表示时间窗口的间隔
 * @param  {boolean}  immediate   设置为ture时，是否立即调用函数
 * @return {function}             返回客户调用函数
 */
function debounce(func, wait = 50, immediate = true) {
    return immediate ? immediateDebounce(func, wait) : laterDebounce(func, wait)
}



function test() { console.log([...arguments]) }; 
test('a','b','c');
// output: ['a', 'b', 'c']
// 防抖函数 第一次立即执行 然后 之后都是最后一次执行

function debounce(fn, wait) {
    var timer = null
    var self = this
    var args = [...arguments]
    var count = 0
    return function () {
        clearTimeout(timer)
        if (count == 0) {
            fn.apply(self, args)
            count++
        } else {
            timer = setTimeout(function() {
                fn.apply(self, args)
                count++
            }, wait)
        }
    }
}