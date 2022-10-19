// 给定一个整数数组 nums 和一个整数目标值 target，
// 请你在该数组中找出 和为目标值 target  的那 两个 整数，并返回它们的数组下标。
// 你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

// nums = [2,7,11,15], target = 9 --- [0,1]
// nums = [3,2,4], target = 6 --- [1,2]
// nums = [3,3], target = 6 --- [0,1]

var twoSum = function(nums, target) {
    const map = new Map()
    for(let i = 0; i < nums.length; i++){
      if(map.has(target - nums[i])){
        return [map.get(target - nums[i]), i]
      }
      map.set(nums[i] , i)
    }
  };

  var twoSum = function(nums, target) {
    //创建空对象obj
      const obj = {}
      // 拿到nums的长度
      const len = nums.length
      // 遍历数组
      for(let i=0;i<len;i++){
        // 可以把target-数组元素的值作为obj的键，不存在则存储，存在就返回键和i
        if(obj[target - nums[i]] !== undefined){
          return [obj[target - nums[i]],i]
        }
        //不存在则将nums[i]的值作为键，i为值
        obj[nums[i]] = i
      }
    };

    // 三数之和 = 0

    var threeSum = function(nums) {
        let ans = [];
        const len = nums.length;
        if(nums == null || len < 3) return ans;
        nums.sort((a, b) => a - b); // 对数组进行升序
        for (let i = 0; i < len; i++) {
            if(nums[i] > 0) break; // 如果当前数字大于0，则三数之和一定大于0，所以结束循环
            if(i > 0 && nums[i] === nums[i-1]) continue; // 去重
            let L = i + 1;
            let R = len-1;
            while(L < R){
                const sum = nums[i] + nums[L] + nums[R];
                if(sum === 0) {
                    ans.push([nums[i],nums[L],nums[R]]);
                    while (L<R && nums[L] === nums[L+1]) L++; // 去重
                    while (L<R && nums[R] === nums[R-1]) R--; // 去重
                    L++;
                    R--;
                }else if (sum < 0) {
                    L++;
                }else if (sum > 0) {
                    R--;
                }
            }
        }        
        return ans;
    };
    
    // 四数之和
    /**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[][]}
 */
var fourSum = function (nums, target) {
    if (nums.length < 4) {
        return [];
    }
    nums.sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < nums.length - 3; i++) {
        // 若与已遍历过的数字相同，避免结果中出现重复的数组
        if (i > 0 && nums[i] === nums[i - 1]) {
            continue;
        }
        // 若当前循环的前四位数字已大于 target
        if (nums[i] + nums[i + 1] + nums[i + 2] + nums[i + 3] > target) {
            break;
        }
        for (let j = i + 1; j < nums.length - 2; j++) {
            // 若与已遍历过的数字相同，避免结果中出现重复的数组
            if (j > i + 1 && nums[j] === nums[j - 1]) {
                continue;
            }
            let left = j + 1,
                right = nums.length - 1;
            while (left < right) {
                const sum = nums[i] + nums[j] + nums[left] + nums[right];
                if (sum === target) {
                    result.push([nums[i], nums[j], nums[left], nums[right]]);
                }
                if (sum <= target) {
                    while (nums[left] === nums[++left]);
                } else {
                    while (nums[right] === nums[--right]);
                }
            }
        }
    }
    return result;
};
