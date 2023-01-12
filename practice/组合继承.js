function Parent(...args) {
    this.name = 'Parent name'
    this.args = args
}

Parent.prototype.parentFn = function() {
    console.log('name = ', this.name)
    console.log('args = ', this.args)
}

// 提示 继承props 和 fn

function Child(age, ...args) {
    Parent.call(this, args)
    this.age = age
}
Child.prototype = new Parent()
Child.prototype.constructor = Child
Child.prototype.setAge = function (age)  {
    this.age =  age
}

