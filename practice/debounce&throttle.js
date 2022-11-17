function debounce(func, wait = 50) {
    let timer = 0
    return function(...args) {
        if(timer) clearTimeout(timer)
        timer = setTimeout(() => {
            func.apply(this, args)
            clearTimeout(timer)
        }, wait)
    }
}

let biu = function () {
    console.log('biu biu biu',new Date().Format('HH:mm:ss'))
}

let boom = function () {
    console.log('boom boom boom',new Date().Format('HH:mm:ss'))
}


setInterval(debounce(biu,500),1000)
setInterval(debounce(boom,2000),1000)


// 第一次执行的throttle
function throttle(func, wait = 50) {
    let last = new Date()
    return function (...args) {
        let now = new Date()
        if (now - last > wait) {
            last = now
            func.apply(this, ...args)
        }
    }
}

// 最后一次执行的throttle

function throttle(func, wait) {
    let timer = null
    let startTime = Date.now()
    return function() {
        let curTime = Date.now()
        let remaining = delay - (curTime - startTime);
        const context = this
        const args = arguments
        timer && clearTimeout(timer)
        if(remaining <= 0) {
            func.apply(context, args)
            startTime = Date.now()
        } else {
            timer = setTimeout(func, remaining)
        }
    }
}