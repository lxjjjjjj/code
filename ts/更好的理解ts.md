[原文链接](https://mp.weixin.qq.com/s/Dup0ZKGz-7xWGvJ4IOk_mg)

TS语言最不可思议的力量在于组成、推断和操纵类型。

# 将类型想象成集合
```
type Measure = { radius: number };
type Style = { color: string };

// typed { radius: number; color: string }
type Circle = Measure & Style;


type Measure = { radius: number };
type Style = { color: string };

// typed { radius: number } 或者 { color: string }
type Circle = Measure ｜ Style;
```
如果你将 & 操作符解释为逻辑与，你的可能会认为 Circle 是一个哑巴类型，因为它是两个没有任何重叠字段的类型的结合。这不是 TypeScript 的工作方式。相反，将其想象成集合会更容易推导出正确的行为：

**每种类型都是值的集合**

有些集合是无限的，如 string、object；有些是有限的，如 boolean、undefined，...
unknown 是通用集合（包括所有值），而 never 是空集合（不包括任何值）
Type Measure 是一个集合，包含所有包含名为 radius 的 number 字段的对象。Style 也是如此。
&运算符创建了交集：Measure & Style 表示包含 radius 和 color 字段的对象的集合，这实际上是一个较小的集合，但具有更多常用字段。
同样，|运算符创建了并集：一个较大的集合，但可能具有较少的常用字段（如果两个对象类型组合在一起）

**集合也有助于理解可分配性：只有当值的类型是目标类型的子集时才允许赋值**

type ShapeKind = 'rect' | 'circle';
let foo: string = getSomeString();
let shape: ShapeKind = 'rect';

// 不允许，因为字符串不是 ShapeKind 的子集。
shape = foo;

// 允许，因为 ShapeKind 是字符串的子集。
foo = shape;

# 理解类型声明和类型收窄

TypeScript 有一项非常强大的功能是基于控制流的自动类型收窄。这意味着在代码位置的任何特定点，变量都具有两种类型：声明类型和类型收窄。

```
function foo(x: string | number) {
  if (typeof x === 'string') {
    // x 的类型被缩小为字符串，所以.length是有效的
    console.log(x.length);

    // assignment respects declaration type, not narrowed type
    x = 1;
    console.log(x.length); // disallowed because x is now number
    } else {
        ...
    }
}
```

# 使用带有区分的联合类型而不是可选字段
在定义一组多态类型（如 Shape）时，可以很容易地从以下开始：

```
type Shape = {
  kind: 'circle' | 'rect';
  radius?: number;
  width?: number;
  height?: number;
}

function getArea(shape: Shape) {
  return shape.kind === 'circle' ? 
    Math.PI * shape.radius! ** 2
    : shape.width! * shape.height!;
}
```
需要使用非空断言（在访问 radius、width 和 height 字段时），因为 kind 与其他字段之间没有建立关系。相反，区分联合是一个更好的解决方案：

```
type Circle = { kind: 'circle'; radius: number };
type Rect = { kind: 'rect'; width: number; height: number };
type Shape = Circle | Rect;

function getArea(shape: Shape) {
    return shape.kind === 'circle' ? 
        Math.PI * shape.radius ** 2
        : shape.width * shape.height;
}
```
类型收窄已经消除了强制转换的需要。

# 使用类型谓词来避免类型断言
如果你正确使用 TypeScript，你应该很少会发现自己使用显式类型断言（例如 value as SomeType）；但是，有时你仍然会有一种冲动，例如：
```
type Circle = { kind: 'circle'; radius: number };
type Rect = { kind: 'rect'; width: number; height: number };
type Shape = Circle | Rect;

function isCircle(shape: Shape) {
  return shape.kind === 'circle';
}

function isRect(shape: Shape) {
  return shape.kind === 'rect';
}

const myShapes: Shape[] = getShapes();
// 错误，因为typescript不知道过滤的方式
const circles: Circle[] = myShapes.filter(isCircle);

// 你可能倾向于添加一个断言
// const circles = myShapes.filter(isCircle) as Circle[];
```
一个更优雅的解决方案是将isCircle和isRect改为返回类型谓词，这样它们可以帮助Typescript在调用 filter 后进一步缩小类型。

```
function isCircle(shape: Shape): shape is Circle {
    return shape.kind === 'circle';
}

function isRect(shape: Shape): shape is Rect {
    return shape.kind === 'rect';
}

...
// now you get Circle[] type inferred correctly
const circles = myShapes.filter(isCircle);
```

# 控制联合类型的分布方式
类型推断是Typescript的本能；大多数时候，它公默默地工作。但是，在模糊不清的情况下，我们可能需要干预。分配条件类型就是其中之一。

假设我们有一个ToArray辅助类型，如果输入的类型不是数组，则返回一个数组类型。

type ToArray<T> = T extends Array<unknown> ? T: T[];
你认为对于以下类型，应该如何推断？

type Foo = ToArray<string|number>;

答案是string[] | number[]。但这是有歧义的。为什么不是(string | number)[] 呢？

默认情况下，当typescript遇到一个联合类型（这里是string | number）的通用参数（这里是T）时，它会分配到每个组成元素，这就是为什么这里会得到string[] | number[]。这种行为可以通过使用特殊的语法和用一对[]来包装T来改变，比如。
```
type ToArray<T> = [T] extends [Array<unknown>] ? T : T[];
type Foo = ToArray<string | number>;
```
现在，Foo 被推断为类型(string | number)[]

# 使用穷举式检查，在编译时捕捉未处理的情况
在对枚举进行 switch-case 操作时，最好是积极地对不期望的情况进行错误处理，而不是像在其他编程语言中那样默默地忽略它们。
```
function getArea(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
    default:
      throw new Error('Unknown shape kind');
  }
}
```
使用Typescript，你可以通过利用never类型，让静态类型检查提前为你找到错误:
```
function getArea(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rect':
      return shape.width * shape.height;
    default:
      // 如果任何shape.kind没有在上面处理
      // 你会得到一个类型检查错误。
      const _exhaustiveCheck: never = shape;
      throw new Error('Unknown shape kind');
  }
}
```
有了这个，在添加一个新的shape kind时，就不可能忘记更新getArea函数。

这种技术背后的理由是，never 类型除了 never 之外不能赋值给任何东西。如果所有的 shape.kind 候选者都被 case 语句消耗完，到达 default 的唯一可能的类型就是 never；但是，如果有任何候选者没有被覆盖，它就会泄漏到 default 分支，导致无效赋值。

# 优先选择 type 而不是 interface

在 TypeScript 中，当用于对对象进行类型定义时，type 和 interface 构造很相似。尽管可能有争议，但我的建议是在大多数情况下一贯使用 type，并且仅在下列情况之一为真时使用 interface：

你想利用interface的 "合并"功能。
你有遵循面向对象风格的代码，其中包含类/接口层次结构
否则，总是使用更通用的类型结构会使代码更加一致。

# 在适当的时候优先选择元组而不是数组
对象类型是输入结构化数据的常见方式，但有时你可能希望有更多的表示方法，并使用简单的数组来代替。例如，我们的Circle可以这样定义：
```
type Circle = (string | number)[];
const circle: Circle = ['circle', 1.0];  // [kind, radius]
```
但是这种类型检查太宽松了，我们很容易通过创建类似 ['circle', '1.0'] 的东西而犯错。我们可以通过使用 Tuple 来使它更严格：

```
type Circle = [string, number];

// 这里会得到一个错误
const circle: Circle = ['circle', '1.0'];
```
Tuple使用的一个好例子是React的useState：

const [name, setName] = useState('');
它既紧凑又有类型安全。

# 控制推断的类型的通用性或特殊性
在进行类型推理时，Typescript使用了合理的默认行为，其目的是使普通情况下的代码编写变得简单（所以类型不需要明确注释）。有几种方法可以调整它的行为。

## 使用const来缩小到最具体的类型
let foo = { name: 'foo' }; // typed: { name: string }
let Bar = { name: 'bar' } as const; // typed: { name: 'bar' }

let a = [1, 2]; // typed: number[]
let b = [1, 2] as const; // typed: [1, 2]

// typed { kind: 'circle; radius: number }
let circle = { kind: 'circle' as const, radius: 1.0 };

// 如果circle没有使用const关键字进行初始化，则以下内容将无法正常工作
let shape: { kind: 'circle' | 'rect' } = circle;

## 使用satisfies来检查类型，而不影响推断的类型
```
type NamedCircle = {
    radius: number;
    name?: string;
};

const circle: NamedCircle = { radius: 1.0, name: 'yeah' };

// error because circle.name can be undefined
console.log(circle.name.length);
```
我们遇到了错误，因为根据circle的声明类型NamedCircle，name字段确实可能是undefined，即使变量初始值提供了字符串值。当然，我们可以删除:NamedCircle类型注释，但我们将为circle对象的有效性丢失类型检查。相当的困境。

幸运的是，Typescript 4.9 引入了一个新的satisfies关键字，允许你在不改变推断类型的情况下检查类型。

```
type NamedCircle = {
    radius: number;
    name?: string;
};

// error because radius violates NamedCircle
const wrongCircle = { radius: '1.0', name: 'ha' }
    satisfies NamedCircle;

const circle = { radius: 1.0, name: 'yeah' }
    satisfies NamedCircle;

// circle.name can't be undefined now
console.log(circle.name.length);
```
修改后的版本享有这两个好处：保证对象字面意义符合NamedCircle类型，并且推断出的类型有一个不可为空的名字字段。

# 使用infer创建额外的泛型类型参数
在设计实用功能和类型时，我们经常会感到需要使用从给定类型参数中提取出的类型。在这种情况下，infer关键字非常方便。它可以帮助我们实时推断新的类型参数。这里有两个简单的示例：
```
//  从一个Promise中获取未被包裹的类型
// idempotent if T is not Promise
type ResolvedPromise<T> = T extends Promise<infer U> ? U : T;
type t = ResolvedPromise<Promise<string>>; // t: string

// gets the flattened type of array T;
// idempotent if T is not array
type Flatten<T> = T extends Array<infer E> ? Flatten<E> : T;
type e = Flatten<number[][]>; // e: number
```
T extends Promise<infer U>中的infer关键字的工作方式可以理解为：假设T与某些实例化的通用Promise类型兼容，即时创建类型参数U使其工作。因此，如果T被实例化为Promise<string>，则U的解决方案将是string。

# 通过在类型操作方面保持创造力来保持DRY（不重复）
Typescript提供了强大的类型操作语法和一套非常有用的工具，帮助你把代码重复率降到最低。

不是重复声明：
```
type User = {
    age: number;
    gender: string;
    country: string;
    city: string
};
type Demographic = { age: number: gender: string; };
type Geo = { country: string; city: string; };
```
而是使用Pick工具来提取新的类型：

```
type User = {
    age: number;
    gender: string;
    country: string;
    city: string
};
type Demographic = Pick<User, 'age'|'gender'>;
type Geo = Pick<User, 'country'|'city'>;
```
不是重复函数的返回类型

```
function createCircle() {
    return {
        kind: 'circle' as const,
        radius: 1.0
    }
}

function transformCircle(circle: { kind: 'circle'; radius: number }) {
    ...
}

transformCircle(createCircle());
```
而是使用ReturnType<T>来提取它：
```
function createCircle() {
    return {
        kind: 'circle' as const,
        radius: 1.0
    }
}

function transformCircle(circle: ReturnType<typeof createCircle>) {
    ...
}

transformCircle(createCircle());
```
不是并行地同步两种类型的形状（这里是typeof config和Factory）。
```
type ContentTypes = 'news' | 'blog' | 'video';

// config for indicating what content types are enabled
const config = { news: true, blog: true, video: false }
    satisfies Record<ContentTypes, boolean>;

// factory for creating contents
type Factory = {
    createNews: () => Content;
    createBlog: () => Content;
};
```
而是使用Mapped Type和Template Literal Type，根据配置的形状自动推断适当的工厂类型。
```
type ContentTypes = 'news' | 'blog' | 'video';

// generic factory type with a inferred list of methods
// based on the shape of the given Config
type ContentFactory<Config extends Record<ContentTypes, boolean>> = {
    [k in string & keyof Config as Config[k] extends true
        ? `create${Capitalize<k>}`
        : never]: () => Content;
};

// config for indicating what content types are enabled
const config = { news: true, blog: true, video: false }
    satisfies Record<ContentTypes, boolean>;

type Factory = ContentFactory<typeof config>;
// Factory: {
//     createNews: () => Content;
//     createBlog: () => Content; 
// }
```