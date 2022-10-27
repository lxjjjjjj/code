// https://juejin.cn/post/6844903669389885453#heading-4
// 在一段时间之后多次执行，只要函数执行时间满足大于规定时间就执行 即使连续触发多次 也按照相同的时间间隔执行操作
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
// 使用场景
// 函数节流就是fps游戏的射速，就算一直按着鼠标射击，也只会在规定射速内射出子弹。
// 鼠标不断点击触发，mousedown(单位时间内只触发一次)
// 监听滚动事件，比如是否滑到底部自动加载更多，用throttle来判断




