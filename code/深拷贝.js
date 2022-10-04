// 1、对象中有字段值为undefined，转换后则会直接字段消失
// 2、对象如果有字段值为RegExp对象，转换后则字段值会变成{}
// 3、对象如果有字段值为NaN、+-Infinity，转换后则字段值变成null
// 4、对象如果有环引用，转换直接报错
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
