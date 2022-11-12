// 给你一个按照非递减顺序排列的整数数组 nums，和一个目标值 target。请你找出给定目标值在数组中的开始位置和结束位置。

// 如果数组中不存在目标值 target，返回 [-1, -1]。

// 你必须设计并实现时间复杂度为 O(log n) 的算法解决此问题。

// 示例 1：

// 输入：nums = [5,7,7,8,8,10], target = 8
// 输出：[3,4]
// 示例 2：

// 输入：nums = [5,7,7,8,8,10], target = 6
// 输出：[-1,-1]
// 示例 3：

// 输入：nums = [], target = 0
// 输出：[-1,-1]

/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var searchRange = function(nums, target) {
    if(!nums.length) {
        return [-1, -1]
    }
    let index = [0, nums.length - 1], mid = Math.floor((nums.length - 1) / 2), res = []
    if(nums[mid] >= target && nums.length > 2) {
        index = [0, mid]
    }
    if(nums[mid] < target && nums.length > 2) {
        index = [mid, nums.length - 1]
    }
    console.log('index', index)
    for(let i = index[0]; i <= index[1]; i++) {
        console.log('nums[i]', nums[i], 'target', target)
        if(nums[i] === target){
            res.push(i)
        }
    }
    console.log('res', res)
    if(res.length === 1) return [res[0], res[0]]
    return [res[0] === undefined ? -1 : res[0], res[res.length - 1] === undefined ? -1 : res[res.length - 1]]
};
// console.log(searchRange([5,7,7,8,8,10], 6))
// console.log(searchRange([5,7,7,8,8,10], 8))
console.log(searchRange([2,2], 2))