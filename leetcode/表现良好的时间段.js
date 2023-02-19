// 前缀和 例如 nums = [1,2,-1,2] 对应前缀和数组s = [0,1,3,2,4]
// 符合结果的条件是 不劳累天数 - 劳累天数 > 0
// 劳累天数 nums[i] = 1 不劳累天数 nums[i] = -1 问题变成 计算 nums的最长子数组 其元素和大于0
// 找到两个下标i 和 j 满足 j < i 且 s[j] < s[i] 最大化 i - j 的值
// 
/**
 * @param {number[]} hours
 * @return {number}
 */
var longestWPI = function (hours) {
    let count = 0; // 大于8h的累计天数
    let result = 0;
    let map = new Map();
    for (let i = 0; i < hours.length; i++) {
        if (hours[i] > 8) {
            count++;
        } else {
            count--;
        }
        if (count > 0) {
            result = i + 1;
        } else {
            if (!map.has(count)) {
                map.set(count, i); // 记录第一次count<=0的下标
                console.log('count', count, map.get(count))
            }
            // 如果count一直是负数 那减一只会是往后挪动一步 也就是 map.has(count - 1) 一直不会有值
            // 如果count是0 并且前一位是比八小的数 那就是此时最大的值
            if (map.has(count - 1)) { // 如果有count的前一次记录，此时count-1到count符合要求
                result = Math.max(result, i - map.get(count - 1));
            }
        }
    }
    return result;
}
// console.log(longestWPI([9,9,6,0,6,6,9]))
// console.log(longestWPI([6,6,9]))
// console.log(longestWPI([6,9,9]))
console.log(longestWPI([6,6,6,0,6,6]))