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

// 关键点：当前缀和数组减去目标和等于前缀和数组中的某一项，则说明存在连续子数组的和等于目标和
// 举个例子，愿数组[1,1,1],前缀和[0，1，2，3].目标和2
// 当发现前缀和数组中2-2等于0（前缀中第一项），说明存在连续子数组即[1,1]和等于2

// 一、首先要构造一个前缀和数组
// 第一项为0，之后的项是前缀和元素加上愿数组元素

// 二、创建一个map，存储前缀和数组中元素出现的次数。
// 三、遍历前缀和数组，当前缀和数组减去目标和等于map中的某一项，则说明存在连续子数组的和等于目标和，count即map中这一项对应的值。接着map设置前缀和数组元素出现的次数
// （注意，由于前缀和第一项是0，从1开始）

var subarraySum = function(nums, k) {
    //法二：前缀和+哈希表
    let count = 0;
    let map = new Map();
    map.set(0, 1);
    let pre = 0;
    for(let num of nums) {
        pre += num;//前n项和
        // 重点 如果含有acc-k，说明从数组 j ~ i 之间的数字之和为 k
        if(map.has(pre - k)) {//存在数组和等于pre - k
            count += map.get(pre - k);//计数
        }
        if(map.has(pre)) {//等于pre的数组出现过
            map.set(pre, map.get(pre) + 1);//和为pre的情况增加
        } else {//等于pre的数组没出现过
            map.set(pre, 1);//新增进哈希表
        }
    }
    return count;
};

