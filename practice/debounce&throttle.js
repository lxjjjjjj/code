function debounce(func, wait = 50) {
    
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
    
}

// 最后一次执行的throttle

function throttle(func, wait) {
    
}