// 示例 1：

// 输入：x = 123
// 输出：321
// 示例 2：

// 输入：x = -123
// 输出：-321
// 示例 3：

// 输入：x = 120
// 输出：21
// 示例 4：

// 输入：x = 0
// 输出：0


/**
 * @param {number} x
 * @return {number}
 */
 var reverse = function(x) {
    let res = 0;
    let absouteX =  x >= 0 ? x : -x;
    while(absouteX) {
        res = res * 10 + absouteX % 10;
        absouteX = Math.floor(absouteX / 10);
        if(res > Math.pow(2, 31) - 1 || res < Math.pow(-2, 31)) return 0;
    }
    return x < 0 ? -res : res;    
};




