// resolve promise自身的几种情况
// let定义
let pro1 = new Promise((resolve, reject) => {
  resolve(pro1);
})

pro1.then((res) => {
  console.log('pro1..res..', res);
}, err => {
  console.log('pro1..err..', err);
})

// pro1..err.. ReferenceError: pro1 is not defined

// const定义
const pro2 = new Promise((resolve, reject) => {
  resolve(pro2);
})

pro2.then((res) => {
  console.log('pro2..res..', res);
}, err => {
  console.log('pro2..err..', err);
})

// pro2..err.. ReferenceError: pro2 is not defined

  var pro3 = new Promise((resolve, reject) => {
    resolve(pro3);
  })
  
  pro3.then((res) => {
    console.log('pro3..res..', res);
  }, err => {
    console.log('pro3..err..', err);
  })

  // pro3..res.. undefined
  var pro4 = new Promise((resolve, reject) => {
    setTimeout(() => {
       resolve(pro4); 
    }, 0)
  })
  
  pro4.then((res) => {
    console.log('pro4..res..', res);
  }, err => {
    console.log('pro4..err..', err);
  })
  // pro4..err.. TypeError: Chaining cycle detected for promise #<Promise>
  
