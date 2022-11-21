// 给你一个整数数组 nums 和一个整数 k ，请你返回其中出现频率前 k 高的元素。你可以按 任意顺序 返回答案。
// k=2就是返回前两个频率  k=3就是返回前三个频率
// 示例 1:

// 输入: nums = [1,1,1,2,2,3], k = 2
// 输出: [1,2]
// 示例 2:

// 输入: nums = [1], k = 1
// 输出: [1]

var topKFrequent = function(nums, k) {
    let times = new Map()
    for(let i = 0; i < nums.length; i++) {
        if(times.get(nums[i])){
            times.set(nums[i], times.get(nums[i])+1)
        } else {
            times.set(nums[i], 1)
        }
    }
    newNums = []
    let j = 0;
    for(let [key,value] of times){
        newNums[j++] = [key,value];
    }
    res = quickSort(newNums)
    const value = res.map((value, i) => {
        if(i + 1 <= k) return value[0]
    }).filter(item => item !== undefined)
    return value
};

function quickSort(arrs) {
    if(arrs.length <= 1) return arrs
    let mid = Math.floor(arrs.length / 2), leftArr = [], rightArr = [], pivot = arrs.splice(mid,1)[0];
    for(let i=0; i<arrs.length; i++){
        if(arrs[i][1] > pivot[1]) {
            leftArr.push(arrs[i])
        } else {
            rightArr.push(arrs[i])
        }
    }
    return quickSort(leftArr).concat([pivot], quickSort(rightArr));
}


// topKFrequent([1,1,1,2,2,3], 2)

topKFrequent([3,0,1,0], 2)