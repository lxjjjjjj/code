function add(num1, num2) {
    let length = Math.max(num1.length, num2.length)
    let sum = []
    let mid = 0
    if(num1.length < length) {
        num1 = fillArray(num1, length)
    } 
    if(num2.length < length) {
        num2 = fillArray(num2, length)
    } 
    for(let i = length - 1; i >= 0; i--) {
        let midSum = Number(num1[i]) + Number(num2[i]) + mid
        sum.unshift(Number(midSum) >= 10 ? midSum % 10 : midSum)
        mid = Math.floor(midSum / 10)
    }
    if(mid) sum.unshift(mid)
    return sum.join('')
}
function fillArray(num, length) {
    let newNum = []
    for(let i = 0; i < length - num.length; i++) {
        newNum.push(0)
    }
    return newNum.concat(num.split(''))
}
console.log(add('12345', '12345'))
console.log(add('123', '12345'))
console.log(add('1', '99'))
console.log(add('1', '9'))