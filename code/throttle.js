// 在一段时间之后多次执行，只要函数执行时间满足大于规定时间就执行
function throttle (func, wait = 50) {
    let last = 0
    return function (...args) {
        let now = +new Date()
        if(now - last > wait) {
            last = now
            func.apply(this, args)
        }
    }
}