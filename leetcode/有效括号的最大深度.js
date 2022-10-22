// 输入：s = "(1+(2*3)+((8)/4))+1"
// 输出：3
// 解释：数字 8 在嵌套的 3 层括号中。
// 示例 2：

// 输入：s = "(1)+((2))+(((3)))"
// 输出：3

var maxDepth = function(s) {
    let depth = 0
    let maxDepth = 0
    for(let i = 0; i< s.length;i++) {
         if(s[i] === '(') {
             ++depth
             maxDepth = Math.max(maxDepth, depth)
         }
         if(s[i] === ')') {
             depth--
         }
        console.log('maxDepth', maxDepth)
    }
    return maxDepth
 };