// https://juejin.cn/post/7128263423258787848
// 给你一个字符串 s，找到 s 中最长的回文子串。

// 示例 1：

// 输入：s = "babad"
// 输出："bab"
// 解释："aba" 同样是符合题意的答案。
// 示例 2：

// 输入：s = "cbbd"
// 输出："bb"
// 提示：

// 1 <= s.length <= 1000
// s 仅由数字和英文字母组成

// 如果在没有两个相同的字母的情况下 只有单个字符本身能走到while循环里 所以maxStr永远都是这个字符本身 然后如果有两个相同的字符的话 就说明可能会出现最长回文字符串了 然后两个指针开始分别向左右移动 然后继续往两边走
/**
 * @param {string} s
 * @return {string}
 */
 // 奇数回文 aba 偶数回文abba
 var longestPalindrome = function(s) {
    let max = ''

    for (let i = 0; i < s.length; i++) {
        helper(i, i)
        helper(i, i+1)
    }

    function helper(l, r) {
        while(l >= 0 && r < s.length && s[l] === s[r]) {
            l--
            r++
        }
        const maxStr = s.slice(l + 1, r - 1 + 1)
        if (maxStr.length > max.length) max = maxStr
    }

    return max
};