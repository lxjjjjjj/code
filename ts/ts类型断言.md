有时候你会遇到这样的情况，你会比 TypeScript 更了解某个值的详细信息。通常这会发生在你清楚地知道一个实体具有比它现有类型更确切的类型。

# “尖括号” 语法
```
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;
```
# as 语法
```
let someValue: any = "this is a string";
let strLength: number = (someValue as string).length;
```
# 非空断言
在上下文中当类型检查器无法断定类型时，一个新的后缀表达式操作符 ! 可以用于断言操作对象是非 null 和非 undefined 类型。具体而言，x! 将从 x 值域中排除 null 和 undefined 。

## 忽略 undefined 和 null 类型
```
function myFunc(maybeString: string | undefined | null) {
  // Type 'string | null | undefined' is not assignable to type 'string'.
  // Type 'undefined' is not assignable to type 'string'. 
  const onlyString: string = maybeString; // Error
  const ignoreUndefinedAndNull: string = maybeString!; // Ok
}
```
## 调用函数时忽略 undefined 类型
```
type NumGenerator = () => number;

function myFunc(numGenerator: NumGenerator | undefined) {
  // Object is possibly 'undefined'.(2532)
  // Cannot invoke an object which is possibly 'undefined'.(2722)
  const num1 = numGenerator(); // Error
  const num2 = numGenerator!(); //OK
}
```
## 函数返回值的断言
```
const arrayNumber: number[] = [1, 2, 3, 4];
const greaterThan2: number = arrayNumber.find(num => num > 2) as number;
```

# 确定赋值断言
允许在实例属性和变量声明后面放置一个 ! 号，从而告诉 TypeScript 该属性会被明确地赋值。
```
let x: number;
initialize();

// Variable 'x' is used before being assigned.(2454)
console.log(2 * x); // Error
function initialize() {
  x = 10;
}
```

```
let x!: number;
initialize();
console.log(2 * x); // Ok

function initialize() {
  x = 10;
}
```
# 双重类型断言
如果某个类型直接断言成number或者别的类型不可以的话 可以间接绕过ts的检查

xxx as unknown as number