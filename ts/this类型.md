# 一个简单的声明this
```
function test(this:{a:number}) {
  const { a } = this;
  console.log(a);
}
test.call({ a: 1 });
```
上述我们在test函数的第一个参数中声明了this的类型，就不会报错。值得注意的是，this必须声明在函数参数声明中的第一个,且this在函数参数中的声明，不作为形参和实参，因此以下两种方式都是错误的

**this没有在函数第一个参数中声明**
```
function test(b: number, this: { a: number }) {
  const {a} = this;
  console.log(a);
}
test.call({ a: 1 });// error A 'this' parameter must be the first parameter. TS2680

```
**错误的调用了this声明的函数**
```
function test(this: { a: number }) {
  const {a} = this;
  console.log(a);
}
test({ a: 1 }); // 直接以传参数的形式调用test，Expected 0 arguments, but got 1.  TS2554

```
# 回调函数中this声明

```
interface UIElement {
  addClickListener(onclick: (this: void, e: Event) => void): void;
}
class Handler {
  info: string;
  onClickBad(this: Handler, e: Event) {
    // oops, used `this` here. using this callback would crash at runtime
    this.info = e.message;
  }
}
const uiElement: UIElement = {
  addClickListener: () => {},
};
const h = new Handler('hello');
uiElement.addClickListener(h.onClickBad); // error Argument of type '(this: Handler, e: Event) => void' is not assignable to parameter of type '(this: void, e: Event) => void'.
  The 'this' types of each signature are incompatible.
    Type 'void' is not assignable to type 'Handler'.  TS2345
```
上述的例子中，在uiElement.addClickListener(h.onClickBad)中会报错，因为uiElement.addClickListener接受回调函数作为参数，该回调函数中的this的定义是void，而h.onClickBad这个函数真实的this定义是Handler。

# Typescript中箭头函数和this声明
抛开this声明，仅仅考虑this的话，typescript中箭头函数的this和ES6中箭头函数中的this是一致的。箭头函数中的this，指向定义该函数时的那个对象。typescript规定，箭头函数不需要声明this的类型
```
function test(this: { a: number }) {
  const b = () => {
    console.log(this);
  };
  b();
}
test.call({ a: 6 }); // 输出this为{a:6}

function test(this: { a: number }) {
  const b = (this:{a:number}) => {
    console.log(this);
  };
  b();
}
test.call({ a: 6 }); // ts error An arrow function cannot have a 'this' parameter

```
# Typescript与this相关的内置函数

## ThisParameterType
ThisParameter接受一个Type作为范型函数，这个Type必须是函数的类型，最后返回的是该函数中this的类型。

```
function test(this: number) {}
const n: ThisParameterType<typeof test> = 1;
//不会报错 ThisParameterType<typeof test> 最后的类型就是number
拿到就是test函数中this声明的这个number类型。
```
## OmitThisParameter
OmitThisParameter是移除type类型中this声明的类型 。
```
function test(this: number) {}
const t: OmitThisParameter<typeof test> = test.bind(1);
t();
```
## ThisType
通过 ThisType 我们可以在对象字面量中键入 this，并提供通过上下文类型控制 this 类型的便捷方式。它只有在 --noImplicitThis 的选项下才有效。默认情况下，如果ts没有this对象类型声明，this是自动隐式定义。如果noImplicitThis设置为true,此时不允许this上下文隐式定义，如果使用了没有声明过的this对象就会报错，举例来说(当设置noImplicitThis：true)。ThisType一般用于字面量对象中,用于定义字面量对象的this。这里myCustomObj这个对象字面量类型中的this为Point,因此在myCustomObj这个对象内部使用this.x是类型安全的。
```
interface Point {
    x: number;
    y: number;
   }
const myCustomObj: ThisType<Point> = {
    moveRight() {
        this.x++;
    },
    moveLeft() {
        this.x++;
    }
}

```
