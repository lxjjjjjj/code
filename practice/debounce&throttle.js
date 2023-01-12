function debounce(func, wait = 50) {
    let timer = null
    return function () {
        timer && clearInterval(timer)
        timer = setInterval(() => {
            clearInterval(timer)
            func.apply(this, arguments)
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
    return function () {
        let now = new Date()
        if(now - last > wait) {
            last =  now
            func.apply(this, ...arguments)
        }
    }
}

// 最后一次执行的throttle

function throttle(func, wait) {
    
}