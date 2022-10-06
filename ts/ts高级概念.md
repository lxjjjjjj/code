# 条件类型
其实所谓的条件类型就是这么简单，看起来和三元表达式非常相似，甚至你完全可以将它理解成为三元表达式。只不过它接受的是类型以及判断的是类型而已。这里的 T extends string 更像是一种判断泛型 T 是否满足 string 的判断，和之前所讲的泛型约束完全不是同一个意思。其次，需要注意的是条件类型 a extends b ? c : d 仅仅支持在 type 关键字中使用。
```
type isString<T> = T extends string ? true : false;

// a 的类型为 true
let a: isString<'a'>

// b 的类型为 false
let b: isString<1>;
```
# 分发

```
type GetSomeType<T extends string | number> = T extends string ? 'a' : 'b';

let someTypeOne: GetSomeType<string> // someTypeone 类型为 'a'

let someTypeTwo: GetSomeType<number> // someTypeone 类型为 'b'

let someTypeThree: GetSomeType<string | number>; // what ?  someTypeThree 的类型竟然被推导成为了 'a' | 'b' 组成的联合类型
```
其实这就是分发在捣鬼，使用 GetSomeType 你可以传入n个类型组成的联合类型作为泛型参数，同理它会进行进入 GetSomeType 类型中进行 n 次分发判断。自然我们就得到的 someTypeThree 类型为 "a" | "b" 。

## 产生分发的条件

* 首先，毫无疑问分发一定是需要产生在 extends 产生的类型条件判断中，并且是前置类型。（比如T extends string | number ? 'a' : 'b'; 那么此时，产生分发效果的也只有 extends 关键字前的 T 类型，string | number 仅仅代表一种条件判断。）
* 其次，分发一定是要满足联合类型，只有联合类型才会产生分发（其他类型无法产生分发的效果，比如 & 交集中等等）。
* 最后，分发一定要满足所谓的裸类型中才会产生效果。
  
裸类型的解释
```
// 此时的T并不是一个单独的”裸类型“T 而是 [T]
type GetSomeType<T extends string | number | [string]> = [T] extends string[]
  ? 'a'
  : 'b';

// 即使我们修改了对应的类型判断，仍然不会产生所谓的分发效果。因为[T]并不是一个裸类型
// 只会产生一次判断  [string] | number extends string[]  ? 'a' : 'b'
// someTypeThree 仍然只有 'b' 类型 ，如果进行了分发的话那么应该是 'a' | 'b'
let someTypeThree: GetSomeType<[string] | number>;
```
# 循环
```
interface IProps {
  name: string;
  age: number;
  highSchool: string;
  university: string;
}

// IPropsKey类型为
// type IPropsKey = {
//  name: boolean;
//  age: boolean;
//  highSchool: boolean;
//  university: boolean;
//  }
type IPropsKey = { [K in keyof IProps]: boolean };
// 只能在type中使用不能在interface中使用
```
# 逆变
```
let a!: { a: string; b: number };
let b!: { a: string };

b = a // 正确，被允许

let fn1!: (a: string, b: number) => void;
let fn2!: (a: string, b: number, c: boolean) => void;

fn1 = fn2; // TS Error: 不能将fn2的类型赋值给fn1
fn2 = fn1; // 正确，被允许
```
就比如上述函数的参数类型赋值就被称为逆变，参数少（父）的可以赋给参数多（子）的那一个。看起来和类型兼容性（多的可以赋给少的）相反，但是通过调用的角度来考虑的话恰恰满足多的可以赋给少的兼容性原则。

```
class Parent {}

// Son继承了Parent 并且比parent多了一个实例属性 name
class Son extends Parent {
  public name: string = '19Qingfeng';
}

// GrandSon继承了Son 在Son的基础上额外多了一个age属性
class Grandson extends Son {
  public age: number = 3;
}

// 分别创建父子实例
const son = new Son();

function someThing(cb: (param: Son) => any) {
  // do some someThing
  // 注意：这里调用函数的时候传入的实参是Son
  cb(Son);
}

someThing((param: Grandson) => param); // error
someThing((param: Parent) => param); // correct
```
```
class Parent {}

// Son继承了Parent 并且比parent多了一个实例属性 name
class Son extends Parent {
  public name: string = '19Qingfeng';
}

// GrandSon继承了Son 在Son的基础上额外多了一个age属性
class Grandson extends Son {
  public age: number = 3;
}

// 分别创建父子实例
const son = new Son();

function someThing(cb: (param: Son) => any) {
  // do some someThing
  // 注意：这里调用函数的时候传入的实参是Son
  cb(Son);
}

someThing((param: Grandson) => param); // error
someThing((param: Parent) => param); // correct
```

# 协变
函数类型赋值兼容时函数的返回值就是典型的协变场景
```
let fn1!: (a: string, b: number) => string;
let fn2!: (a: string, b: number) => string | number | boolean;

fn2 = fn1; // correct 
fn1 = fn2 // error: 不可以将 string|number|boolean 赋给 string 类型
```