// https://juejin.cn/post/6844903669389885453#heading-4
// 防抖是在一段时间内 只执行最后一次，如果这段时间内多次触发，定时器重新计算时间

// 防抖：是指在事件被触发 n 秒后再执行回调，如果在这 n 秒内事件又被触发，则重新计时。这可以用在键盘输入上，等用户输入完成时自动进行字符串校验等
// 节流：是指规定一个单位时间，在这个单位时间内，只能有一次触发事件的回调函数执行，如果在同一个单位时间内某事件被触发多次，只有一次能生效。节流可以使用在 scroll 函数的事件监听上，通过事件节流来降低事件调用的频率。

function debounce (func, wait = 50) {
    let timer = 0
     return function (...args) {
         if(timer) clearTimeout(timer)
         timer = setTimeout(()=>{
            clearTimeout(timer)
            func.apply(this, args)
         }, wait)
     }
 }

//  debounce函数封装后，返回内部函数
//  每一次事件被触发，都会清除当前的timer然后重新设置超时并调用。这会导致每一次高频事件都会取消前一次的超时调用，导致事件处理程序不能被触发
//  只有当高频事件停止，最后一次事件触发的超时调用才能在delay时间后执行
 
   
let biu = function () {
    console.log('biu biu biu',new Date().Format('HH:mm:ss'))
}

let boom = function () {
    console.log('boom boom boom',new Date().Format('HH:mm:ss'))
}


setInterval(debounce(biu,500),1000)
setInterval(debounce(boom,2000),1000)

// 这个🌰就很好的解释了，如果在时间间隔内执行函数，会重新触发计时。
// biu会在第一次1.5s执行后，每隔1s执行一次，
// 而boom一次也不会执行。因为它的时间间隔是2s，而执行时间是1s，所以每次都会重新触发计时
// search搜索联想，用户在不断输入值时，用防抖来节约请求资源。
// window触发resize的时候，不断的调整浏览器窗口大小会不断的触发这个事件，用防抖来让其只触发一次