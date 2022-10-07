# typeof 

TypeScript 中可以使用 typeof 关键字作为类型保护，同样的还存在 instanceof 、 in 等关键字
## 获取对象的结构类型
```
const lolo: Sem = { name: "lolo", age: 5 }
const Message = {
    name: "jimmy",
    age: 18,
    address: {
      province: '四川',
      city: '成都'   
    }
}
type message = typeof Message;
/*
 type message = {
    name: string;
    age: number;
    address: {
        province: string;
        city: string;
    };
}
*/
```
## 获取函数对象的类型
```
function toArray(x: number): Array<number> {
  return [x];
}
type Func = typeof toArray; // -> (x: number) => number[]
```
# keyof
所谓 keyof 关键字代表它接受一个对象类型作为参数，并返回该对象所有 key 值组成的联合类型。该操作符可以用于获取某种类型的所有键，其返回类型是联合类型
## keyof作用于不同的类型

```
interface IProps {
  name: string;
  age: number;
  sex: string;
}

// Keys 类型为 'name' | 'age' | 'sex' 组成的联合类型
type Keys = keyof IProps

interface Person {
  name: string;
  age: number;
}

type K1 = keyof Person; // "name" | "age"
type K2 = keyof Person[]; // "length" | "toString" | "pop" | "push" | "concat" | "join" 
type K3 = keyof { [x: string]: Person };  // string | number
```
## ts中的两种索引类型 --- 数字索引和字符串索引
为了同时支持两种索引类型，就得要求数字索引的返回值必须是字符串索引返回值的子类。其中的原因就是当使用数值索引时，JavaScript 在执行索引操作时，会先把数值索引先转换为字符串索引。所以 keyof { [x: string]: Person } 的结果会返回 string | number。
```
interface StringArray {
  // 字符串索引 -> keyof StringArray => string | number
  [index: string]: string; 
}

interface StringArray1 {
  // 数字索引 -> keyof StringArray1 => number
  [index: number]: string;
}
```

## keyof any 
```
// Keys 类型为 string | number | symbol 组成的联合类型
// any 可以代表任何类型。那么任何类型的 key 都可能为 string 、 number 或者 symbol 。所以自然 keyof any 为 string | number | symbol 的联合类型。
type Keys = keyof any
```
## 实现一个函数，第一个参数是object，第二个参数是object的key
```
function getValueFromKey<T extends object, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
```
## keyof也支持基本数据类型
```
let K1: keyof boolean; // let K1: "valueOf"
let K2: keyof number; // let K2: "toString" | "toFixed" | "toExponential" | ...
let K3: keyof symbol; // let K1: "valueOf"
```
# extends
有时候我们定义的泛型不想过于灵活或者说想继承某些类等，可以通过 extends 关键字添加泛型约束
## 泛型约束
Ts中extends用在继承上，可以表达泛型约束，通过extends关键字可以约束泛型具有某些属性
```
interface Lengthwise {
  length: number
}

// 表示传入的泛型T接受Lengthwise的约束
// T必须实现Lengthwise 换句话说 Lengthwise这个类型是完全可以赋给T
function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length) // OK
  return arg
}
```
我们想要用属性名从对象里获取这个属性。 并且我们想要确保这个属性存在于对象 obj 上

```
function getProperty<T, K extends keyof T> (obj: T, key: K ) {
  return obj[key]
}

let x = {a: 1, b: 2, c: 3, d: 4}

getProperty(x, 'a') // okay
getProperty(x, 'm') // error
```
## extends 还可以用在类型判断语句上
```
type Env<T> = T extends 'production' ? 'production' : 'development';
```

# this

在 TypeScript 函数的参数上同样会存在一个 this 的关键字，假使我们需要为一个函数定义它的 this 类型
在函数的参数上，使用 this 关键字命名，注意这里必须被命名为 this, 同样 this 必须放在函数第一个参数位上。
```
// 我希望函数中的 this 指向 { name:'19Qingfeng' }
type ThisPointer = { name: '19Qingfeng' };
function counter(this: ThisPointer, age: number) {
  console.log(this.name); // 此时TS会推断出this的类型为 ThisPointer
}
```
# new 

new 关键字用在类型上，表示构造函数的类型。ts中 new() 表示构造函数类型
```
class Star {
  constructor() {
    // init somethings
  }
}

// 此时这里的example参数它的类型为 Star 类类型而非实例类型
// 它表示接受一个构造函数 这个构造函数new后会返回Star的实例类型
function counter(example: new () => Star) {
  // do something
}

// 直接传入类
counter(Star)
```
# infer
infer表示在 extends 条件语句中待推断的类型变量，必须联合extends类型出现
infer P表示类型P是一个待推断的类型。(不使用infer直接P会报错)
```
type ParamType<T> = T extends (...args: infer P) => any ? P : T;


interface User {
  name: string;
  age: number;
}

type Func = (user: User) => void;

type Param = ParamType<Func>; // Param = User
type AA = ParamType<string>; // string
```
# is
类型谓词、 is 关键字其实更多用在函数的返回值上，用来表示对于函数返回值的类型保护
```
// 函数的返回值类型中 通过类型谓词 is 来保护返回值的类型
function isNumber(arg: any): arg is number {
  return typeof arg === 'number'
}

function getTypeByVal(val:any) {
  if (isNumber(val)) {
    // 此时由于isNumber函数返回值根据类型谓词的保护
    // 所以可以断定如果 isNumber 返回true 那么传入的参数 val 一定是 number 类型
    val.toFixed()
  }
}
```
# instanceof
```
class NumberObj {
  count: number;
}
function addObj(first: object | NumberObj, second: object | NumberObj) {
  if (first instanceof NumberObj && second instanceof NumberObj) {
    return first.count + second.count;
  }
  return 0;
}
```

# in 
in 用来遍历枚举类型

```
type Keys = "a" | "b" | "c"

type Obj =  {
  [p in Keys]: any
} // -> { a: any, b: any, c: any }
```
