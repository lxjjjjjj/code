/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
 // https://github.com/webVueBlog/Tencent-50-Leetcode/issues/10
var threeSumClosest = function(nums, target) {
    let ans = nums[0] + nums[1] + nums[2]
    if (nums.length === 3) return ans
    nums.sort((a, b) => a - b)
    let len = nums.length

    for (let i = 0; i < len; i++) {
        let l = i + 1
        let r = len - 1
        while (l < r) {
            let tempNum = nums[i] + nums[l] + nums[r]
            if (Math.abs(target - tempNum) < Math.abs(target - ans)) {
                ans = tempNum
            }
            if (tempNum > target) {
                r--
            } else if (tempNum < target) {
                l++
            } else {
                // 如果恰好相等 那么就直接结束for 和 while 循环 函数返回值
                return tempNum
            }
        }
    }

    return ans
}