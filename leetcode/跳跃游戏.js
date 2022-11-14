// 给定一个非负整数数组 nums ，你最初位于数组的 第一个下标 。

// 数组中的每个元素代表你在该位置可以跳跃的最大长度。

// 判断你是否能够到达最后一个下标。

// 示例 1：

// 输入：nums = [2,3,1,1,4]
// 输出：true
// 解释：可以先跳 1 步，从下标 0 到达下标 1, 然后再从下标 1 跳 3 步到达最后一个下标。
// 示例 2：

// 输入：nums = [3,2,1,0,4]
// 输出：false
// 解释：无论怎样，总会到达下标为 3 的位置。但该下标的最大跳跃长度是 0 ， 所以永远不可能到达最后一个下标。

/**
 * @param {number[]} nums
 * @return {boolean}
 */
// var canJump = function(nums) {
//     if(nums.length <= 1) return true
//     let res = false
//     function step(num, index) {
//         for(let i = 1; i <= num; i++ ) {
//             if(i + index >= nums.length - 1) {
//                 res = true
//                 break
//             }
//             step(nums[index + i], index + i)
//         }
//     }
//     step(nums[0], 0)
//     return res
// };

// console.log(canJump([3,2,1,0,4]))
// console.log(canJump([2,3,1,1,4]))
// 超出时间复杂度了
// console.log(canJump([8,2,4,4,4,9,5,2,5,8,8,0,8,6,9,1,1,6,3,5,1,2,6,6,0,4,8,6,0,3,2,8,7,6,5,1,7,0,3,4,8,3,5,9,0,4,0,1,0,5,9,2,0,7,0,2,1,0,8,2,5,1,2,3,9,7,4,7,0,0,1,8,5,6,7,5,1,9,9,3,5,0,7,5]))

// 不管跳到任何位置 只要那个位置的值+自己本身的值大于 数组长度 就能达到 到达最后一个位置的目的
var canJump = function(nums) {
    let n = nums.length - 1;
    let maxLen = 0;
    for(let i = 0; i <= maxLen; i++) { //注意这里是maxLen，在maxLen范围的位置内找到更远的跳跃位置
        maxLen = Math.max(maxLen, nums[i] + i); //更新maxLen
        if(maxLen >= n) return true; //如果这个位置正好在最后一个下标或超过最后一个下标，那么一定能到达最后一个下标
    }
    return false;
};
console.log(canJump([1,0,0,2,1]))