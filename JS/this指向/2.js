const foo = {  
    fn: function () {  
        setTimeout(function() {  
            console.log(this)
        })
    }  
}  
console.log(foo.fn())
// 这道题中，this 出现在 setTimeout() 中的匿名函数里，因此 this 指向 window 对象。如果需要 this 指向 foo 这个 object 对象，可以巧用箭头函数解决：

// const foo = {  
//     fn: function () {  
//         setTimeout(() => {  
//             console.log(this)
//         })
//     }  
// } 
// console.log(foo.fn())

// {fn: ƒ}