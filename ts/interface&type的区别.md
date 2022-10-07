# Objects/Functions ---- 相同点
接口
```
interface Point {
  x: number;
  y: number;
}

interface SetPoint {
  (x: number, y: number): void;
}
```
类型别名
```
type Point = {
  x: number;
  y: number;
};

type SetPoint = (x: number, y: number) => void;
```
# Other Types

1、类型别名更通用（接口只能声明对象，不能重命名基本类型），类型别名的右边可以是任何类型，包括基本类型、元祖、类型表达式（&或|等类型运算符）；而在接口声明中，右边必须为结构。例如，下面的类型别名就不能转换成接口。
```
type A = number
type B = A | string
// tuple
type Data = [number, string];
```
2、扩展时表现不同
```
interface A {
    good(x: number): string,
    bad(x: number): string
}
interface B extends A {
    good(x: string | number) : string,
    bad(x: number): number // Interface 'B' incorrectly extends interface 'A'.
   // Types of property 'bad' are incompatible.
   // Type '(x: number) => number' is not assignable to type '(x: number) => string'.
   // Type 'number' is not assignable to type 'string'.
}

但使用交集类型时则不会出现这种情况。我们将上述代码中的接口改写成类型别名，把 extends 换成交集运算符 &，TS将尽其所能把扩展和被扩展的类型组合在一起，而不会抛出编译时错误。

type A = {
    good(x: number): string,
    bad(x: number): string
}
type B = A & {
     good(x: string | number) : string,
     bad(x: number): number 
}

```
# Extend --- 都可以扩展是相同点 不同点是type的扩展是&实现，interface使用extends扩展
接口和类型别名都能够被扩展，但语法有所不同。此外，接口和类型别名不是互斥的。接口可以扩展类型别名，而反过来是不行的。

## Interface extends interface
```
interface PartialPointX { x: number; }
interface Point extends PartialPointX { 
  y: number; 
}
```
## Type alias extends type alias
```
type PartialPointX = { x: number; };
type Point = PartialPointX & { y: number; };
```
## Interface extends type alias
```
type PartialPointX = { x: number; };
interface Point extends PartialPointX { y: number; }
```
## Type alias extends interface
```
interface PartialPointX { x: number; }
type Point = PartialPointX & { y: number; };
```

# Implements
类可以以相同的方式实现接口或类型别名，但类不能实现使用类型别名定义的联合类型：
```
interface Point {
  x: number;
  y: number;
}

class SomePoint implements Point {
  x = 1;
  y = 2;
}

type Point2 = {
  x: number;
  y: number;
};

class SomePoint2 implements Point2 {
  x = 1;
  y = 2;
}

type PartialPoint = { x: number; } | { y: number; };

// A class can only implement an object type or 
// intersection of object types with statically known members.
class SomePartialPoint implements PartialPoint { // Error
  x = 1;
  y = 2;
}
```
# Declaration merging
```
interface Point { x: number; }
interface Point { y: number; }

const point: Point = { x: 1, y: 2 };
```