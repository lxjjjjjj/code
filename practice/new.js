function myNew() {
    const obj = new Object();
    Constructor = Array.prototype.shift.call(arguments);
    obj.__proto__ = Constructor.prototype
    let ret = Constructor.apply(obj,arguments);
    return typeof ret === 'object' ? ret : obj
}