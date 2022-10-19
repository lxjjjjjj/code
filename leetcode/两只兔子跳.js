// 一条路的两端 一只兔子1，3，5，7 另一只 1，2，3，4 能不能同时跳到一个位置
function getRes(num) {
    let sum = 0, step = 0
    while(sum < num){
        sum = sum + step * 2 + 1 + step + 1
        step++
    }
    if(num === sum) {
        return step
    } else {
        return -1
    }
}
console.log('aaaa',getRes(8))