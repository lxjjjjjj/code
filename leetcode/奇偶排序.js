// 一个整数数组，实现一个函数来调整该数组中数字的顺序，使得所有的奇数位于数组的前半部分，所有的偶数位于数组的后半部分
// 思路: 设定两个指针
// 1）第一个指针start，从数组第一个元素出发，向尾部前进
// 2）第二个指针end，从数组的最后一个元素出发，向头部前进
// 3）start遍历到偶数，end遍历到奇数时，交换两个数的位置
// 4）当start>end时，完成交换

function exchangeOddEven(arr) {
    let start = 0;
    let end = arr.length - 1;
    // 当start > end时，完成交换
    while (start < end) {
      // 找到第一个偶数 判断条件表示这个尾端的数不是奇数
      while (arr[start] % 2 === 1) {
        start++;
      }
      // 找到第一个奇数 判断条件表示这个尾端的数不是偶数
      while (arr[end] % 2 === 0) {
        end--;
      }
      // 重点：始终要加上 start < end的限制，否则会出现中间两个数的位置交换错误
      if (start < end) {
        // 奇数和偶数交换位置
        [arr[start], arr[end]] = [arr[end], arr[start]];
      }
    }
    return arr;
  }
  
  let test = [2, 4, 5, 3, 1];
  console.log(exchangeOddEven(test)); // [1, 3, 5, 4, 2]
  