// 假设你正在爬楼梯。需要 n 阶你才能到达楼顶。

// 每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？
// 示例 1：

// 输入：n = 2
// 输出：2
// 解释：有两种方法可以爬到楼顶。
// 1. 1 阶 + 1 阶
// 2. 2 阶
// 示例 2：

// 输入：n = 3
// 输出：3
// 解释：有三种方法可以爬到楼顶。
// 1. 1 阶 + 1 阶 + 1 阶
// 2. 1 阶 + 2 阶
// 3. 2 阶 + 1 阶

function step(num) {
    if (n <= 0) {
        return 0
    }
    let time = 0
    function loop(midNum) {
        if(midNum < 0) return 
        if(midNum === 0) {
            time++
            return
        }
        loop(midNum - 1)
        loop(midNum - 2)
    }
    loop(num)
    return time
}
console.log(step(2))
console.log(step(3))

// 思路：手动计算前几次的值，归纳出实际上是斐波那契数列，第一次采用的是基本的斐波那契算法，测试用例能通过大概80%，后面的因为数量级太大导致超时，
// 然后用优化后的递归算法，就是计算之前算出的每一项的值保存起来，把重复计算的问题避免掉。
// 方案：利用对象的唯一性，把计算的值当作对象中的一组键值对存储，当再次的时候查询就可以。

var climbStairs = function(n) {
 var memory = {} ;//利用对象的唯一性，把每一次计算过的值当作对象中的键值对存储起来
    let res = function dp(n) {
        if(n===1 || n===2){
            return n
        }
        if(memory[n-2] ===undefined){
            memory[n-2] = dp(n-2)
        }
        if(memory[n-1] ===undefined){
            memory[n-1] = dp(n-1)
        }
        return memory[n] = memory[n-1] + memory[n-2]
    };
    return res(n)
};

// 理解为走到三层 第一种是直接从一层上去 第二种从二层上去 所以将两种可能加起来就是去第三个台阶的方式
// 同理去第四个台阶 也是1+3 和 2+2的方式


