// 给你一个字符串 s 和一个字符串列表 wordDict 作为字典。请你判断是否可以利用字典中出现的单词拼接出 s 。

// 注意：不要求字典中出现的单词全部都使用，并且字典中的单词可以重复使用。

// 示例 1：

// 输入: s = "leetcode", wordDict = ["leet", "code"]
// 输出: true
// 解释: 返回 true 因为 "leetcode" 可以由 "leet" 和 "code" 拼接成。
// 示例 2：

// 输入: s = "applepenapple", wordDict = ["apple", "pen"]
// 输出: true
// 解释: 返回 true 因为 "applepenapple" 可以由 "apple" "pen" "apple" 拼接成。
//      注意，你可以重复使用字典中的单词。
// 示例 3：

// 输入: s = "catsandog", wordDict = ["cats", "dog", "sand", "and", "cat"]
// 输出: false

// 要判断是否可以用字典中的单词拼接出整个字符串(用arr[s.length]表示)，可以从左到右判断

// 前i位([0, i - 1])能否分解成单词(用arr[i]表示)
// 剩余字符串([i, s.length - 1])是否是单个单词(截取为s.substr(i, s.length - i))
// 再细分，arr[i]同样可以用着两个条件判断

// 前j位([0, j - 1])能否分解成单词(用arr[j]表示)
// 剩余字符串([j, i - j])是否是单个单词(从j直到最后一位截取为s.substr(j, i - j)，用set判断:set.has(s.substr(j, i - j)))
// 得到动态转移方程:arr[i] = arr[j] && set.has(s.substr(j, i - j)

// 为了让动态转移方程得以运转，设定arr[0]= true

/**
 * @param {string} s
 * @param {string[]} wordDict
 * @return {boolean}
 */
 var wordBreak = function(s, wordDict) {
    const n = s.length;
    const set = new Set(wordDict);
    let arr = new Array(n + 1).fill(false);
    arr[0] = true;
    for(let i = 1; i <= n; i++) {
        for(let j = 0; j < i; j++) {
            if(arr[j] && set.has(s.substr(j, i - j))) {//动态转移方程
                arr[i] = true;
                break;
            }
        }
    }
    return arr[n];
};


