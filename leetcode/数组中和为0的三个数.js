// 剑指 Offer II 007. 数组中和为 0 的三个数
// 给你一个整数数组 nums ，判断是否存在三元组 [nums[i], nums[j], nums[k]] 满足 i != j、i != k 且 j != k ，同时还满足 nums[i] + nums[j] + nums[k] == 0 。请

// 你返回所有和为 0 且不重复的三元组。

// 注意： 答案中不可以包含重复的三元组。


// 示例 1：
// 输入：nums = [-1,0,1,2,-1,-4] 输出：[[-1,-1,2],[-1,0,1]] 解释：nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 。nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 。nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 。 不同的三元组是 [-1,0,1] 和 [-1,-1,2] 。 注意，输出的顺序和三元组的顺序并不重要。 
// 示例 2：
// 输入：nums = [0,1,1] 输出：[] 解释：唯一可能的三元组和不为 0 。 
// 示例 3：
// 输入：nums = [0,0,0] 输出：[[0,0,0]] 解释：唯一可能的三元组和为 0 。 

// 提示：
// ● 3 <= nums.length <= 3000
// ● -105 <= nums[i] <= 105

// 方法一：双指针
// 这题是006的加强版。如果输入的数组是排序的，就可以先固定一个数字i，然后在排序数组中查找和为-i的两个数字。
// 我们已经有了用O（n）时间在排序数组中找出和为给定值的两个数字的方法，
// 由于需要固定数组中的每个数字，因此查找三元组的时间复杂度是O（n^2）。

// 算法流程：

// 特判，对于数组长度 n，如果数组为 null 或者数组长度小于 3，返回 []。
// 对数组进行排序。
// 遍历排序后数组：
// 若 nums[i]>0：因为已经排序好，所以后面不可能有三个数加和等于 0，直接返回结果。

// 对于重复元素：跳过，避免出现重复解

// 令左指针 L=i+1，右指针 R=n−1，当 L<R 时，执行循环：

// 当 nums[i]+nums[L]+nums[R]==0，执行循环，判断左界和右界是否和下一位置重复，去除重复解。并同时将 L,R 移到下一位置，寻找新的解
// 若和大于 0，说明 nums[R] 太大，R 左移
// 若和小于 0，说明 nums[L] 太小，L 右移


var threeSum = function(nums) {
    let ans = [];
    const len = nums.length;
    if(nums === null || len < 3) return [];
    // 排序
    nums.sort((a, b) => a - b);
    for (let i = 0; i < len; i++) {
        if(nums[i] > 0) break;
        // 去重
        if(i > 0 && nums[i] === nums[i - 1]) continue;
        let L = i + 1;
        let R = len - 1;
        while (L < R) {
            const sum = nums[i] + nums[L] + nums[R];
            if(sum === 0) {
                ans.push([nums[i],nums[L],nums[R]]);
                while(L < R && nums[L] === nums[L + 1]) L++;
                while(L < R && nums[R] === nums[R - 1]) R--;
                L++;
                R--;
            }
            else if (sum < 0) L++;
            else if (sum > 0) R--;
        }
    }
    return ans;
};