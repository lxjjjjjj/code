/**
  * 2. 数组去重
  * 
  * @example
  * [1,'1',1]                            -> [1,'1']
  * [{a: 1}, {b: 1}, {a: 1}]             -> [{a: 1}, {b: 1}]
  * [{a: 1, b: 2}, {b: 1}, {b: 2, a: 1}] -> [{a: 1, b: 2}, {b: 1}]
  * [[1, {a: 1}], [2], [3], [1, {a: 1}]] -> [[1, {a: 1}], [2], [3]]
  */
 function unique(arr) {
    return Array.from(new Set(arr))
}

// console.log(unique([1, '1', 1]));
// console.log(unique([{ a: 1 }, { b: 1 }, { a: 1 }]));
// console.log(unique([{ a: 1, b: 2 }, { b: 1 }, { b: 2, a: 1 }]));
// console.log(unique([[1, { a: 1 }], [2], [3], [1, { a: 1 }]]));


