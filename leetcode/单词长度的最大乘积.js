// 给定一个字符串数组 words，请计算当两个字符串 words[i] 和 words[j] 不包含相同字符时，
// 它们长度的乘积的最大值。假设字符串中只包含英语的小写字母。如果没有不包含相同字符的一对字符串，返回 0。

// 难度：中等

// 示例 1:
// 输入: words = ["abcw","baz","foo","bar","fxyz","abcdef"] 输出: 16  解释: 这两个单词为 "abcw", "fxyz"。它们不包含相同字符，且长度的乘积最大。
// 示例 2:
// 输入: words = ["a","ab","abc","d","cd","bcd","abcd"] 输出: 4  解释: 这两个单词为 "ab", "cd"。
// 示例 3:
// 输入: words = ["a","aa","aaa","aaaa"] 输出: 0  解释: 不存在这样的两个单词。 

// 提示：
// ● 2 <= words.length <= 1000
// ● 1 <= words[i].length <= 1000
// ● words[i] 仅包含小写字母

// 方法一：位运算
// 分析：

// 关键在于如何判断两个字符串str1和str2中没有相同的字符。直观的想法是基于字符串str1中的每个字符，
// 扫描字符串str2判断字符是否出现在str2中。设字符串的长度分别为p和q，那么时间复杂度是O（pq）。

// 如果可以将判断两个单词是否有公共字母的时间复杂度降低到 O(1)，则可以将总时间复杂度降低到 O(n^2)。
// 用整数的二进制数位记录字符串中出现的字符，用26位就能表示一个字符串中出现的字符。如果字符串中包含'a'，
// 那么整数最右边的数位为1；如果字符串中包含'b'，那么整数的倒数第2位为1，其余以此类推。
// 这样做的好处是能更快地判断两个字符串是否包含相同的字符。

// 如果两个字符串中包含相同的字符，对应的整数相同的某个数位都为1，两个整数的与运算将不会等于0。

// 如果两个字符串没有相同的字符，对应的整数的与运算的结果等于0。

/**
 * @param {string[]} words
 * @return {number}
 */
var maxProduct = function(words) {
    const length = words.length;
    const masks = new Array(length).fill(0);
    for (let i = 0; i < length; i++) {
        const word = words[i];
        const wordLen = word.length;
        for (let j = 0; j < wordLen; j++) {
            // 将单词转换为二进制掩码存储
            masks[i] |= 1 << (word[j].charCodeAt() - 'a'.charCodeAt());
        }
    }

    let maxProd = 0;
    // 两层遍历比较最大乘积
    for (let i = 0; i < length; i++) {
        for (let j = i + 1; j < length; j++) {
            if((masks[i] & masks[j]) === 0) {
                // 通过逻辑与计算两个二进制数是否存在相同位
                maxProd = Math.max(maxProd, words[i].length * words[j].length);
            }
        }
    }
    return maxProd;
};
// 复杂度分析

// 时间复杂度：O(L + n^2)，其中 L 是数组 words 中的全部单词长度之和，n 是数组 words的长度。预处理每个单词的位掩码需要遍历全部单词的全部字母，时间复杂度是 O(L)，然后需要使用两重循环遍历位掩码数组 masks 计算最大单词长度乘积，时间复杂度是 O(n^2)
// 空间复杂度：O(n)，其中 n 是数组 words 的长度。需要创建长度为 n 的位掩码数组 masks。