console.log('script start');
new Promise((resolve, reject) => {
    console.log('Promise1');
    resolve();
    console.log('状态是resolved');
})
.then(() =>console.log('then1'))
.then(() =>console.log('then2'))
console.log('script end');

// script start Promise1 状态是resolved script end then1 then2