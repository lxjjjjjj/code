/**
 * @param {number[]} nums
 * @return {number[][]}
 * 广度优先遍历
 * 深度优先遍历
 */
//  输入：nums = [1,2,3]
//  输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
 var permute = function(nums) {
    nums.sort((a, b) => a - b)
    const ans = []
    const dfs = (item = []) => {
     if (item.length === nums.length) return ans.push([...item])
   
     nums.forEach(num => {
      if (!item.includes(num)) {
       dfs([...item, num])
      }
     })
    }
    dfs()
    return ans
   };