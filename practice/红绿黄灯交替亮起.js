function red() {
    console.log('red')
}
function green() {
    console.log('green')
}
function yellow() {
    console.log('yellow')
}
function myLight(time, cb) {
    return new Promise((resolve) => {
        setTimeout(() => {
            cb()
            resolve()
        }, time)
    })
}
function myStep() {
    Promise.resolve().then(() => {
        return myLight(1000, red)
    }).then(() => {
        return myLight(1000, green)
    }).then(() => {
        return myLight(1000, yellow)
    }).then(() => {
        myStep()
    })
}
myStep()