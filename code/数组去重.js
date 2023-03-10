/**
  * 2. 数组去重
  * 
  * @example
  * [1,'1',1]                            -> [1,'1']
  * [{a: 1}, {b: 1}, {a: 1}]             -> [{a: 1}, {b: 1}]
  * [{a: 1, b: 2}, {b: 1}, {b: 2, a: 1}] -> [{a: 1, b: 2}, {b: 1}]
  * [[1, {a: 1}], [2], [3], [1, {a: 1}]] -> [[1, {a: 1}], [2], [3]]
  */
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]'
}
function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}
function contrastArray(arr1, arr2) {
  if(arr1.length !== arr2.length) return false
  let resIndex = 0
  for(let i = 0; i < arr1.length; i++) {
    let arrIndex = 0
    for(let j = 0; j < arr2.length; j++) {
      if(typeof arr1[i] !== typeof arr2[j]) {
        arrIndex++
      } else {
        if(isObject(arr1[i]) && isObject(arr2[j])) {
          if(!contrastObject(arr1[i], arr2[j])) {
            arrIndex++
          }
        }
        if(isArray(arr1[i]) && isArray(arr2[j])) {
          if(!contrastArray(arr1[i], arr2[j])) {
            arrIndex++
          }
        }
        if(isBasic(arr1[i], arr2[j]) && arr1[i] !== arr2[j]) {
          arrIndex++
        }
      }
    }
    if(arrIndex === arr2.length - 1) {
      resIndex++
    }
  }
  return resIndex === arr1.length
}
function contrastObject(obj1, obj2) {
  if(Object.keys(obj1).length !== Object.keys(obj2).length) return false
  let res = true
  Object.keys(obj1).forEach(key => {
    if(typeof obj1[key] !== typeof obj2[key]) {
      res = false
    } else {
      if(isObject(obj1[key]) && isObject(obj2[key])) {
        if(!contrastObject(obj1[key], obj2[key])) {
          res = false
        }
      }
      if(isArray(obj1[key]) && isArray(obj2[key])) {
        if(!contrastArray(obj1[key], obj2[key])){
          res = false
        }
      }
    }
  })
  return res
}
function isBasic(a, b) {
  return !isObject(a) && !isObject(b) && !isArray(a) && !isArray(b)
}
function unique(arr) {
  const result = []
  for(let i = 0; i < arr.length; i++) {
    let uniqueIndex = 0
    for(let j = i+1; j < arr.length; j++) {
      if (typeof arr[i] !== typeof arr[j]) {
        uniqueIndex++
      } else {
        if (isArray(arr[i]) && isArray(arr[j])) {
          if(!contrastArray(arr[i], arr[j])) {
            uniqueIndex++
          }
        } 
        if (isObject(arr[i]) && isObject(arr[j])) {
          if(!contrastObject(arr[i], arr[j])) {
            uniqueIndex++
          }
        }
        if(isBasic(arr[i], arr[j]) && arr[i] !== arr[j]) {
          uniqueIndex++
        }
      }
    }
    if(uniqueIndex === arr.length - 1 - i) {
      result.push(arr[i])
    }
  } 
  return result
}

// console.log(unique([1, '1', 1]));
// console.log(unique([{ a: 1 }, { b: 1 }, { a: 1 }]));
// console.log(unique([{ a: 1, b: 2 }, { b: 1 }, { b: 2, a: 1 }]));
console.log(unique([[1, { a: 1 }], [2], [3], [1, { a: 1 }]]));


