1）更好的状态复用

对于vue2来说，使用的是mixin进行混入，会造成方法与属性的难以追溯。
随着项目的复杂，文件的增多，经常会出现不知道某个变量在哪里引入的，几个文件间来回翻找，
同时还会出现同名变量，相互覆盖的情况……😥

2）更好的代码组织

vue2的属性是放到data中，方法定义在methods中，修改某一块的业务逻辑时，
经常会出现代码间来回跳转的情况，增加开发人员的心智负担
使用Hooks后，可以将相同的业务逻辑放到一起，高效而清晰地组织代码

3）告别this

this有多种绑定方式，存在显示绑定、隐式绑定、默认绑定等多种玩法，里边的坑不是一般的多
vue3的setup函数中不能使用this，不能用挺好，直接避免使用this可能会造成错误的

