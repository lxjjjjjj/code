// 两个外部then方法是同步注册的
let p = new Promise((resolve, reject) => {
    console.log("外部promise");
    resolve();
  })
  p.then(() => {
      console.log("外部第一个then");
      new Promise((resolve, reject) => {
        console.log("内部promise");
        resolve();
      })
        .then(() => {
          console.log("内部第一个then");
        })
        .then(() => {
          console.log("内部第二个then");
        });
    })
  p.then(() => {
      console.log("外部第二个then");
    });
  // 外部promise
  // 外部第一个then
  // 内部promise
  // 外部第二个then
  // 内部第一个then
  // 内部第二个then