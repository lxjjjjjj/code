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
    if(!strs.length) return ''
    let index = 0
    first = strs.pop()
    let res = first[index]
    while(strs.every(item => !item.indexOf(res))){
        res = res + first[++index]
    }
    return res.slice(0, res.length - 1)
};
// console.log(longestCommonPrefix(["flower","flow","flight"]))
console.log(longestCommonPrefix(["dog","racecar","car"]))