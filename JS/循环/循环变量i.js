var array = [];
for(var i = 0; i <3; i++) {
 array.push(() => i); 
}
// [3, 3, 3]

var array = [];
for (let i = 0; i < 3; i++) {
  array.push(() => i);
}
// [1, 2, 3]

let array = [];
for (var i = 0; i < 3; i++) {

  array[i] = (function(x) {
    return function() {
      return x;
    };
  })(i);
}

// [1, 2, 3]