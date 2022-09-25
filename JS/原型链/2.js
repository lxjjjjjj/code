// 在chrome中可以通过__proto__的形式，或者在ES6中可以通过Object.getPrototypeOf的形式。
Function.__proto__ == Object.prototype //false
Function.__proto__ == Function.prototype//true
// Function的原型也是Function。