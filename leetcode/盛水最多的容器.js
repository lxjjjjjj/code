/**
 * @param {number[]} height
 * @return {number}
 */
 var maxArea = function(height) {
    let [l, r, ans] = [0, height.length - 1, 0]

    while (l < r) {
        let [lh, lr] = [height[l], height[r]]
        ans = Math.max(ans, Math.min(lh, lr) * (r - l))

        lh < lr ? l++ : r--
    }

    return ans
};