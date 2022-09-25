/**
 * @param {string} s
 * @return {boolean}
 */
 var isValid = function (s) {
    if (s.length % 2 === 1) {//如果是奇数肯定false
        return false;
    }
    const stack = [];
    for (let i = 0; i < s.length; i += 1) {
        //遍历字符串,并且赋值给c
        const c = s[i];
        if (c === '{' || c === '(' || c === '[') {
            //只要是左括号就入栈
            stack.push(c);
        }
        else {
            //栈顶括号(最右边的左括号,也就是最后一个进栈的括号)
            const t = stack[stack.length - 1]
            if (
                (t === '[' && c === ']') ||
                (t === '(' && c === ')') ||
                (t === '{' && c === '}')
            ) {
                stack.pop()
            } else {
                return false
            }
        }
    }
    return stack.length === 0;//如果栈空了会返回true
};
//时间复杂度和空间复杂度都是O（n）

/**
 * @param {string} s
 * @return {boolean}
 */
 var isValid = function(s) {
    if (s.length % 2 !== 0) return false
    const map = {
        '(' : ')',
        '{' : '}',
        '[' : ']'
    };
    let stack = []
    for (let char of s) {
        if (map[char]) {
            stack.push(map[char])
        } else {
            let ret = stack.pop()
            if (ret !== char) {
                return false
            }
        }
    }
    return stack.length === 0
};