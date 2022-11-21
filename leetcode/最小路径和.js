// 给定一个包含非负整数的 m x n 网格 grid ，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。

// 说明：每次只能向下或者向右移动一步。

var minPathSum = function(grid) {
    if(grid.length === 0) return 0
    let miniValue = Number.MAX_SAFE_INTEGER
    function getMini(value, right, down) {
        if(right === grid[0].length -1 && down === grid.length - 1) {
            // console.log('result value', value, right, down)
            miniValue = Math.min(miniValue, value)
        }
        if(right < grid[0].length - 1) {
            if(down >= grid.length - 1) down = grid.length - 1
            return getMini(value + grid[down][right + 1], right + 1, down)
        }
        if(down < grid.length - 1) {
            if(right >= grid[0].length - 1) right = grid[0].length - 1
            return getMini(value + grid[down + 1][right], right, down + 1)
        }
    }
    getMini(grid[0][0], 0, 0)
    return miniValue
};

console.log(minPathSum([[1,3,1],[1,5,1],[4,2,1]]))

// 动态规划解法
// 创建一个dp数组，里面每个值代表着到这一点的最短路径和，例如dp[2][2]，就代表到达grid[2][2]的最短路径和，推出dp方程为：
// dp[i][j] = Math.min(dp[i - 1][j] + grid[i][j], dp[i][j - 1] + grid[i][j])

var minPathSum = function(grid) {
    // 行
    const row = grid.length;
    // 列
    const col = grid[0].length;
  
    // 创建dp数组
    const dp = Array.from(new Array(row), () => new Array(col).fill(1));
    
    // 到达第一个点的路径和肯定为grid[0][0]值本身
    dp[0][0] = grid[0][0];
    
    // 求第一行每个点的最短路径和
    for (let i = 1; i < col; i++) {
      dp[0][i] = grid[0][i] + dp[0][i - 1];
    }
  
    // 求第一列每一行的最短路径和
    for (let j = 1; j < row; j++) {
      dp[j][0] = grid[j][0] + dp[j - 1][0];
    }
  
    // 从 grid[1][1]开始计算每一点的最短路径和，例如计算grid[1][1]该点的最短路径和，仅需比较 dp[0][1] + grid[1][1] 与 dp[1][0] + grid[1][1]
    // 比较两者大小，谁最小则取谁的值
    for (let i = 1; i < row; i++) {
      for (let j = 1; j < col; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + grid[i][j], dp[i][j - 1] + grid[i][j]);
      }
    }
  
    return dp[row - 1][col - 1];
  };
  



