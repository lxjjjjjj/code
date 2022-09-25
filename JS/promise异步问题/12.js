async function bar() {
    console.log("222222");
    return new Promise((resolve, reject) => {
      reject();
    });
  }
  
  async function foo() {
    console.log("111111");
    await bar().catch((err) => {});
    console.log("333333");
  }
  foo();
  console.log("444444");
  
  //111111 222222 444444 333333