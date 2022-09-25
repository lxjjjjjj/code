var x = 10; // global scope
var foo = {
  x: 90,
  getX: function() {
    return this.x;
  }
};
foo.getX(); // prints 90
let xGetter = foo.getX;
xGetter(); // prints 10
