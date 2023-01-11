// 给定一个已按照 ******升序排列 ****的整数数组 numbers ，请你从数组中找出两个数满足相加之和等于目标数 target 。

// 函数应该以长度为 2 的整数数组的形式返回这两个数的下标值 。 
// numbers 的下标 从 0 开始计数 ，所以答案数组应当满足 0 <= answer[0] < answer[1] < numbers.length 。

// 假设数组中存在且只存在一对符合条件的数字，同时一个数字不能使用两次。

// 示例 1：
// 输入：numbers = [1,2,4,6,10], target = 8 输出：[1,3] 解释：2 与 6 之和等于目标数 8 。因此 index1 = 1, index2 = 3 。 
// 示例 2：
// 输入：numbers = [2,3,4], target = 6 输出：[0,2] 
// 示例 3：
// 输入：numbers = [-1,0], target = -1 输出：[0,1] 

// 提示：
// ● 2 <= numbers.length <= 3 * 104
// ● -1000 <= numbers[i] <= 1000
// ● numbers 按 递增顺序 排列
// ● -1000 <= target <= 1000
// ● 仅存在一个有效答案


// 方法一：双指针
// 用两个指针P1和P2分别指向数组中的两个数字。

// 指针P1初始化指向数组的第1个（下标为0）数字，指针P2初始化指向数组的最后一个数字。

// 如果指针P1和P2指向的两个数字之和等于输入的k，那么就找到了符合条件的两个数字。

// 如果指针P1和P2指向的两个数字之和小于k，那么我们希望两个数字的和再大一点。由于数组已经排好序，因此可以考虑把指针P1向右移动。因为在排序数组中右边的数字要大一些，所以两个数字的和也要大一些。

// 如果两个数字的和大于输入的数字k时，可以把指针P2向左移动，因为在排序数组中左边的数字要小一些。

/**
 * @param {number[]} numbers
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(numbers, target) {
    let low = 0;
    let high = numbers.length - 1;
    while(low < high) {
        let sum = numbers[low] + numbers[high];
        if(sum === target) {
            return [low, high];
        } else if(sum < target) {
            low++;
        } else {
            high--;
        }
    }
    return [-1, -1];
};
// 复杂度分析

// 时间复杂度：O(n)，其中 n 是数组的长度。两个指针移动的总次数最多为 n 次。
// 空间复杂度：O(1)。