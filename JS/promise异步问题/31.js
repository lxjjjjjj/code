console.log('ha1');
setTimeout(() => {
 console.log(7); 
});
new Promise((resolve, reject) => {
    console.log('ha1');
    resolve('test')
})
  .then(() => {
    console.log(0);
    return Promise.resolve(4);
  })
  .then((res) => {
    console.log(res);
  });
new Promise((resolve, reject) => {
    console.log('ha2')
    resolve('666')
})
  .then(() => {
    console.log(1);
  })
  .then(() => {
    console.log(2);
  })
  .then(() => {
    console.log(3);
  })
  .then(() => {
    console.log(5);
  })
  .then(() => {
    console.log(6);
  });

  // ha1 ha1 ha2 0 1 2 3 4 5 6 7