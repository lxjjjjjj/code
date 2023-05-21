const currying = fn =>
    judge = (...args) =>
        args.length >= fn.length
            ? fn(...args)
            : (...arg) => judge(...args, ...arg)

// const curry = fn =>
//     curry1 = (...args) =>
//         args.length >= fn.length
//             ? fn(...args)
//             : (...args1) => curry1(...args, ...args1)

const curry = fn =>
    curry1 = (...args) =>
        args.length >= fn.length ?
            fn(...args) :
            (...args1) => curry1(...args, ...args1)