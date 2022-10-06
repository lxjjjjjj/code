# typeof 

TypeScript 中可以使用 typeof 关键字作为类型保护，同样的还存在 instanceof 、 in 等关键字

# keyof
所谓 keyof 关键字代表它接受一个对象类型作为参数，并返回该对象所有 key 值组成的联合类型。
```
interface IProps {
  name: string;
  age: number;
  sex: string;
}

// Keys 类型为 'name' | 'age' | 'sex' 组成的联合类型
type Keys = keyof IProps
```
keyof any 
```
// Keys 类型为 string | number | symbol 组成的联合类型
// any 可以代表任何类型。那么任何类型的 key 都可能为 string 、 number 或者 symbol 。所以自然 keyof any 为 string | number | symbol 的联合类型。
type Keys = keyof any
```
实现一个函数，第一个参数是object，第二个参数是object的key
```
function getValueFromKey<T extends object, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}
```
# extends

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