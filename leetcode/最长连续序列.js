// 给定一个未排序的整数数组 nums ，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。

// 请你设计并实现时间复杂度为 O(n) 的算法解决此问题。

//  

// 示例 1：

// 输入：nums = [100,4,200,1,3,2]
// 输出：4
// 解释：最长数字连续序列是 [1, 2, 3, 4]。它的长度为 4。

// 示例 2：

// 输入：nums = [0,3,7,2,5,8,4,6,0,1]
// 输出：9

var longestConsecutive = function(nums) {
    if(!nums.length) return 0
    let depth = 1, maxDepth = 1
    nums.sort((a, b) => a - b)
    let prev = nums.splice(0,1)[0]
    for (let i = 0; i < nums.length; i++) {
        console.log('nums[i]', nums[i], 'prev', prev)
        if(nums[i] - prev === 1){
            maxDepth = Math.max(++depth, maxDepth)
        } else if(nums[i] - prev > 1){
            depth = 1
        }
        prev = nums[i]
    }
    return maxDepth
};
// console.log(longestConsecutive([0,3,7,2,5,8,4,6,0,1]))
// console.log(longestConsecutive([100,4,200,1,3,2]))
console.log(longestConsecutive([1,2,0,1]))