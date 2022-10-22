/**
 * @param {number[]} height
 * @return {number}
 */
 var maxArea = function(height) {
    let [l, r, ans] = [0, height.length - 1, 0]

    while (l < r) {
        let [lh, rh] = [height[l], height[r]]
        ans = Math.max(ans, Math.min(lh, rh) * (r - l))

        lh < rh ? l++ : r--
    }

    return ans
};