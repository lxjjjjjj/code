function myNew(){
    const obj = new Object();
    Constructor = Array.prototype.shift.call(arguments);
    obj.__proto__ = Constructor.prototype;
    let ret = Constructor.apply(obj,arguments); // 判断构造函数是否存在返回值
    return typeof ret === 'object'? ret : obj;
}

function Student (name, age){
    this.class= '3.5';
    return {
        name:name,
        age:age
    }
}

let newPerson = new Student('hanson',18)
console.log(newPerson.name) // hanson
console.log(newPerson.class) // undefined

// 如果构造函数有返回值，那么只返回构造函数返回的对象。