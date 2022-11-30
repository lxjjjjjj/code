// 一个正整数数组，把数组里所有数字拼接起来排成一个数，打印能拼接出的所有数字中最小的一个

// 如[3, 45, 12]，拼接的最小值为12345

function printMinNumber(arr) {
    if (!arr || arr.length == 0) return null;
    // sort底层是快排
    return arr.sort(compare).join(""); 
  }
  // 找到ab 和 ba 这两种组合的最小值
  function compare(a, b) {
    let front = `${a}${b}`;
    let after = `${b}${a}`;
    return front - after;
  }
  
  let arr = [3, 45, 12];
  console.log(printMinNumber(arr)); // 12345