
/**
 * @description 用最精炼的代码实现数组非零最小值 index
 * @param {array} arr 数组
 * @returns {number} index 索引
 */
function getIndex(arr) {
      let index = -1;
      const minVal = arr.reduce((cur, pre) => {
            return (cur <= 0 || pre <= 0) ? Math.max(cur, pre) : cur > pre ? pre : cur;
      }, -1);
      index = arr.findIndex(item => item == minVal && minVal > 0)
      return index;
}
