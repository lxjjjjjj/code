// extend 关键字实际上是在 Rabbit.prototype 添加 [Prototype]]，引用到 Animal.prototype。

// 每个方法都会在内部 [[HomeObject]] 属性中记住它的对象。然后 super 使用它来解析原型。

// 在类和普通对象中定义的方法中都定义了 [[HomeObject]]

// 但是对于对象，必须使用：method() 而不是 "method: function()"。