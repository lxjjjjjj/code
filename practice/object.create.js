Object.mycreate = function (proto, properties) {
    const result = Object.defineProperties({}, properties )
    result.__proto__ = proto
    return result
};

// Object.create 会使对象失去原型