function Foo(){
    getName=function(){console.log(1);};
    return this;
}
Foo.getName=function(){console.log(2)};
Foo.prototype.getName=function(){
    console.log(3);
};
var getName=function(){
    console.log(4)
}
function getName(){
    console.log(5)
}
//请写出以下输出结果

// Foo函数上存储的静态属性，是2
Foo.getName();

// 函数表达式覆盖函数声明 因此调用的是被覆盖后的getName函数 所以是4
getName();

// 先执行了Foo函数，然后调用Foo函数的返回值对象的getName属性函数，
// Foo函数的第一句getName=function(){console.log(1)};
// 是一句函数赋值语句，注意它没有var声明，所以先向当前Foo函数作用域内寻找getName变量，
// 没有，再向当前函数作用域上层，即外层作用域内寻找是否含有getName的变量。也就是第二问中的alert(4)函数，
// 将此变量的值赋值为function(){console.log(1)}.
// 此处实际上是将外层作用域内的getName函数修改了。之后Foo函数的返回值是this 此处this指向window对象
// 结果是 1
Foo().getName();

// 直接调用getName函数 相当于window.getName()因为这个变量已经被Foo函数执行时修改了，
// 所以结果和第三问相同，为1，也就是说Foo执行后把全局的getName函数给重写了一次。
getName();

// new Foo.getName();此处考的是js的运算符优先级问题，
// 因为点运算符的优先级高于new操作，所以相当于new (Foo.getName())(),
// 所以实际上将getName函数当构造函数执行，所以弹出2
new Foo.getName();

// new Foo().getName()根据运算符优先级，
// 实际执行为(new Foo()).getName()所以先执行Foo函数，
// Foo此时作为构造函数却有返回值，返回值是this，而this在构造函数中本来就代表当前实例化对象，
// 所以最终Foo函数返回实例化对象。之后调用实例化对象的getName函数，
// 因为在Foo构造函数中没有为实例化对象中添加任何属性。
// 于是当前对象的原型对象中寻找getName，找到了最终输出3
new Foo().getName();

// new new Foo().getName()同样是运算符优先级问题，
// 最终实际执行为new ((new Foo()).getName)(),先初始化Foo实例化对象，
// 然后将其原型上的getName函数作为构造函数再次new 所以最终结果为3
new new Foo().getName();

// 最后整体的输出结果

// 2
// 4
// 1
// 1
// 2
// 3
// 3