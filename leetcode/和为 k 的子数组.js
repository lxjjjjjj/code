// 给定一个整数数组和一个整数 k ****， 请找到该数组中和为 k ****的连续子数组的个数。

// 难度：中等

// 示例 1：
// 输入:nums = [1,1,1], k = 2 输出: 2 解释: 此题 [1,1] 与 [1,1] 为两种不同的情况 
// 示例 2：
// 输入:nums = [1,2,3], k = 3 输出: 2 

// 提示:
// ● 1 <= nums.length <= 2 * 104
// ● -1000 <= nums[i] <= 1000
// ● -107 <= k <= 107

// 方法一：枚举
// 使用双指针解决子数组之和的面试题有一个前提条件——数组中的所有数字都是正数。
// 如果数组中的数字有正数、负数和零，那么双指针的思路并不适用，
// 这是因为当数组中有负数时在子数组中添加数字不一定能增加子数组之和，从子数组中删除数字也不一定能减少子数组之和。

// 该题最简单想到的就是利用枚举，使用双层遍历，先固定左边界，然后枚举右边界。

/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
var subarraySum = function(nums, k) {
    const  len = nums.length;
    let count = 0;
    for (let l = 0; l < len; l++) {
        let sum = 0;
        for (let r = l; r < len; r++) {
            sum += nums[r];
            if(sum === k) {
                count ++;
            }
        }
    }
    return count;
};

// 方法二：前缀和 + 哈希表
// 基于方法一利用数据结构进行进一步的优化。

// 定义 pre[i 为 [0..i] 里所有数的和，则 pre[i] 可以由 pre[i−1] 递推而来，即：pre[i]=pre[i−1]+nums[i]

// 那「[j..i] 这个子数组和为 k 」这个条件可以转化为：pre[i]−pre[j−1]==k

// 简单移项可得符合条件的下标 j 需要满足：pre[j−1]==pre[i]−k

// 考虑以 i 结尾的和为 k 的连续子数组个数时只要统计有多少个前缀和为 pre[i]−k 的 pre[j] 即可。

// 建立哈希表 mp，以和为键，出现次数为对应的值，记录 pre[i]出现的次数，从左往右边更新 mp 边计算答案，
// 那么以 i 结尾的答案 mp[pre[i]−k] 即可在 O(1) 时间内得到。最后的答案即为所有下标结尾的和为 k 的子数组个数之和。

// 需要注意的是，从左往右边更新边计算的时候已经保证了mp[pre[i]−k] 里记录的 pre[j] 的下标范围是 0≤j≤i 。
// 同时，由于pre[i] 的计算只与前一项的答案有关，可以不用建立 pre 数组，直接用 pre 变量来记录 pre[i−1] 的答案即可。

/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
 var subarraySum = function(nums, k) {
    const mp = new Map();
    mp.set(0,1);
    let count = 0, pre = 0;
    for (const x of nums) {
        pre += x;
        if(mp.has(pre - k)) {
            count += mp.get(pre - k);
        }

        if(mp.has(pre)) {
            mp.set(pre, mp.get(pre) + 1);
        } else {
            mp.set(pre, 1);
        }
    }
    return count;
};