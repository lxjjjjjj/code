// 输入：s = "(()"
// 输出：2
// 解释：最长有效括号子串是 "()"
// 示例 2：

// 输入：s = ")()())"
// 输出：4
// 解释：最长有效括号子串是 "()()"
// 示例 3：

// 输入：s = ""
// 输出：0


// 自己解答

function longKuohao(str){
    let stack = [], maxLen = 0, len = 0
    for(let i = 0;i < str.length; i++) {
        if(str[i] === '(') {
            stack.push(str[i])
        } else if(stack[stack.length - 1] === '(' && str[i] === ')'){
            stack.pop(str[i])
            len++
            maxLen = Math.max(len, maxLen)
            if(stack.length !== 0 && str[i+1] === ''){
                len = 0
            }
        } 
    }
    return maxLen * 2
}

console.log(longKuohao(')(((())())'))

// 官方答案

var longestValidParentheses = function(s) {
    let max = 0
    if (s.length < 1) return max

    let len = s.length

    // 栈顶之所有加入一个-1,纯粹是为了方便计算有效括号的长度
    // 不然就需要手动调整为i-j+1;同时而确保第一个字符为")"时不需要特殊处理
    let stack = [-1]

    for(let i = 0; i < len; i++) {
        let value = s[i]
        if (value === '(') {
            stack.push(i)
        } else if (value === ')') {
            stack.pop()
            // 栈顶加入一个pivot字符")",实际上是方便计算有效括号串长度
            if (stack.length < 1) {
                stack.push(i)
            } else {
                max = Math.max(max, i - stack[stack.length - 1])
            }
        }
    }


    return max
};
console.log(longestValidParentheses('()()'))
