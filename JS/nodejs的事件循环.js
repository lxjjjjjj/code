// async function async1() {
//     console.log("async1 start");
//     await async2();
//     console.log("async1 end");
//   }
  
//   async function async2() {
//     console.log("async2");
//   }
  
//   console.log("script start");
  
//   setTimeout(function () {
//     console.log("setTimeout0");
//   }, 0);
  
//   setTimeout(function () {
//     console.log("setTimeout2");
//   }, 300);
  
//   setImmediate(() => console.log("setImmediate"));
  
//   process.nextTick(() => console.log("nextTick1"));
  
//   async1();
  
//   process.nextTick(() => console.log("nextTick2"));
  
//   new Promise(function (resolve) {
//     console.log("promise1");
//     resolve();
//     console.log("promise2");
//   }).then(function () {
//     console.log("promise3");
//   });
  
//   console.log("script end");

// setTimeout(()=>{
//     console.log('timer1')
//     Promise.resolve().then(function() {
//         console.log('promise1')
//     })
// }, 0)
// setTimeout(()=>{
//     console.log('timer2')
//     Promise.resolve().then(function() {
//         console.log('promise2')
//     })
// }, 0)
// node11之前的执行结果 timer1 timer2 promise1 promise2  和浏览器执行结果不一致
// node11之后的执行结果 timer1 promise1 timer2 promise2  和浏览器执行结果一致

setImmediate(() => {
    console.log('timeout1')
    Promise.resolve().then(() => console.log('promise resolve'))
    process.nextTick(() => console.log('next tick1'))
});
setImmediate(() => {
    console.log('timeout2')
    process.nextTick(() => console.log('next tick2'))
});
setImmediate(() => console.log('timeout3'));
setImmediate(() => console.log('timeout4'));