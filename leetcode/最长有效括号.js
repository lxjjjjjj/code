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



function longKuohao(str){
    let stack = [], res = []
    for(let i = 0;i < str.length; i++) {
        if(stack.length === 0 && str[i] === ')') continue;
        if(str[i] === '('){
            stack.push({
                value: str[i],
                index: i
            })
        } else {
            const pre = stack[stack.length - 1].index
            res[pre] = stack[stack.length - 1].value
            stack.pop()
            res[i] = str[i]
        }
    }
    return res.join('').trim()
}

console.log(longKuohao(')(((())())'))
