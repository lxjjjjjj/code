// [1,2,2,3] [1,2,3,3] 第二大的数都是2
function findSecondNum(arr) {
    let secondMax = Number.MIN_SAFE_INTEGER,max = Number.MIN_SAFE_INTEGER
    for(let i=0; i<arr.length; i++){
        if(max < arr[i]) {
            secondMax = max
            max = arr[i]
        }
    }
    return secondMax
}
console.log(findSecondNum([1,2,2,3]))