add(1)(2)(3)(4)(5)(6); // => 21
add(1, 2)(3, 4)(5, 6); // => 21
add(1, 2, 3, 4, 5, 6); // => 21

var curring = () => {
    var result = [];
    var add = (...args) => {
      result = result.concat(args);
      return add;
    };
    
    add.valueOf = add.toString = () => {
       return result.reduce((pre, cur) => pre + cur, 0);
    }
    return add;
  };
  
var add = curring();
console.log(+add(1)(2)(3)(4)(5)(6));

add = curring();
console.log(+add(1, 2)(3, 4)(5, 6));

add = curring();
console.log(+add(1, 2, 3, 4, 5, 6));