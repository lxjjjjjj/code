// new	vs Object.create
// new 保留原构造函数属性	Object.create 丢失原构造函数属性
// new 原型链是原构造函数prototype属性	Object.create 原型链是原构造函数本身

// 直接赋值发生的事情

var obj ={ a: 1 }
var b = obj
console.log(obj.a) // 1
console.log(b.a) // 1
b.a = 2
console.log(obj.a) //2

// 使用Object.create发生的事情

var obj ={ a: 1 }
var b = Object.create(obj)
console.log(obj.a) // 1
console.log(b.a) // 1
b.a = 2
console.log(obj.a) //1


