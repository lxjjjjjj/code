// 防抖是在一段时间内 只执行最后一次，如果这段时间内多次触发，定时器重新计算时间
function debounce (func, wait = 50) {
    let timer = 0
     return function (...args) {
         if(timer) clearTimeout(timer)
         timer = setTimeout(()=>{
            func.apply(this, args)
         }, wait)
     }
 }