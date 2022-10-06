JSON 是一种语法，用来序列化对象、数组、数值、字符串、布尔值和 null 。

JSON.stringfy()转换规则

- 布尔值、数字、字符串的包装对象在序列化过程中会自动转换成对应的原始值。
- 所有以 symbol 为属性键的属性都会被完全忽略掉，即便 replacer 参数中强制指定包含了它们。
- 属性为函数或者undefined，则会被忽略。
- 转换值如果有toJSON()方法，该方法定义什么值将被序列化。
- 非数组对象的属性不能保证以特定的顺序出现在序列化后的字符串中。
- undefined、任意的函数以及 symbol 值，在序列化过程中会被忽略（出现在非数组对象的属性值中时）或者被转换成 null（出现在数组中时）。函数、undefined被单独转换时，会返回undefined，如JSON.stringify(function(){}) or JSON.stringify(undefined).
- 对包含循环引用的对象（对象之间相互引用，形成无限循环）执行此方法，会抛出错误。
- NaN和Infinity格式的数值及null都会被当做null。
- 仅会序列化可枚举的属性。

```
JSON.stringify(1)                          // "1"
JSON.stringify("foo");                     // '"foo"'
JSON.stringify({});                        // '{}'
JSON.stringify(true);                      // 'true'
JSON.stringify([1, "false", false]);       // '[1,"false",false]'
JSON.stringify({ x: 5 });                  // '{"x":5}'

//所有以 symbol 为属性键的属性都会被完全忽略掉
JSON.stringify({[Symbol("foo")]: "foo"});                            // "{}"
JSON.stringify({[Symbol.for("foo")]: "foo"}, [Symbol.for("foo")]);  // '{}'
    
    
JSON.stringify(undefined)                  //undefined
//undefined、任意的函数以及 symbol值，在序列化过程中会被忽略（出现在非数组对象的属性值中时）或者被转换成 null
JSON.stringify([undefined, Object, Symbol("")]);                  // '[null,null,null]'           

//属性为函数，则会被忽略
const data1 = {
    a: 'aaa',
    fn: function() {
        return true
    }，
    b:undefined
}
JSON.stringify(data) // "{"a":"aaa"}"
    
//转换值如果有toJSON()方法，该方法定义什么值将被序列化。
const data5 = {
    a: 'abc',
    b: null,
    c: {
        x: 'xxx',
        y: 'yyy',
        z: 2046
    },
    d: 9527,
    toJSON: function() {
        return 'WTF'
    }
}

JSON.stringify(data5, null, 2); //""WTF""
```

```
if (!window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: (function () {
      var toString = Object.prototype.toString;
      var isArray = Array.isArray || function (a) { return toString.call(a) === '[object Array]'; };
      var escMap = {'"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t'};
      var escFunc = function (m) { return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1); };
      var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
      return function stringify(value) {
        if (value == null) {
          return 'null';
        } else if (typeof value === 'number') {
          return isFinite(value) ? value.toString() : 'null'; // isFinite 非无穷大
        } else if (typeof value === 'boolean') {
          return value.toString();
        } else if (typeof value === 'object') {
          if (typeof value.toJSON === 'function') {
            return stringify(value.toJSON());
          } else if (isArray(value)) {
            var res = '[';
            for (var i = 0; i < value.length; i++)
              res += (i ? ', ' : '') + stringify(value[i]);
            return res + ']';
          } else if (toString.call(value) === '[object Object]') {
            var tmp = [];
            for (var k in value) {
              if (value.hasOwnProperty(k)) // hasOwnProperty 重点 只转换可遍历属性
                tmp.push(stringify(k) + ': ' + stringify(value[k]));
            }
            return '{' + tmp.join(', ') + '}';
          }
        }
        return '"' + value.toString().replace(escRE, escFunc) + '"';
      };
    })()
  };
}


function jsonStringify(obj) {
    let type = typeof obj;
    if (type !== "object") {
        if (/string|undefined|function/.test(type)) {
            obj = '"' + obj + '"';
        }
        return String(obj);
    } else {
        let json = []
        let arr = Array.isArray(obj)
        for (let k in obj) {
            let v = obj[k];
            let type = typeof v;
            if (/string|undefined|function/.test(type)) {
                v = '"' + v + '"';
            } else if (type === "object") {
                v = jsonStringify(v);
            }
            json.push((arr ? "" : '"' + k + '":') + String(v));
        }
        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}")
    }
}
jsonStringify({x : 5}) // "{"x":5}"
jsonStringify([1, "false", false]) // "[1,"false",false]"
jsonStringify({b: undefined}) // "{"b":"undefined"}"
```
