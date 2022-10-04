// 输入：strs = ["flower","flow","flight"]
// 输出："fl"
// 示例 2：

// 输入：strs = ["dog","racecar","car"]
// 输出：""
// 解释：输入不存在公共前缀。
/**
 * @param {string[]} strs
 * @return {string}
 */
 var longestCommonPrefix = function(strs) {
    let re = strs[0] || ''
    if (strs.length === 1) return strs[0]

    for (let i = 1; i < strs.length; i++) {
        while (strs[i].slice(0, re.length) !== re) {
            re = re.slice(0, re.length - 1)
        }
    }

    return re
};