function getZero(arr) {
    let maxArr = [], midArr = [], sum = 0
    for(let i=0;i<arr.length;i++) {
        midArr = []
        sum = 0
        for(let j=i;j<arr.length;j++) {
            sum = sum + arr[j]
            midArr.push(arr[j])
            if(sum === 0){
                maxArr = midArr.length > maxArr.length ? [...midArr] : [...maxArr]
            }
        }
    }
    return maxArr.length
}
console.log(getZero([0,1,-1,-1,0,1,1,-1]))