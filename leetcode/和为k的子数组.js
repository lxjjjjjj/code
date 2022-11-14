// 给你一个整数数组 nums 和一个整数 k ，请你统计并返回 该数组中和为 k 的连续子数组的个数 。

// 示例 1：

// 输入：nums = [1,1,1], k = 2
// 输出：2

// 示例 2：

// 输入：nums = [1,2,3], k = 3
// 输出：2

// [1,2,1,2,1] 3  ==> 4

// 分析 连续数字的和 或者一个数字和k相等 返回结果是子数组的长度
var subarraySum = function(nums, k) {
    let midNums = 0, left = 0
    function loop(left = 0, sum = 0) {
        if(left >= nums.length) return
        for(let i = left; i < nums.length; i++) {
            sum = sum + nums[i]
            if(sum !== k && i === nums.length - 1){ // 如果循环到最后一个sum还是不等于k(无论大于还是小于) 也要右移指针
                loop(++left)
            }
            if(sum === k && nums[i+1] === 0){ // 如果下一个数是0 可以继续循环下去算一种情况
                midNums++
            }
            if(sum > k && nums[i+1] >= 0) { // 如果下一个是负数可以继续加下去
                loop(++left)
                break; // 为了不继续走后面的循环
            } else if(sum === k){
                loop(++left)
                midNums++
                break; // 为了不继续走后面的循环
            }
        }
    }
    loop(left)
    return midNums
};
console.log(subarraySum([1,2,3],3))
// console.log(subarraySum([1,1,1],2))
// console.log(subarraySum([1,2,1,2,1], 3))
// console.log(subarraySum([-1,-1,1],0)) // 1
// console.log(subarraySum([1,-1,0],0))  // 3 这个case太恶心了