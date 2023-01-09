// 给定两个整数 a 和 b ，求它们的除法的商 a/b ，要求不得使用乘号 '*'、除号 '/' 以及求余符号 '%' 。

// 难度：简单

// 注意：

// 整数除法的结果应当截去（truncate）其小数部分，例如：truncate(8.345) = 8 以及 truncate(-2.7335) = -2
// 假设我们的环境只能存储 32 位有符号整数，其数值范围是[−2^31, 2^31−1] 。本题中，如果除法结果溢出，则返回 2^31-1

// 示例 1：
// 输入：a = 15, b = 2 输出：7 解释：15/2 = truncate(7.5) = 7 

// 示例 2：
// 输入：a = 7, b = -3 输出：-2 解释：7/-3 = truncate(-2.33333..) = -2

// 示例 3：
// 输入：a = 0, b = 1 输出：0

// 示例 4：
// 输入：a = 1, b = 1 输出：1

// 提示:
// ● -2^31 <= a, b <= 2^31 - 1
// ● b != 0

// 方法一：二分查找
// 知识点： 位运算 数学

// 分析：

// 题目限制不能使用乘号和除号。一个直观的解法是基于减法实现除法。这种解法的时间复杂度为O（n）。需要对这种解法进行优化。

// 将上述解法稍做调整。当被除数大于除数时，继续比较判断被除数是否大于除数的2倍，如果是，
// 则继续判断被除数是否大于除数的4倍、8倍等。如果被除数最多大于除数的2k倍，那么将被除数减去除数的2k倍，
// 然后将剩余的被除数重复前面的步骤。由于每次将除数翻倍，因此优化后的时间复杂度是O（logn）。


/**
 * @param {number} dividend
 * @param {number} divisor
 * @return {number}
 */
 var divide = function(dividend, divisor) {
    const MAX_VALUE = Math.pow(2, 31) - 1;
    const MIN_VALUE = -Math.pow(2, 31);
    // 考虑被除数为最小值的情况
    if (dividend === MIN_VALUE) {
        if (divisor === 1) {
            return MIN_VALUE;
        }
        if (divisor === -1) {
            return MAX_VALUE;
        }
    }
    // 考虑除数为最小值的情况
    if (divisor === MIN_VALUE) {
        return dividend === MIN_VALUE ? 1 : 0;
    }
    // 考虑被除数为 0 的情况
    if (dividend === 0) {
        return 0;
    }

    // 一般情况，使用类二分查找
    // 将所有的正数取相反数，这样就只需要考虑一种情况
    let res = 0;
    let flag = '';
    if (dividend < 0 && divisor > 0 || dividend > 0 && divisor < 0) {
        flag = '-';
    }
    dividend = Math.abs(dividend);
    divisor = Math.abs(divisor);
    
    while (dividend >= divisor) {
        let temp = divisor, m = 1;
        while (temp <= (dividend >> 1)) { // 位运算模拟乘法，撑到最大。防止溢出 
            // >> 是 除以 2 的意思
            temp <<= 1;
            // << 是 乘以 2 的意思
            m <<= 1;
        }
        dividend -= temp;
        res += m;
    }

    return parseInt(flag + res);
}

// 复杂度分析

// 时间复杂度：O(log⁡N)，即为二分查找需要的时间。
// 空间复杂度：O(log⁡N)。