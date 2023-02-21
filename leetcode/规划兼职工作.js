// 你打算利用空闲时间来做兼职工作赚些零花钱。

// 这里有 n 份兼职工作，每份工作预计从 startTime[i] 开始到 endTime[i] 结束，报酬为 profit[i]。

// 给你一份兼职工作表，包含开始时间 startTime，结束时间 endTime 和预计报酬 profit 三个数组，请你计算并返回可以获得的最大报酬。

// 注意，时间上出现重叠的 2 份工作不能同时进行。

// 如果你选择的工作在时间 X 结束，那么你可以立刻进行在时间 X 开始的下一份工作。

var job = (start, end, profit) => {
    let maxProfit = 0
    const get = (pro = 0, idx = 0, startIdx = 0) => {
        if(idx > start.length - 1 || startIdx > start.length - 1) return
        curIndex = start.map((item, index) => {
            if(item >= end[startIdx]) return index
        }).filter(i => i)
        if(curIndex.length) {
            curIndex.forEach(c => {
                const newpro = pro + profit[c]
                maxProfit = Math.max(maxProfit, newpro)
                get(newpro, idx, c)
            })  
        } else {
            maxProfit = Math.max(maxProfit, pro)
            idx++
            get(profit[idx], idx, idx)
        } 
    }
    get(profit[0])
    return maxProfit
}
// startTime = [1,2,3,4,6], endTime = [3,5,10,6,9], profit = [20,20,100,70,60]
// 我们选择第 1，4，5 份工作。 共获得报酬 150 = 20 + 70 + 60。
// startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]  我们选出第 1 份和第 4 份工作， 120
// startTime = [1,1,1], endTime = [2,3,4], profit = [5,6,4] 输出 6

// [6,15,7,11,1,3,16,2] [19,18,19,16,10,8,19,8] [2,9,1,19,5,7,3,19] 41

// [1,2,3,3] [3,4,5,6] [50,10,40,70] => 120
console.log(job([1,2,3,3], [3,4,5,6], [50,10,40,70]))


/**
 * @param {number[]} startTime
 * @param {number[]} endTime
 * @param {number[]} profit
 * @return {number}
 */
 var jobScheduling = function(startTime, endTime, profit) {
    let works = []
    for(let i = 0; i < startTime.length; ++i) {
        works[i] = { startTime: startTime[i], endTime: endTime[i], profit: profit[i] }
    }
    works.sort((a, b) => a.endTime - b.endTime)
    const dp = [0] // 初始第一个虚拟的dp，报酬为0
    for(let i = 1; i < (works.length + 1); ++i) {
        let pre = 0
        for (let j = i - 1; j >= 0; --j){
            // 向前寻找“最近的”“已完成的"兼职工作
            // j === i - 1是不可能走到if循环的 所以一定是i-1前面完成的工作
            if (works[j].endTime <= works[i - 1].startTime) {
                pre = j + 1;
                break; 
            }
        }
        dp[i] = Math.max(dp[i - 1], dp[pre] + works[i - 1].profit)
    }
    return dp.pop()
};

