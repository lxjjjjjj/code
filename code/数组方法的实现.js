// # push
// push接收参数个数无限制，可以是字符串、数值或引用类型
Array.prototype_push = function(){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not array')
    let args = [...arguments]
    let length = args.length
    let arrL = arr.length
    if(length === 0) return arrL
    for(let i = 0; i < length; i++){
        arr[arrL++] = args[i]
    }
    return arrL
}

// # pop
Array.prototype._pop = function(){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not array')
    let length = arr.length
    if(length === 0) return
    let lastItem = arr[length - 1]
    arr[length - 1] = null
    arr.length--
    return lastItem
}

/** unshift
 * 1.接收不限个数的参数
 * 2.获取原数组长度
 * 3.把原数组所有项后移一位
 * 4.遍历参数，每遍历一个参数，数组长度加1，在数组头部添加该参数
 */
 Array.prototype._unshift(){
    let arr = this
    if (!Array.isArray(arr)) throw new Error('not Array')
    let args = [...arguments]
    let length = args.length
    let arrL = arr.length
    if (length === 0) return arrL
    for (let j = arrL; j > 0; j--) {
        // 把所有元素往后移动参数个数位
        arr[j + length - 1] = arr[j - 1]
    }
    // 然后把参数对号入座
    for (let i = 0; i < length; i++) {
        arr[i] = args[i]
        arrL++
    }
    return arrL
 }

/** shift
 * 1.不接受参数
 * 2.把原数组中所有的项向前移一位
 * 3.原数组长度减一
 */
Array.prototype._shift = function (){
    const arr = this
    if(!Array.isArray(arr)){
        throw new Error('not Array')
    }
    if(arr.length === 0) return
    let result = arr[0]
    for(let i = 0; i < arr.length; i++){
        arr[i] = arr[i+1]
    }
    arr.length--
    return result
}

// # concat
/** concat
 * 1. 接收不限个数参数，类型可以是数组或其他类型
 * 2. 获取原数组长度，遍历concat的参数，如果参数是数组则拆开，如果数组中的元素还包括数组，不用一一拆分
 * 3. 每遍历一个，原数组长度加1，并作为索引，将当前元素添加到该索引上,为了完全达到手写目的，
 *    这里不采用push方法，而是for循环遍历赋值，真实环境下肯定是现有push才有concat，所以面试时可以直接用push
 * 4. 不会改变原数组，要用到深拷贝，不调用slice或其他方法，用for
 */  
 Array.prototype._concat = function(){
     let args = [...arguments] //  这里把是array的 和不是 array的 都处理了一下 所以再遍历的时候要考虑处理二维数组
     let arr = this
     if(!Array.isArray(arr)){
         throw new Error('not Array')
     }
     if(args.length === 0) return arr
     let len = arr.length
     let resultArr = []
     for(let n = 0; n < len; n++){
         resultArr[n] = arr[n]
     }
     for(let i = 0; i < args.length; i++){
        if (Array.isArray(args[i])) {
          for (let j = 0; j < args[i].length; j++) {
            resultArr[len++] = args[i][j]
          }
        } else {
          resultArr[len++] = args[i]
        }
     }
     return resultArr
 }

// # isArray
Array.prototype._isArray = function (arr) {
    if(Object.prototype.toString.call(arr) !== '[object Array]'){
        return false
    }
    return true
}

// # indexOf
Array.prototype._indexOf = function(ele, start){
    let arr = this
    if(!Array.isArray(arr)) return new Error('not array')
    if(arr.length === 0) return -1
    let e = ele
    let s = start || 0
    let result = -1
    for(let i = s; i < arr.length; i++){
        if(e === arr[i]){
            result = i
            break
        }
    }
    return result
}

// # join
Array.prototype._join = function(point){
    let arr = this
    let p = point || ','
    if(!Array.isArray(arr)) return new Error('not array')
    let str = ''
    let length = arr.length
    for(let i = 0; i < length; i++){
        if(i === length - 1){
            str += arr[i]
        } else {
            str += arr[i] + p
        }
    }
    return str
}

// # forEach
// 1.接收一个函数参数和一个函数执行作用域的参数（可选），参数函数也接受3个参数，
// 分别是当前项值，当前项索引（可选），当前数组（可选）
// 2.执行参数函数，默认执行环境为window，不返回任何值
Array.prototype._forEach = function (fn, scope) {
  let arr = this
  if (!Array.isArray(arr)) {
    throw new Error('not Array')
  }
  if (typeof fn !== 'function') {
      throw new Error('argument error')
    }
  if (arr.length === 0) return
  let sp = scope || window
  for (let i = 0; i < arr.length; i++) {
    fn.call(sp, arr[i], i, arr)
  }
}

/** map
 * 1.接收一个函数参数和一个函数执行作用域的参数（可选），参数函数也接受3个参数，分别是当前项值，当前项索引（可选），当前数组（可选）
 * 2.执行参数函数，默认执行环境为window，把参数函数返回的结果push到一个新的数组中，最后把这个新的数组返回到外部
 */
Array.prototype._map = function (fn, scope){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not array')
    if(typeof fn !== 'function') throw new Error('argument error')
    if(arr.length === 0) return []
    let sp = scope || window
    let result = []
    for(let i = 0; i < arr.length; i++){
        let back = fn.call(sp, arr[i], i, arr)
        result.push(back)
    }
    return result
}

/** filter
 * 1.接收一个函数参数和一个函数执行作用域的参数（可选），参数函数也接受3个参数，分别是当前项值，当前项索引（可选），当前数组（可选）
 * 2.执行参数函数，默认执行环境为window，把参数函数返回为true的项push到一个新的数组中，最后把这个新的数组返回到外部
 */ 
Array.prototype._filter(fn, scope){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not Array')
    if(typeof fn !=== 'function') throw new Error("fn is not a function")
    let length = arr.length
    if(!length) return []
    let sp = scope || window
    for(let i = 0; i< arr.length; i++){
        let back = fn.call(sp, arr[i], i, arr)
        if(back) {
            result.push(arr[i])
        }
    }
    return result
}

// # every
/**
 * 1. 接收一个函数参数和一个函数执行作用域的参数（可选），参数函数也接受3个参数，分别是当前项值，当前项索引（可选），当前数组（可选）
 * 2. 执行参数函数，默认执行环境为window，如果返回值全为true，最终的every返回true，当有一个返回false时，退出循环，立即返回false 
 */  
Array.prototype._every(fn, scope){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not Array')
    if(typeof fn !=== 'function') throw new Error("fn is not a function")
    let length = arr.length
    if(!length) return false
    let sp = scope || window
    let result = true
    for(let i = 0; i< arr.length; i++){
        let back = fn.call(sp, arr[i], i, arr)
        if(!back) {
            result = false
            break
        }
    }
    return result
}

// # some
/**
 * 1. 接收一个函数参数和一个函数执行作用域的参数（可选），参数函数也接受3个参数，分别是当前项值，当前项索引（可选），当前数组（可选）
 * 2. 执行参数函数，默认执行环境为window，如果返回值有一个为true，退出循环，最终的every返回true，当全部返回false时，最终返回false
 */  
Array.prototype._every(fn, scope){
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not Array')
    if(typeof fn !=== 'function') throw new Error("fn is not a function")
    let length = arr.length
    if(!length) return false
    let sp = scope || window
    let result = false
    for(let i = 0; i< arr.length; i++){
        let back = fn.call(sp, arr[i], i, arr)
        if(back) {
            result = true
            break
        }
    }
    return result
}

// # reduce
Array.prototype.reduce = function(fn, init){
    if (!Array.isArray(this)) {
        throw new Error('not Array')
    }
    if (typeof fn !== 'function') {
        throw new Error('argument error')
    }
    var arr = this
    var total = init || 0
    for (var i = 0; i < arr.length; i++) {
        total = fn(total, arr[i], i, arr)
    }
    return total
}

// # slice
/** slice
 * 1.接收两个参数，第二个参数可选，如果不传第二个参数，默认原数组长度，即一直截取到末尾
 * 2.从第一个参数开始遍历原数组，直到结束位置时结束遍历，把遍历的每一项push到一个新的数组中，返回这个新数组
 * 3.如果第一个参数是负数，则起始位置为数组长度 + 第一个参数。结束位置的下标不能小于或等于起始位置下标，否则返回空数组
 */
Array.prototype._slice = function(start, end){
    let arr = this
    if (!Array.isArray(arr)) {
        throw new Error('not Array')
    }
    if (arr.length === 0) {
        return []
    }
    let s = start
    // 如果开始位置或结束的位置小于零，则从数组末尾项向前数倒数的第几位开始或结束
    if (start < 0) {
        s = start + arr.length
    }
    let e = end || arr.length
    if (end < 0) {
        e = end + arr.length
    }
    // 如果结束的位置比开始的位置小，则直接返回空数组
    if(e < s){
        return []
    }
    let result = []
    for(let i = s; i < e; i++) {
        result.push(arr[i])
    }
    return result
}

// # splice
/** splice
 * 1.有三个功能，删除、替换、插入，根据参数不同来进行操作
 * 2.如果是插入或替换，只需用替换元素长度减去删除的个数即可得出向后移动的位置数，把插入替换的元素在移动出空缺的位置上对号入座；
 *   如果是删除，则从起始下标与删除个数之和作为向前移动的开始下标，向前移动删除个数个位置
 * 3.位置查询，如果第一个参数是正数，则是从前往后执行，如果是负数，则是从后往前执行
 * 4.改变原数组，返回删除的值组成的数组
 */  
Array.prototype._splice = function() {
    let arr = this
    if(!Array.isArray(arr)) throw new Error('not Array')
    if(arguments.length) return []
    let idx // 第一个参数 起始下标
    if(arguments[0] < 0){
        idx = arr.length + arguments[0]
        if(idx < 0) idx = 0
    } else {
        idx = arguments[0]
    }
    let num = arguments[1] // 第二个参数
    let ele = Array.prototype.slice.call(arguments, 2)
    if (num > arr.length - idx) {
        // 如果传入的删除个数大于了起始位置到末尾位置之间元素的个数，最多删除到元素组最后一个元素
        num = arr.length - idx
    }
    let result = []
    for(let i = idx; i < idx + num; i++){
        // 返回要删除的项
        result.push(arr[i])
    }
    if(ele.length > 0){
        // 第三个参数存在，则是插入或替换，插入或替换
        for (let i = arr.length-1, len = ele.length - num; i >= idx; i--) {
          // 从idx开始所有元素向后移len个长度
          if (len < 0) len = 0 // 防止覆盖起始下标之前的元素
          arr[i + len] = arr[i]
        }
        // 从起始位置开始将插入或替换的元素对号入座
        for (let j = 0; j < ele.length; j++) {
          arr[idx++] = ele[j]
        }
    } else {
        // 删除 后面的元素往前移动num个位置
        for(let i = idx; i < arr.length; i++){
            arr[i] = arr[i+num]
        }
        arr.length = arr.length - num
    }
    return result
}

