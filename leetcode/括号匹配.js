const dict = {
    "(": ')',
    "[": "]",
    "{": "}"
}
var isValid = function (s) {
    const stack = []
    if (s.length % 2 !== 0) return false // 长度为奇数肯定错误
    for (let i = 0; i < s.length; i++) {
        if (dict[s[i]]) { // 是开头符号 入栈
            stack.push(s[i])
        } else {//是结尾符号
            if (stack.length === 0) return false
            if (dict[stack[stack.length - 1]] === s[i]) { //能合并则出栈
                stack.pop()
            } else { // 不能合并说明错误
                return false
            }
        }
    }
    return !stack.length  // 栈清空则表示全部合并完成
};