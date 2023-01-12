// https://juejin.cn/post/6844903669389885453#heading-4
// https://juejin.cn/post/6844903648468664333
// 节流函数不管事件触发有多频繁，都会保证在规定时间内一定会执行一次真正的事件处理函数。
// 代码实现有两种，一种是时间戳，另一种是定时器 1）时间戳实现
// 在一段时间之后多次执行，只要函数执行时间满足大于规定时间就执行 即使连续触发多次 也按照相同的时间间隔执行操作
function throttle (func, wait = 50) {
    let last = new Date()
    return function (...args) {
        let now = +new Date()
        if(now - last > wait) {
            last = now
            func.apply(this, args)
        }
    }
}

// 时间戳的实现方式
// 当高频事件触发时，给事件绑定函数与真正触发事件的间隔如果大于delay的话第一次应该会立即执行，
// 而后再怎么频繁触发事件，也都是会每delay秒才执行一次。
// 如果当最后一次事件触发完毕并没有达到大于delay时间的话，事件也不会再被执行了。



// 综合使用时间戳与定时器，完成一个事件触发时立即执行，触发完毕还能执行一次的节流函数
// 实现一个节流函数? 如果想要最后一次必须执行的话怎么实现?
function throttle(func, wait) {
    let last =  new Date()
    let timer = null
    return function () {
        let now = new Date()
        let remaining = now - last - wait
        if(remaining <= 0) {
            func.apply(this, ...arguments)
            last = now
        } else {
            timer && clearTimeout(timer)
            timer = setTimeout(() => {
                func.apply(this, ...arguments)
            }, remaining)
        }
    }
}


// 需要在每个delay时间中一定会执行一次函数，
// 因此在节流函数内部使用开始时间、当前时间与delay来计算remaining，
// 当remaining <= 0时表示该执行函数了，如果还没到时间的话就设定在remaining时间后再触发。
// 当然在remaining这段时间中如果又一次发生事件，那么会取消当前的计时器，
// 并重新计算一个remaining来判断当前状态。








// 使用场景
// 函数节流就是fps游戏的射速，就算一直按着鼠标射击，也只会在规定射速内射出子弹。
// 鼠标不断点击触发，mousedown(单位时间内只触发一次)
// 监听滚动事件，比如是否滑到底部自动加载更多，用throttle来判断






