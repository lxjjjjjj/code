在ES5中，顶层对象的属性和全局变量是等价的，var 命令和 function 命令声明的全局变量，自然也是顶层对象。

var a = 12;
function f(){};

console.log(window.a); // 12
console.log(window.f); // f(){}
但ES6规定，var 命令和 function 命令声明的全局变量，依旧是顶层对象的属性，但 let命令、const命令、class命令声明的全局变量，不属于顶层对象的属性。

let aa = 1;
const bb = 2;

console.log(window.aa); // undefined
console.log(window.bb); // undefined
在哪里？怎么获取？通过在设置断点，看看浏览器是怎么处理的：

let and const

通过上图也可以看到，在全局作用域中，用 let 和 const 声明的全局变量并没有在全局对象中，只是一个块级作用域（Script）中

怎么获取？在定义变量的块级作用域中就能获取啊，既然不属于顶层对象，那就不加 window（global）呗。

let aa = 1;
const bb = 2;

console.log(aa); // 1
console.log(bb); // 2
funlee, 1511578084, ycwsurmount, hgrourou, zwmmm, mengsixing, dcy0701, xszi, zouyifeng, Hellowor1d, and 146 more reacted with thumbs up emoji
xuwentao93 reacted with thumbs down emoji
coveyz, liunanchenFYJJ, ItemLxL, blly5, jkhll, vuehl, Gourdbaby, i