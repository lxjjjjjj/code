// [2,2,3,7] target 7
function sum (arr, target) {
    
    let res = []
    
    const dfs = (target, c, idx) => {
        if (idx === arr.length) return
        if (target === 0) {
            res.push(c)
            return
        }
        
        dfs(target, c, idx + 1)
        
        if (target - arr[idx] >= 0) {
            dfs(target - arr[idx], [arr[idx], ...c], idx)
        }
    }
    
    dfs(target, [], 0)
    
    return res
}
console.log(sum([2,2,3,7], 7))