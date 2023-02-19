// 正整数 n 代表生成括号的对数，请设计一个函数，用于能够生成所有可能的并且 有效的 括号组合。

// 示例 1：

// 输入：n = 3
// 输出：["((()))","(()())","(())()","()(())","()()()"]
// 示例 2：

// 输入：n = 1
// 输出：["()"]

var generateParenthesis = function(n) {
    const dfs = (left, right, path) => {
        if (left === right && left === n) {
            ans.push(path);
            return;
        }
        if (left < right || left > n) {
            return;
        }
        dfs(left+1, right, path + '(');
        dfs(left, right+1, path + ')');
    }
    const ans = [];
    dfs(0, 0, '');
    return ans;
};