# v-if 和 v-for 哪个优先级更高 如果同时出现，应该怎么优化得到更好的性能

```
(function anonymous(){
    with(this){return _c('div',{
    attrs:{
        "id":"demo"}
    },
    [_c('h1',[_v("一段注释")]),
    (isFolder)?_l((children),function(child){
        return _c('p',[....])
    })
    ]
    )}
})

在vue源码的src/compiler/codegen getElement方法中看到for优先于if被解析
v-for优先于v-if被解析
如果v-for和v-if同时存在 vue编译解析后的函数
会在for循环的每个循环中加入if判断,每次循环都会判断条件再进行渲染， 那么这样就非常不合理。要避免出现这种情况，需要在v-for外面嵌套含有v-if的template渲染。

如果每个列表数据都有不能避免的循环，那么建议在compute属性中做完判断再渲染避免重复的计算。
```