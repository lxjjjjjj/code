function apply(context, args) {
    context = context || window
    const symbol = Symbol()
    const fn = this
    context[symbol] = fn
    const res = context[symbol](...args)
    delete context[symbol]
    return res
}

function call(context, ...args) {
    context = context || window
    const symbol = Symbol()
    const fn = this
    context[symbol] = fn
    const res = context[symbol](...args)
    delete context[symbolFn]
    return res
}

function bind(context, ...outerArgs) {
    context = context || window
    const fn = this
    const key = Symbol()
    context[key] = fn
    return function(...innerArgs) {
        const res = context[key](...outerArgs, ...innerArgs)
        delete context[key]
        return res
    }
}