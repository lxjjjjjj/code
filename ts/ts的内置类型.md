# Partial
将类型定义的所有属性都修改为可选。
```
type Coord = Partial<Record<'x' | 'y', number>>;

// 等同于
type Coord = {
	x?: number;
	y?: number;
}
```
## Partial 原理
```
type Partial<T> = {
    [P in keyof T]?: T[P];
};
```
## 实现递归可选类型
需要额外注意的是当使用 Partial 时仅仅会将第一层变为可选，当存在多层嵌套时并不会递归转化。
如果我们希望实现递归可选类型，如下实现
```
interface Person {
  name: string;
  age: number;
  detail: {
    school: string;
    company: string;
  };
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type PartialPerson = DeepPartial<Person>;

const person1: PartialPerson = {
  name: '19Qingfeng',
  age: 24,
  detail: {
    company: 'Tencent',
    // 即使我们不输入school也无关紧要
  },
};
```
# Required
同样 Required 表示将传入的类型中的属性全部转为必选，它和 Parital 正好相反，同样不支持嵌套。

## 原理实现
```
type Required<T> = {
    [P in keyof T]-?: T[P];
};
```
## 实现递归必选类型
```
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};

```
## Readonly
Readonly<T> 的作用是将某个类型所有属性变为只读属性，也就意味着这些属性不能被重新赋值。
```
type Readonly<T> = {
 readonly [P in keyof T]: T[P];
};

interface Todo {
 title: string;
}

const todo: Readonly<Todo> = {
 title: "Delete inactive users"
};

todo.title = "Hello"; // Error: cannot reassign a readonly property

```

# Exclude<T,U>
Exclude是进行排除 T 类型中满足 U 的类型从而返回新的类型,Exclude是针对于联合类型来操作的
```
let a: string | number;

type CustomType = Exclude<typeof a, string>; // number类型
```
## 原理实现
此时 Exclude 中的传入的联合类型会产生分发效应，代表在 Exclude 源码定义中会将传入的联合类型，这里我们传入了三种，依次带入判断而非统一作为联合类型判读。
```
type Exclude<T, U> = T extends U ? never : T
比如
type Name = Exclude<string | number | boolean, number>
会分别判断 string extends number ? number extends number ? boolean extends number ?
```

## 满足分发效果的条件

1、首先仅仅在泛型中传入联合类型时，是第一个需要满足的条件。
2、其次，并且需要在条件判断语句中，简单来说 extends 语句中才会有可能产生分发。
3、最后，必须为裸类型（string 、 number 、 boolean）。

```
如果 Exclude 类型定义为这样：

type Exclude<T, U> = (T & {}) extends U ? never : T
```
此时的 T 并不是裸类型，我们对于泛型参数 T 进行了操作它并不是裸类型了。

# Extract<T,U>
Extract 类型和 Exclude 是相反的含义，它会挑选出 T 中 符合 U 的类型

## 实现原理
它的源码中同样利用了分发的概念：
```
type Extract<T, U> = T extends U ? T : never;
```

# Pick<Type, Keys>
Exclude、Extract 可以看作是针对普通类型进行排除/提取的，而 Omit/Pick 则是针对对象类型的。
Pick的定义很简单，就是从传入的Type中挑出对应的Keys属性，从而返回新的类型。
```
interface Props {
  name: string;
  label: number;
  value: boolean;
}

type ChildrenProps = Pick<Props, 'name' | 'label'>;
```
## 实现原理
```
type Pick<T, K extends keyof T> = {
    [P in K]: T[P]
}
```
# Parameters<T>
用于获得函数的参数类型组成的元组类型
```
const fn = (a: string,b:number,...c:number[]) => {}
type c = Parameters<typeof fn>
```

## 实现原理
```
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any 
  ? P : never;
```
# Omit<T, K>
让我们可以从另一个对象类型中剔除某些属性，并创建一个新的对象类型。
```
type User = {
    id: string;
    name: string;
    email: string;
};

type UserWithoutEmail = Omit<User, "email">;

// 等价于:

type UserWithoutEmail = {
    id: string;
    name: string;
};
```
# ReturnType
接受传入一个函数类型为泛型，返回值为函数的返回类型
```
type T0 = ReturnType<() => string>; // type T0 = string

type T1 = ReturnType<(s: string) => void>; // type T1 = void
```

## 原理实现
```
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```
# Record<K extends keyof any, T>
构造一个新的对象类型，其属性键为Keys，属性值为Type。此实用程序可用于将一种类型的属性映射到另一种类型。

```
type keys = 'name' | 'title' | 'hello';

interface values {
  name: string;
  label?: number;
}

// Record内置类型可以将 传入的keys联合类型遍历作为key 
// 为每一个key的value赋值为 values从而形成一个全新的对象类型返回
const b: Record<keys, values> = {
  name: {
    name: 'wang',
    label: 1,
  },
  title: {
    name: 'hellp',
  },
  hello: {
    name: 'nihao',
  },
};

```
同样我们常用 Record 类型在遍历上
```
// Record 常用遍历对象返回新的类型时使用
function mapping<K extends string | number | symbol, V, R>(
  obj: Record<K, V>,
  callback: (key: K, value: V) => R
): Record<K, R> {
  const result = {} as Record<K, R>;
  Object.keys(obj).forEach((key) => {
    const parseKey = key as K;
    const value = obj[key];
    result[key] = callback(parseKey, value);
  });
  return result;
}

mapping({ name: '19Qingfeng', company: 'Tencent' }, (key, value) => {
  return key + value;
});
```
## 原理实现
```
type Record<K extends keyof any, T> = {
    [P in K]: T;
};
```
# NonNullable
NonNullable<T> 的作用是用来过滤类型中的 null 及 undefined 类型。

```
type T0 = NonNullable<string | number | undefined>; // string | number
type T1 = NonNullable<string[] | null | undefined>; // string[]

```
## 原理实现
```
type NonNullable<T> = T extends null | undefined ? never : T;
```

# Parameters
Parameters<T> 的作用是用于获得函数的参数类型组成的元组类型。

```
type A = Parameters<() =>void>; // []
type B = Parameters<typeof Array.isArray>; // [any]
type C = Parameters<typeof parseInt>; // [string, (number | undefined)?]
type D = Parameters<typeof Math.max>; // number[]

const fn = (a:string, b: number, ...c: number[]) => { };
type c = Parameters<typeof fn>;
// type c = [a:number, b: number, ...c:number[]]
```
## 源码实现：
```
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
? P : never;
```