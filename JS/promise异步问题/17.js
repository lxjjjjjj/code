console.log('script start');
new Promise((resolve,reject)=>{
    console.log("promise1")
    resolve()
}).then(()=>{
    console.log("then1-1")
    new Promise((resolve,reject)=>{
        console.log("promise2")
        resolve()
    }).then(()=>{
        console.log("then2-1")
    }).then(()=>{
        console.log("then2-2")
    })
}).then(()=>{
    console.log("then1-2")
})
new Promise((resolve,reject)=>{
    console.log("promise3")
    resolve()
}).then(()=>{
    console.log("then3-1")
})
    
console.log('script end');

//script start promise1 promise3 script end then1-1 promise2 then3-1 then2-1 then1-2 then2-2 