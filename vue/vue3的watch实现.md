# vue3 中 watch 的实现
watch函数的实现利用了effect和scheduler(当副作用函数存在scheduler选项，当响应式数据发生变化时，会触发scheduler调度函数执行，而不是直接触发副作用函数执行)

```
function watch(source, cb){
    let getter 
    // 如果source是函数，说明用户传递的是getter所以直接把source赋值给getter
    if(typeof source === 'function'){
        getter = source
    } else {
      // 否则按照原来的实现 traverse 递归的读取
        getter = () => traverse(source)
    }
    // 定义新值和旧值
    let oldValue,newValue
    const job = () => {
      // 在scheduler中得到的是新值
        newValue = effectFn()
        cb(newValue, oldValue)
        // 每次被触发执行完后，更新旧值
        oldValue = newValue
    }
    const effectFn = effect(
        // 有用到source任何值的地方就会触发effectFn的执行
        ()=> getter(source),
        {
            // 利用lazy没有马上执行回调函数，而是在触发的更新的时候执行回调函数
            lazy: true,
            scheduler: () => {
              // flush是pre是立即执行immediate
              // flush是post是在dom更新之后执行
              // 默认 sync 同步执行
                if(options.flush === 'post'){
                    const p = Promise.resolve()
                    p.then(job)
                }else{
                    job()
                }
            }
        }
    )
    if(options.immediate){
        job()
    }else{
       // 手动调用effectFn拿到的是旧值
        oldValue = effectFn()
    }
}

function traverse(value, seen = new Set()){
    // set是为了处理循环依赖的问题
    if(typeof value !== 'object' || value === null || seen.has(value)) return
    seen.add(value)
    for(const k in value){
        traverse(value[k], seen)
    }
}
```

对于在watch中根据值的变化发送请求的竞态问题，vue3 提供了 onInvalidate函数，该函数会在数据更新之前执行，并且会清除副作用。保证watch的副作用函数不被调用。

竞态问题如下
```
let finalData
watch(obj, async () => {
    const res = await fetch('/path/to/request')
    finalData = res
})
如果请求A比请求B先发出，但是请求B比请求A先返回，导致最后finalData存储的是请求A中的结果显然不对
```
所以请求A的结果显然是过期的，所以我们需要一个让请求A的结果过期的手段。最后达到的效果就是后执行的effect失效不会执行
```
watch(obj, async(newVal, oldValue, onInvalidate) => {
    // 定义一个标志，代表当前副作用函数是否过期，默认为 false 代表没有过期
    let expired = false
    onInvalidate(() => {
        // 当过期时，将expired设置为true
        expired = true
    })
    const res = await fetch('/path/to/request')
    if (!expired) {
        finalData = res
    }
})
```
onInvalidate是什么原理呢
```
function watch(source, cb){
    let getter 
    if(typeof source === 'function'){
        getter = source
    } else {
        getter = () => traverse(source)
    }
    let oldValue,newValue
    // cleanup用来存储用户注册的过期回调
    let cleanup
    // 定义 onInvalidate 函数
    function onInvalidate(fn) {
        cleanup = fn
    }
    const job = () => {
        newValue = effectFn()
        if(cleanup) {
            cleanup()
        }
        // 将 onInvalidate 作为 回调函数的第三个参数，便于用户使用
        cb(newValue, oldValue, onInvalidate)
        oldValue = newValue
    }
    const effectFn = effect(
        ()=> getter(source),
        {
            lazy: true,
            scheduler: () => {
                if(options.flush === 'post'){
                    const p = Promise.resolve()
                    p.then(job)
                }else{
                    job()
                }
            }
        }
    )
    if(options.immediate){
        job()
    }else{
        oldValue = effectFn()
    }
}
```