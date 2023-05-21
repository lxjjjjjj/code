// 使用JSON.parse(JSON.stringify())有以下缺点
// 1、对象中有字段值为undefined，转换后则会直接字段消失
// 2、对象如果有字段值为RegExp对象，转换后则字段值会变成{}
// 3、对象如果有字段值为NaN、+-Infinity，转换后则字段值变成null
// 4、对象如果有环引用，转换直接报错

// [深拷贝很全的文章](https://juejin.cn/post/6844903929705136141#heading-4)
// # 注意事项

// 1.数组
// 2.循环引用
// 3.性能优化
// 4.map set 等其他数据类型

// ## 处理数组


function copyArray(source, array) {
  let index = -1
  const length = source.length

  array || (array = new Array(length))
  while (++index < length) {
    array[index] = source[index]
  }
  return array
}


// ## 处理循环引用

// 额外开辟一个存储空间，来存储当前对象和拷贝对象的对应关系，当需要拷贝当前对象时，先去存储空间中找，有没有拷贝过这个对象，如果有的话直接返回，如果没有的话继续拷贝，这样就巧妙化解的循环引用的问题。

// 这个存储空间，需要可以存储key-value形式的数据，且key可以是一个引用类型，我们可以选择Map这种数据结构：

// - 检查map中有无克隆过的对象
// - 有 直接返回
// - 没有 将当前对象作为key，克隆对象作为value进行存储，继续克隆
// - 使用map是因为map可以把一个引用值当作key或者value


function clone(target, map = new Map()) {
    if (typeof target === 'object') {
        let cloneTarget = Array.isArray(target) ? [] : {};
        if (map.get(target)) {
            return map.get(target);
        }
        map.set(target, cloneTarget);
        for (const key in target) {
            cloneTarget[key] = clone(target[key], map);
        }
        return cloneTarget;
    } else {
        return target;
    }
};

function clone(target, map = new WeakMap()) {
    if (typeof target === 'object') {
        const cloneTarget = Array.isArray(target) ? [] : {}
        if (map.get(target)) return map.get(target)
        map.set(target, cloneTarget)
        for (const key in target) {
            cloneTarget[key] = clone(target[key], map)
        }
        return cloneTarget;
    } else {
        return target
    }
}

// ## 性能优化

// ### 使用weakMap替代Map
// 一个对象若只被弱引用所引用，则被认为是不可访问（或弱可访问）的，并因此可能在任何时刻被回收。

// 举例子

// 果我们使用Map的话，那么对象间是存在强引用关系的：

// let obj = { name : 'ConardLi'}
// const target = new Map();
// target.set(obj,'code秘密花园');
// obj = null;

// 虽然我们手动将obj，进行释放，然是target依然对obj存在强引用关系，所以这部分内存依然无法被释放。

// 再来看WeakMap：
// let obj = { name : 'ConardLi'}
// const target = new WeakMap();
// target.set(obj,'code秘密花园');
// obj = null;

// 如果是WeakMap的话，target和obj存在的就是弱引用关系，当下一次垃圾回收机制执行时，这块内存就会被释放掉。


// for in 和 while 和 for
// while循环最快，因此我们使用while写循环

// 当遍历数组时，直接使用forEach进行遍历，当遍历对象时，使用Object.keys取出所有的key进行遍历，然后在遍历时把forEach会调函数的value当作key使用


function forEach(array, iteratee) {
    let index = -1;
    const length = array.length;
    while (++index < length) {
        iteratee(array[index], index);
    }
    return array;
}


function clone(target, map = new WeakMap()) {
    if (typeof target === 'object') {
        const isArray = Array.isArray(target);
        let cloneTarget = isArray ? [] : {};

        if (map.get(target)) {
            return map.get(target);
        }
        map.set(target, cloneTarget);

        const keys = isArray ? undefined : Object.keys(target);
        forEach(keys || target, (value, key) => {
            if (keys) {
                key = value;
            }
            cloneTarget[key] = clone2(target[key], map);
        });

        return cloneTarget;
    } else {
        return target;
    }
}

// ## map set function 其他数据类型

// ### 合理判断引用类型


function isObject(target) {
    const type = typeof target;
    return target !== null && (type === 'object' || type === 'function');
}

// ### 获取数据类型



function getType(target) {
    return Object.prototype.toString.call(target);
}

// [link](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/1/16ce893dc0828b6a~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)

// ### 常用遍历类型

const mapTag = '[object Map]';
const setTag = '[object Set]';
const arrayTag = '[object Array]';
const objectTag = '[object Object]';

const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const numberTag = '[object Number]';
const regexpTag = '[object RegExp]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const mapTag = '[object Map]'
const setTag = '[object Set]'
const weakMapTag = '[object WeakMap]'

// 在上面的集中类型中，我们简单将他们分为两类：

// - 可以继续遍历的类型
// - 不可以继续遍历的类型
// 分别为它们做不同的拷贝。

// ### 可继续遍历的类型

// 这里考虑 object、array、Map，Set

// 使用const target = new Object()的原因

// - 使用了原对象的构造方法，所以它可以保留对象原型上的数据，
// - 如果直接使用普通的{}，那么原型必然是丢失了的。


function getInit(target) {
    const Ctor = target.constructor;
    return new Ctor();
}

// 最后的代码



function clone(target, map = new WeakMap()) {

    // 克隆原始类型
    if (!isObject(target)) {
        return target;
    }

    // 初始化
    const type = getType(target);
    let cloneTarget;
    if (deepTag.includes(type)) {
        cloneTarget = getInit(target, type);
    }

    // 防止循环引用
    if (map.get(target)) {
        return map.get(target);
    }
    map.set(target, cloneTarget);

    // 克隆set
    if (type === setTag) {
        target.forEach(value => {
            cloneTarget.add(clone(value,map));
        });
        return cloneTarget;
    }

    // 克隆map
    if (type === mapTag) {
        target.forEach((value, key) => {
            cloneTarget.set(key, clone(value,map));
        });
        return cloneTarget;
    }

    // 克隆对象和数组
    const keys = type === arrayTag ? undefined : Object.keys(target);
    forEach(keys || target, (value, key) => {
        if (keys) {
            key = value;
        }
        cloneTarget[key] = clone(target[key], map);
    });

    return cloneTarget;
}


// ### 不可继续遍历的类型
// Bool、Number、String、String、Date、Error这几种类型我们都可以直接用构造函数和原始数据创建一个新对象：


function cloneOtherType(targe, type) {
    const Ctor = targe.constructor;
    switch (type) {
        case boolTag:
        case numberTag:
        case stringTag:
        case errorTag:
        case dateTag:
            return new Ctor(targe);
        case regexpTag:
            return cloneReg(targe);
        case symbolTag:
            return cloneSymbol(targe);
        default:
            return null;
    }
}

// #### symbol类型


function cloneSymbol(targe) {
    return Object(Symbol.prototype.valueOf.call(targe));
}

// #### 克隆正则

// [克隆正则的解释](https://juejin.cn/post/6844903775384125448)


function cloneReg(targe) {
    const reFlags = /\w*$/;
    const result = new targe.constructor(targe.source, reFlags.exec(targe));
    result.lastIndex = targe.lastIndex;
    return result;
}

// #### 克隆函数

// 我把克隆函数单独拎出来了，实际上克隆函数是没有实际应用场景的，两个对象使用一个在内存中处于同一个地址的函数也是没有任何问题的，我特意看了下lodash对函数的处理


 const isFunc = typeof value == 'function'
 if (isFunc || !cloneableTags[tag]) {
        return object ? value : {}
 }

// 我们可以通过prototype来区分下箭头函数和普通函数，箭头函数是没有prototype的。
// 我们可以直接使用eval和函数字符串来重新生成一个箭头函数，注意这种方法是不适用于普通函数的。
// 我们可以使用正则来处理普通函数：
// 分别使用正则取出函数体和函数参数，然后使用new Function ([arg1[, arg2[, ...argN]],] functionBody)构造函数重新构造一个新的函数：


// #### 正则知识补充


// i  不区分大小写匹配
// /abc/i 可以匹配abc、aBC、Abc

// g 全局匹配 只匹配一行

// m 多行匹配 当有\n换行存在且有^和$的情况下，全局匹配

// s 匹配特殊字符 . 或者换行符

// 问号 (?) 匹配前面的字符 0 次或 1 次。

// 例如，10? 可以匹配：

// 1
// 10

// 加号 (+) 匹配前面的字符 1 次或多次。

// 例如，10+ 可以匹配：

// 10
// 100
// 1000
// 等等

// 星号 (*)
// 星号 (*) 匹配前面的字符 0 次或多次。

// 例如，10* 可以匹配：

// 1
// 10
// 100
// 1000
// 等等

// (?<={) 表示匹配以{开头的字符串并且存储起来
// (?=}) 表示匹配以}结尾的字符串并且存储起来

// .（小数点）默认匹配除换行符之外的任何单个字符。
// 例如，/.n/ 将会匹配 "nay, an apple is on the tree" 中的 'an' 和 'on'，但是不会匹配 'nay'。

// (.|\n) 匹配任何字符和换行符

// + 匹配多个

// (?<=\() 匹配以(开头的
// (?=\)\s+{) 匹配以') {'结尾的 ()和{中间有空格)

// \s 匹配一个空白字符，包括空格、制表符、换页符和换行符

// /\s\w*/ 匹配"foo bar."中的' bar'。

// \w 匹配一个单字字符（字母、数字或者下划线）。等价于 [A-Za-z0-9_]




function cloneFunction(func) {
    const bodyReg = /(?<={)(.|\n)+(?=})/m;
    const paramReg = /(?<=\().+(?=\)\s+{)/;
    const funcString = func.toString();
    if (func.prototype) {
        console.log('普通函数');
        const param = paramReg.exec(funcString);
        const body = bodyReg.exec(funcString);
        if (body) {
            console.log('匹配到函数体：', body[0]);
            if (param) {
                const paramArr = param[0].split(',');
                console.log('匹配到参数：', paramArr);
                return new Function(...paramArr, body[0]);
            } else {
                return new Function(body[0]);
            }
        } else {
            return null;
        }
    } else {
        return eval(funcString);
    }
}

// # 最后代码

// [link](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/1/16ce893e6ec12377~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)


const mapTag = '[object Map]'
const setTag = '[object Set]'
const arrayTag = '[object Array]'
const objectTag = '[object Object]'
const argsTag = '[object Arguments]'

const boolTag = '[object Boolean]'
const dateTag = '[object Date]'
const numberTag = '[object Number]'
const stringTag = '[object String]'
const symbolTag = '[object Symbol]'
const errorTag = '[object Error]'
const regexpTag = '[object RegExp]'
const funcTag = '[object Function]'

const deepTag = [mapTag, setTag, arrayTag, objectTag, argsTag]
function getType(obj) {
    return Object.prototype.toString.call(obj)
}
function forEach(array,iteratee) {
    let index = -1
    const length = array.length
    while(++index < length){
        iteratee(array[index],index)
    }
    return array
}
function isObject(target) {
    const type = typeof target;
    return target !== null && (type === 'object' || type === 'function')
}
function getInit(target) {
    const Ctor = target.constructor
    return new Ctor()
}
function cloneFunction(func){
    const bodyReg = /(?<={)(.|\n)(?=})/m;
    const paramReg = /(?<=\().+(?=\)\s+{)/;
    const funcString = func.toString()
    if(func.prototype){
        const body = funcString.exec(bodyReg)
        const param = funcString.exec(paramReg)
        if(body){
           if(param) {
               const paramArr = param[0].split(',')
               return new Function(...paramArr,body[0])
           } else {
               return new Function(body[0])
           }
        }else {
            return null
        }
    }else{
        return eval(funcString)
    }
    
}
function cloneOtherType(target, type) {
    const Ctor = target.constructor
    switch(type) {
        case boolTag:
        case numberTag:
        case stringTag:
        case errorTag:
        case dateTag:
            return new Ctor(target)
        case regexpTag:
            return cloneReg(target)
        case symboltag:
            return cloneSymbol(target)
        case funcTag:
            return cloneFunction(target)
        default:
            return null
    }
}
function cloneSymbol(target) {
    return Object(Symbol.prototype.valueOf.call(target))
}
function cloneReg(target){
    const reflags = /\w*$/
    const result = new target.constructor(target.source,reflags.exec(target))
    result.lastIndex = target.lastIndex
    return result;
}
function clone(target, map = new WeakMap()) {
    if(!isObject(target)){
        return target
    }
    const type = getType(target)
    let cloneTarget;
    if(deepTag.includes(type)) {
        cloneTarget = getInit(target)
    } else {
        return cloneOtherType(target, type)
    }
    if(map.get(target)) {
        return target
    }
    map.set(target, clonetarget)
    if(type === setTag){
        target.forEach(value=>{
            cloneTarget.add(clone(value))
        });
        return cloneTarget
    }
    if(type === mapTag) {
        target.forEach((value, key) => {
        cloneTarget.set(key, clone(value))
        })
        return clonetarget
    }
    const keys = type === arrayTag ? undefined : Object.keys(target)
    forEach(keys || target,(value,key)=>{
        if(keys) {
            key = value
        }
        cloneTarget[key] = clone(target[key],map)
    })
    return clonetarget;
}
