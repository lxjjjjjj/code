// 给定一个含有 n 个正整数的数组和一个正整数 target 。
// 找出该数组中满足其和 ≥ target 的长度最小的 连续子数组 
// [nums[l], nums[l+1], ..., nums[r-1], nums[r]] ，
// 并返回其长度 。如果不存在符合条件的子数组，返回 0 。

// 示例 1：
// 输入：target = 7, nums = [2,3,1,2,4,3] 输出：2 解释：子数组 [4,3] 是该条件下的长度最小的子数组。 
// 示例 2：
// 输入：target = 4, nums = [1,4,4] 输出：1 
// 示例 3：
// 输入：target = 11, nums = [1,1,1,1,1,1,1,1] 输出：0 

// 提示：
// ● 1 <= target <= 109
// ● 1 <= nums.length <= 105
// ● 1 <= nums[i] <= 105

// 数组 二分查找 前缀 和 滑动窗口


// 定义两个指针 P1 和 P2 分别表示子数组（滑动窗口窗口）的开始位置和结束位置，维护变量 sum 存储子数组中的元素和（即从 nums[P1]到 nums[P2] 的元素和）。

// 初始状态下，P1 和 P2 都指向下标 0，sum 的值为 0。

// 当指针P1和P2之间的子数组数字之和小于k时，向右移动指针P2，直到两个指针之间的子数组数字之和大于k，否则向右移动指针P1，直到两个指针之间的子数组数字之和小于k。

// 查找数组[5，1，4，3]中和大于或等于7的最短子数组的过程如下图所示

/**
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
 var minSubArrayLen = function(target, nums) {
    const length = nums.length;
    let ans = Infinity;
    let P1 = 0;
    let sum = 0;

    for (let P2 = 0; P2 < length; P2++ ) {
        sum += nums[P2];
        while (P1 <= P2 && sum >= target) {
            ans = Math.min(ans, P2 - P1 + 1);
            sum -= nums[P1++];
        }
    }
    return ans === Infinity ? 0 : ans;
};
