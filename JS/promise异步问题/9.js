async function async1() {
    console.log(1);
    await async2();
    console.log(2);
  }
async function async2() {
    console.log(3);
}

new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve()
        console.log(4)
    }, 1000);
}).then(() => {
    console.log(5)
    new Promise((resolve, reject) => {
        setTimeout(() => {
            async1()
            resolve()
            console.log(6)
        }, 1000)
    }).then(() => {
        console.log(7)
    }).then(() => {
        console.log(8)
    })
}).then(() => {
    console.log(9)
})
new Promise((resolve, reject) => {
    console.log(10)
    setTimeout(() => {
        resolve()
        console.log(11)
    }, 3000);
}).then(() => {
    console.log(12)
})

// 10 4 5 9 1 3 6 2 7 8 11 12