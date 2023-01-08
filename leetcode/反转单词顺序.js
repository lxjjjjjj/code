// 示例 1：

// 输入: "the sky is blue"
// 输出: "blue is sky the"
// 示例 2：

// 输入: "  hello world!  "
// 输出: "world! hello"
// 解释: 输入字符串可以在前面或者后面包含多余的空格，但是反转后的字符不能包括。
// 示例 3：

// 输入: "a good   example"
// 输出: "example good a"
// 解释: 如果两个单词间有多余的空格，将反转后单词间的空格减少到只含一个。

var reverseWords = function (s) {
    let arr = s.trim().replace(/\s+/g, ' ').split(' ')
    let left = 0, right = arr.length - 1
    while (left < right) {
        [arr[left], arr[right]] = [arr[right], arr[left]]
        left++
        right--
    }
    return arr.join(' ')
};

var reverseWords = function(s) {
    const sarr = s.trim().replace(/\s+/g,' ').split(' ');
    return sarr.reverse().join(' ')
};
