[symbol](https://juejin.cn/post/7143252808257503240)

# 什么是symbol
Symbol作为原始数据类型的一种，表示独一无二的值，在之前，对象的键以字符串的形式存在，所以极易引发键名冲突问题，而Symbol的出现正是解决了这个痛点，它的使用方式也很简单。

# Symbol的使用


```
let a = Symbol()
typeof a

let a = new Symbol()
typeof a // Symbol is not a constructor

b --- {
    Symbol {
        Symbol(aaa), 
        description: 'aaa'
    }
    description: "aaa"
    [[Prototype]]: Symbol
    [[PrimitiveValue]]: Symbol(aaa)
}

a --- Symbol(aaa)
```
# 应用

### 作为对象的属性


```
let a = Symbol()
let obj = {}
obj[a] = "hello world"

值得注意的是我们无法使用.来调用对象的Symbol属性，所以必须使用[]来访问Symbol属性

```
### 降低代码耦合


```
if (name === "猪痞恶霸") {
    console.log(1)
}

又或者
switch (name) {
        case "猪痞恶霸"
        console.log(1)
        case "Ned"
        console.log(2)
}

```
与代码强耦合的字符串


```
const judge = {
    rectangle:Symbol("rectangle"),
    triangle:Symbol("triangle")
}
function getArea(model, size) {
    switch (model) {
        case judge.rectangle:
            return size.width * size.height
        case judge.triangle:
            return size.width * size.height / 2
    }
}
let area = getArea(judge.rectangle ,{width:100, height:200})
console.log(area)
```
### 全局共享Symbol

如果我们想在不同的地方调用已经同一Symbol即全局共享的Symbol，可以通过Symbol.for()方法，参数为创建时传入的描述字符串，该方法可以遍历全局注册表中的的Symbol，当搜索到相同描述，那么会调用这个Symbol，如果没有搜索到，就会创建一个新的Symbol。

```
let a = Symbol.for("a")
let b = Symbol.for("a")
a === b // true
```
如上创建Symbol

首先通过Symbol.for()在全局注册表中寻找描述为a的Symbol，而目前没有符合条件的Symbol，所以创建了一个描述为a的Symbol
当声明b并使用Symbol.for()在全局注册表中寻找描述为a的Symbol，找到并赋值
比较a与b结果为true反映了Symbol.for()的作用


```
let a = Symbol("a")
let b = Symbol.for("a")
a === b // false
```
使用Symbol("a")直接创建，所以该Symbol("a")不在全局注册表中
使用Symbol.for("a")在全局注册表中寻找描述为a的Symbol，并没有找到，所以在全局注册表中又创建了一个描述为a的新的Symbol
秉承Symbol创建的唯一特性，所以a与b创建的Symbol不同，结果为false


我们如何去判断我们的Symbol是否在全局注册表中

```
let a = Symbol("a")
let b = Symbol.for("a")
Symbol.keyFor(a) // undefined
Symbol.keyFor(b) // 'a'
```
如果查询存在即返回该Symbol的描述，如果不存在则返回undefined

### 内置Symbol值又是什么

上面的Symbol使用是我们自定义的，而JS有内置了Symbol值，个人的理解为：由于唯一性特点，在对象内，作为一个唯一性的键并对应着一个方法，在对象调用某方法的时候会调用这个Symbol值对应的方法，并且我们还可以通过更改内置Symbol值对应的方法来达到更改外部方法作用的效果。
为了更好地理解上面这一大段话，咱们以Symbol.hasInstance作为例子来看看内置Symbol到底是个啥！

```
class demo {
    static [Symbol.hasInstance](item) {
        return item === "猪痞恶霸"
    }
}
"猪痞恶霸" instanceof demo // true

```
Symbol.hasInstance对应的外部方法是instanceof，这个大家熟悉吧，经常用于判断类型。而在上面的代码片段中，我创建了一个demo类，并重写了Symbol.hasInstance，所以其对应的instanceof行为也会发生改变，其内部的机制是这样的：当我们调用instanceof方法的时候，内部对应调用Symbol.hasInstance对应的方法即return item === "猪痞恶霸"