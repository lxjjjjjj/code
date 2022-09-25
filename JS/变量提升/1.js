var a = 10;
function foo() {
    console.log(a); // undefined
    var a = 20;
}
foo();

let a = 10;
function foo() {
    console.log(a); // ReferenceError：a undefined
    //与var不同的是，这些变量没有被提升，并且有一个所谓的暂时死区(TDZ)。试图访问TDZ中的这些变量将引发ReferenceError。
    let a = 20;
}
foo();


const a = 10;
function foo() {
    console.log(a); //Cannot access 'a' before initialization
    const a = 20;
}
foo();