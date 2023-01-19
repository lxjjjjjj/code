// 示例 1：

// 输入：nums = [-1,0,1,2,-1,-4]
// 输出：[[-1,-1,2],[-1,0,1]]
// 解释：
// nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0 。
// nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0 。
// nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0 。
// 不同的三元组是 [-1,0,1] 和 [-1,-1,2] 。
// 注意，输出的顺序和三元组的顺序并不重要。
// 示例 2：

// 输入：nums = [0,1,1]
// 输出：[]
// 解释：唯一可能的三元组和不为 0 。
// 示例 3：

// 输入：nums = [0,0,0]
// 输出：[[0,0,0]]
// 解释：唯一可能的三元组和为 0 。

// 刷题合集 https://xiaochen1024.com/courseware/60b4f11ab1aa91002eb53b18/619640cec1553b002e57bf17

// 1）为了方便去重，我们首先将数组从小到大排列
// 2）对数组进行遍历，取当前遍历的数nums[i]为一个基准数
// 3）在寻找数组中设定两个起点，最左侧的left(i+1)和最右侧的right(length-1)
// 4）判断nums[i] + nums[left] + nums[right]是否等于目标值target
// 5）如果相等，存储该结果，并分别将left和right各移动一位
// 6）如果大于目标值，将right向左移动一位，向结果逼近
// 7）如果小于目标值，将left向右移动一位，向结果逼近
// 8）一轮遍历结束后i++，进入下一轮查询

// 用`双端指针`的方式，将三数之和转化为两数之和
function findThree(arr, target) {
  // 先将数组从小到大排序
  arr.sort((a, b) => a - b))
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    // 跳过重复的arr[i]值, 比如[2, 1, 1],跳过第二个1
    if (i && arr[i] === arr[i - 1]) continue;
    let left = i + 1;
    let right = arr.length - 1;
    
    // 双端指针left、right
    while (left < right) {
      let sum = arr[i] + arr[left] + arr[right];
      if (sum > target) {
        right--;
      } else if (sum < target) {
        left++;
      } else {
        // 先取arr[left]，然后left++, 两步合成一步；arr[right--]同样的逻辑
        result.push([arr[i], arr[left++], arr[right--]]);
        while (arr[left] === arr[left - 1]) {
          // 跳过重复的arr[left]值,
          left++;
        }
        while (arr[right] === arr[right + 1]) {
          // 跳过重复的arr[right]值
          right--;
        }
      }
    }
  }
  return result;
}