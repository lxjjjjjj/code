/**
 * @file 合并两个有序数组
 */

 function merge(arr, arr2){
	let p1 = 0, p2 = 0
	const res = []
	while(p1 < arr.length && p2 < arr.length) {
		if(arr[p1] < arr2[p2]) {
			res.push(arr[p1])
			p1++
		} else {
			res.push(arr2[p2])
			p2++
		}
	}
	while(p1 < arr.length) {
		res.push(arr[p1])
		p1++
	}
	while(p2 < arr2.length) {
		res.push(arr2[p2])
		p2++
	}
	return res
}

// 参数数组从小到大排列
console.log(merge([1, 2, 3], [2, 5, 6])) // [ 1, 2, 2, 3, 5, 6 ]
