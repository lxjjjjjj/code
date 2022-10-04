// https://juejin.cn/post/6964726356542226446

// 1.将嵌套循环转化为单循环问题；
// 2.通过指针记录状态，从而优化空间复杂度

// 两数之和 - 给定一个已按照升序排列 的有序数组，找到两个数使得它们相加之和等于目标数。函数应该返回这两个下标值 index1和index2，其中index1 必须小于 index2。
const twoSum = (numbers, target) => {
    const max = numbers.length
    let start = 0
    let end = max -1
    
    while(start< end) {
    const sum = numbers[start] + numbers[end]
    if(sum === target) 
    {
      return [start, end]
    }
    if(sum > target){
      end --
      continue
    }
    if(sum < target) {
      start++
      continue
    }
  } 
}
// 这个文章里的两数之和是第一篇文章的升级版
// 时间复杂度：O（n）
// 空间复杂度: O（1） 比map 更加的高级

// 删除排序数组中的重复项

// 给定一个排序数组，你需要在 原地 删除重复出现的元素，使得每个元素只出现一次，返回移除后数组的新长度。

// 不要使用额外的数组空间，你必须在 原地 修改输入数组 并在使用 O(1) 额外空间的条件下完成。

const removeDuplicates = nums => {
    const max = nums.length
    if (max === 1) {
      return nums
    }
    let slow = 0
    for (let fast = 1; fast < max; fast++) {
      if (nums[fast] !== nums[slow]) {
         slow++
         nums[slow] = nums[fast]
      }
    }
    return slow + 1;
  }
  // 时间复杂度：O（n）
  // 空间复杂度：O（1）