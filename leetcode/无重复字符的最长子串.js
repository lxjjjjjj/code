// 给定一个字符串 s ，请你找出其中不含有重复字符的 最长子串 的长度。

// 示例 1:

// 输入: s = "abcabcbb"
// 输出: 3 
// 解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。
// 示例 2:

// 输入: s = "bbbbb"
// 输出: 1
// 解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。
// 示例 3:

// 输入: s = "pwwkew"
// 输出: 3
// 解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
//      请注意，你的答案必须是 子串 的长度，"pwke" 是一个子序列，不是子串。

// "aab"
// 输出：2

// var lengthOfLongestSubstring = function(s) {
//     if(!s) return 0
//     if(s.length === 1)  return 1
//     let res = ''
//     let resArr = []
//     for (let i = 0; i < s.length; i++) {
//         for(let j = i; j < s.length; j++) {
//             console.log('s[j]', i, j, s[j], res)
//             if(res.includes(s[j])){
//                 resArr.push(res.length)
//                 res = ''
//             } else {
//                 res = res + s[j]
//                 if(s.length === j + 1){
//                     resArr.push(res.length)
//                     res = ''
//                 }
//             }
//         }
//     }
//     return resArr.sort((a, b) => a - b)[resArr.length - 1]
// };

// console.log(lengthOfLongestSubstring("jbpnbwwd"))


var lengthOfLongestSubstring = function(s) {
    let res = []
    let max = 0
    for (let str of s) {
      //只要有相同的字符串就一直将最前面的字符删掉
      while (res.includes(str)) {
        res.shift()
      }
      res.push(str)
      max = Math.max(max,res.length)
    }
    return max
  };
  console.log(lengthOfLongestSubstring("app"))

