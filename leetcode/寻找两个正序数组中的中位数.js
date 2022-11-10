// 给定两个大小分别为 m 和 n 的正序（从小到大）数组 nums1 和 nums2。请你找出并返回这两个正序数组的 中位数 。

// 算法的时间复杂度应该为 O(log (m+n)) 。

//  

// 示例 1：

// 输入：nums1 = [1,3], nums2 = [2]
// 输出：2.00000
// 解释：合并数组 = [1,2,3] ，中位数 2

// 示例 2：

// 输入：nums1 = [1,2], nums2 = [3,4]
// 输出：2.50000
// 解释：合并数组 = [1,2,3,4] ，中位数 (2 + 3) / 2 = 2.5

function getMid(arr1, arr2){
    let newArr = [], pointerOne = 0, pointerTwo = 0
    while(pointerOne < arr1.length && pointerTwo < arr2.length) {
        if(arr1[pointerOne] < arr2[pointerTwo]) {
            newArr.push(arr1[pointerOne])
            pointerOne++
        } else {
            newArr.push(arr2[pointerTwo])
            pointerTwo++
        }
    }
    while(pointerOne < arr1.length) {
        newArr.push(arr1[pointerOne])
        pointerOne++
    }
    while(pointerTwo < arr2.length) {
        newArr.push(arr2[pointerTwo])
        pointerTwo++
    }
    console.log('newArr', newArr, newArr.length % 2)
    if(newArr.length % 2) {
        return newArr[Math.floor(newArr.length / 2)]
    } else {
        return (newArr[newArr.length / 2] + newArr[newArr.length / 2 - 1]) / 2
    }
}
console.log(getMid([1,3],[2]))
console.log(getMid([1,2],[3,4]))
console.log(getMid([1,2,7,8],[3,4,5,6]))

