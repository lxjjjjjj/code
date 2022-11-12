// 给出n对括号，请编写一个函数来生成所有的由n对括号组成的合法组合。
// 例如，给出n=3，解集为：
// "((()))", "(()())", "(())()", "()()()", "()(())"

// 右侧括号个数是不能多余左侧括号的 什么时候都可以出现 只要右侧括号个数少于左侧括号

// 一种就是马上给这个左侧括号匹配 一种就是不马上匹配 但是左侧括号的n由初始值变成0的时候一定要放入右侧括号

function match(num) {
    const res = []
    function getStr(strnum, str = '') {
        if(str.length === num * 2 && !res.includes(str)){
            res.push(str) 
            return
        }
        while(str.length <= num * 2){
            ['(', ')'].forEach(item => {
                if(strnum){
                    if(item === '(') --strnum
                    str = str + item
                    getStr(strnum, str)
                } else {
                    if(item === ')') {
                        str = str + item
                        getStr(strnum, str)
                    }
                }
            })
        }
    }
    getStr(num)
    return res
}
const res = match(4)
console.log(res)
