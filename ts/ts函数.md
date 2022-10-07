# 参数类型和返回类型
```
function createUserId(name: string, id: number): string {
  return name + id;
}
```
# 可选参数及默认参数
```
// 可选参数
function createUserId(name: string, id: number, age?: number): string {
  return name + id;
}

// 默认参数
function createUserId(
  name: string = "semlinker",
  id: number,
  age?: number
): string {
  return name + id;
}
```
# 函数重载
函数重载或方法重载是使用相同名称和不同参数数量或类型创建多个方法的一种能力。


```
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: string, b: number): string;
function add(a: number, b: string): string;
function add(a: Combinable, b: Combinable) {
  // type Combinable = string | number;
  if (typeof a === 'string' || typeof b === 'string') {
    return a.toString() + b.toString();
  }
  return a + b;
}
```