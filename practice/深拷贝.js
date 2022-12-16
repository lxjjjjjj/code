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
    // 对象和数组的clone
    const keys = type === arrayTag ? undefined : Object.keys(target)
    forEach(keys || target,(value,key)=>{
        if(keys) {
            key = value
        }
        cloneTarget[key] = clone(target[key],map)
    })
    return clonetarget;
}