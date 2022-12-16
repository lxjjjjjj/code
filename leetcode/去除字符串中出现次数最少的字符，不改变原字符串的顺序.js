// 去除字符串中出现次数最少的字符，不改变原字符串的顺序。
// “ababac” —— “ababa”
// “aaabbbcceeff” —— “aaabbb”

function remove(str) {
    let obj = {}, minLength = Infinity, num = [], res = []
    for(let i = 0; i < str.length; i++) {
        if (!obj[str[i]]) {
            obj[str[i]] = 1
        } else {
            obj[str[i]]++
        }
    }
    for(let key in obj) {
        minLength = Math.min(minLength, obj[key])
    }
    for(let key in obj) {
        if(obj[key] === minLength){
            num.push(key)
        }
    }
    for(let i = 0; i < str.length; i++) {
        if(!num.includes(str[i])){
            res.push(str[i])
        }
    }
    return res
}
console.log(remove('aaabbbcceeff'))