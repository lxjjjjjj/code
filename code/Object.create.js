
Object.mycreate = function (proto, properties) {
    const result = Object.defineProperties({}, properties )
    result.__proto__ = proto
    return result
};
var hh = Object.mycreate({a: 11}, {mm: {value: 10}});


// new 可以获取到传入对象的原型对象 可以通过原型链继续向上查找

// 但是 Object.create 的 __proto__ 只和 传入的对象 
// 不能拿到传入对象的原型 prototype 

function myNew(){
    const obj = new Object();
    Constructor = Array.prototype.shift.call(arguments);
    obj.__proto__ = Constructor.prototype;
    let ret = Constructor.apply(obj,arguments); // 判断构造函数是否存在返回值
    return typeof ret === 'object'? ret : obj;
}

