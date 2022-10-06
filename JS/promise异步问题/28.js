new Promise((resolve, reject) => {
    console.log("外部promise");
    resolve();
  })
    .then(() => {
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
      return new Promise((resolve, reject) => {
        console.log("内部promise2");
        resolve();
      })
        .then(() => {
          console.log("内部第一个then2");
        })
        .then(() => {
          console.log("内部第二个then2");
        });
    })
    .then(() => {
      console.log("外部第二个then");
    });
// 外部promise
// 外部第一个then
// 内部promise
// 内部promise2
// 内部第一个then
// 内部第一个then2
// 内部第二个then
// 内部第二个then2
// 外部第二个then