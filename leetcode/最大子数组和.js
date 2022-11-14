// 给你一个整数数组 nums ，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。

// 子数组 是数组中的一个连续部分。

// 示例 1：

// 输入：nums = [-2,1,-3,4,-1,2,1,-5,4]
// 输出：6
// 解释：连续子数组 [4,-1,2,1] 的和最大，为 6 。
// 示例 2：

// 输入：nums = [1]
// 输出：1
// 示例 3：

// 输入：nums = [5,4,-1,7,8]
// 输出：23

/**
 * @param {number[]} nums
 * @return {number}
 */
// 暴力解决
var maxSubArray = function(nums) {
    let maxRes = - Number.MAX_VALUE
    for(let i = 0; i < nums.length; i++) {
        let res = 0
        for(let j = i; j < nums.length; j++) {
            res = res + nums[j]
            maxRes = Math.max(res, maxRes)
        }
    }
    return maxRes
};
// console.log(maxSubArray([5,4,-1,7,8]))
console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))

//  聪明解决
var maxSubArray = function(nums) {
  // 0 为无，0 在累加类的算法计算中将不会对结果产生任何影响，所以初始化 sum 为0是通用方案
  let sum = 0
  let max = nums[0]
  for (let i = 0; i < nums.length; i++) {
    // 如果大于0，则证明 sum 尚有利用价值，可以继续利用之，因为 sum 加上正数会让 sum 更大
    // 如果小于0，则证明 sum 已无利用价值，因为 sum 加上负数只会让 sum 更小，会拖累整体的，只能含泪让 sum 从新开始
    sum > 0 ? sum += nums[i] : sum = nums[i]
    // sum 负责加加加， max 负责大大大
    // 每次迭代，都始终让我们的 max 保持最大值，因为sum会有多个累加和，并不是加到最后就会是最大值
    max = Math.max(sum, max)
  }
  return max
};

