// [2,3,6,7] target 7 [[2,2,3],[7]] 
// [2,4,7] target 8
function sum (arr, target) {
    
    let res = []
    
    const dfs = (target, c, idx) => {
        if (idx === arr.length) return
        if (target === 0) {
            res.push(c)
            return
        }
        // 不用自己
        dfs(target, c, idx + 1)
        
        // 用自己 每次都是重复去看
        if (target - arr[idx] >= 0) {
            dfs(target - arr[idx], [arr[idx], ...c], idx)
        }
    }
    
    dfs(target, [], 0)
    
    return res
}
// console.log(sum([2,2,3,7], 7))
console.log(sum([2,4,7], 8))