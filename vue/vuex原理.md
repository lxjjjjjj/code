# 总结
1）Vuex本质是一个对象, Vuex对象有两个属性，一个是install方法，一个是Store这个类
1) install方法的作用是将store这个实例挂载到所有的组件上，注意是同一个store实例。利用vue的mixin混入机制，在beforeCreate钩子前混入vuexInit方法，vuexInit方法实现将vuex store注册到当前组件的$store属性上。实现每个组件实例都拥有store实例对象。
2) Store这个类拥有commit，dispatch，getter，mutations这些方法，Store类里将用户传入的state包装成data，作为new Vue的参数，从而实现了state 值的响应式。
4）实现state的细节，要将传入的store对象的state赋值给new Vue的data对象完成响应式绑定，并且为了可以直接访问vue的data，要给Store类设置一个get方法返回this.vm.state达到直接访问state的效果
5) 实现getter的细节，通过给Store类的getter响应式(Object.defineProperty)绑定options.getter的方法并传入Store类的state实现，因为重写了get方法所以在执行getter的时候不需要写()调用getter方法。
6) 实现mutations的细节，mutations的实现类比上面的getter实现。Store类还提供了commit触发mutations机制，在实现commit的时候注意要用箭头函数实现，使用箭头函数，函数定义的位置决定了箭头函数的this一定是Store，因为如果在setTimeout这种this是window的情况下调用commit， 因为this是undefined 所以会报错。
7) actions的实现，actions的实现类比getter的实现，不过actions的第一个参数是Store类，所以传一个this进去，并且Store类提供了dispatch的方式调用
```   
   this.actions[method](arg)
```
# Vue项目中是怎么引入Vuex
1)安装Vuex，再通过import Vuex from 'vuex'引入
2)先 var store = new Vuex.Store({...}),再把store作为参数的一个属性值，new Vue({store})
3)通过Vue.use(Vuex) 使得每个组件都可以拥有store实例

## 综上分析vuex大致结构
```
//myVuex.js
class Store{}
let install = function(){}
let Vuex = {
    Store,
    install
}
export default Vuex
```
## 每个组件都有store对象
mixin的作用是将mixin的内容混合到Vue的初始参数options中，为什么是beforeCreate而不是created呢？因为如果是在created操作的话，$options已经初始化好了。如果判断当前组件是根组件的话，就将我们传入的store挂在到根组件实例上，属性名为$store。如果判断当前组件是子组件的话，就将我们根组件的$store也复制给子组件。注意是引用的复制，因此每个组件都拥有了同一个$store挂载在它身上。
```
Vue.mixin({
    beforeCreate(){
        if (this.$options && this.$options.store){ // 如果是根组件
            this.$store = this.$options.store
        }else { //如果是子组件
            this.$store = this.$parent && this.$parent.$store
        }
    }
})
```
## 实现vuex的state
使用
```
    <p>{{this.$store.state.num}}</p>
    export default new Vuex.Store({
        state: {
            num:0
        },
        mutations: {
        },
        actions: {
        },
        modules: {
        }
    })
```
实现
```
class Store{
    constructor(options){
        this.state = options.state || {}
    }
}
```
### 但是vuex的state里的值也是响应式的，那要怎么实现响应式呢？ 我们知道，我们new Vue（）的时候，传入的data是响应式的，那我们是不是可以new 一个Vue，然后把state当作data传入呢？ 没有错，就是这样。
```
class Store{
    constructor(options) {
        this.vm = new Vue({
            data:{
                state:options.state
            }
        })
    }
}
```
### 但是我们怎么获得state呢？好像只能通过this.$store.vm.state了？但是跟我们平时用的时候不一样，所以，是需要转化下的。
```
class Store{
    constructor(options) {
        this.vm = new Vue({
            data:{
                state:options.state
            }
        })
    }
    //新增代码
    get state(){
        return this.vm.state
    }
}
```
## 实现getter
```
//myVuex.js
class Store{
    constructor(options) {
        this.vm = new Vue({
            data:{
                state:options.state
            }
        })
        // 新增代码
        let getters = options.getter || {}
        this.getters = {}
        Object.keys(getters).forEach(getterName=>{
            Object.defineProperty(this.getters,getterName,{
                get:()=>{
                    return getters[getterName](this.state)
                }
            })
        })
    }
    get state(){
        return this.vm.state
    }
}

```
为什么用getter的时候不用写括号。要不是我学到这个手写Vuex，也不会想不明白，原来这个问题就像问我们平时写个变量，为什么不用括号一样。（如{{num}},而不是{{num()}}）,原来就是利用了Object.defineProperty的get接口。

## 实现mutation
```
//myVuex.js
class Store{

    constructor(options) {
        this.vm = new Vue({
            data:{
                state:options.state
            }
        })

        let getters = options.getter || {}
        this.getters = {}
        Object.keys(getters).forEach(getterName=>{
            Object.defineProperty(this.getters,getterName,{
                get:()=>{
                    return getters[getterName](this.state)
                }
            })
        })
        //新增代码
        let mutations = options.mutations || {}
        this.mutations = {}
        Object.keys(mutations).forEach(mutationName=>{
            this.mutations[mutationName] = (arg)=> {
                mutations[mutationName](this.state,arg)
            }
        })
        //新增代码 我们是怎么触发mutations的。this.$store.commit('incre',1),对，是这种形式的。可以看出store对象有commit这个方法。而commit方法触发了mutations对象中的某个对应的方法，因此我们可以给Store类添加commit方法.
        commit(method,arg){
            this.mutations[method](arg)
        }
    }
    get state(){
        return this.vm.state
    }
}
```
## 实现actions
```
//myVuex.js
class Store{
    constructor(options) {
        this.vm = new Vue({
            data:{
                state:options.state
            }
        })

        let getters = options.getter || {}
        this.getters = {}
        Object.keys(getters).forEach(getterName=>{
            Object.defineProperty(this.getters,getterName,{
                get:()=>{
                    return getters[getterName](this.state)
                }
            })
        })

        let mutations = options.mutations || {}
        this.mutations = {}
        Object.keys(mutations).forEach(mutationName=>{
            this.mutations[mutationName] =  (arg)=> {
                mutations[mutationName](this.state,arg)
            }
        })
        //新增代码
        let actions = options.actions
        this.actions = {}
        Object.keys(actions).forEach(actionName=>{
            this.actions[actionName] = (arg)=>{
                // 这里为什么是传this进去。这个this代表的就是store实例本身
                // 这是因为我们使用actions是这样使用的
                //   actions: {
                //      asyncIncre({commit},arg){
                //        setTimeout(()=>{
                //          commit('incre',arg)
                //        },1000)
                //    }
                //  },
                // 其实{commit} 就是对this，即store实例的解构
                actions[actionName](this,arg)
            }
        })

    }
    // 新增代码
    dispatch(method,arg){
        this.actions[method](arg)
    }
    // asyncIncre({commit},arg){
    //   setTimeout(()=>{
    //     commit('incre',arg)
    //   },1000)
    // }
    // 谁调用commit？？是$store吗？并不是。所以要解决这个问题，我们必须换成箭头函数
    commit=(method,arg)=>{
    console.log(method);
    console.log(this.mutations);
    this.mutations[method](arg)
    }
    <!-- commit(method,arg){
        console.log(this);
        this.mutations[method](arg)
    } -->
    get state(){
        return this.vm.state
    }
}
```
# vue.use的实现
```
Vue.use = function(plugin){
	const installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
	if(installedPlugins.indexOf(plugin)>-1){
		return this;
	}
	<!-- 其他参数 -->
	const args = toArray(arguments,1);
	args.unshift(this);
	if(typeof plugin.install === 'function'){
		plugin.install.apply(plugin,args);
	}else if(typeof plugin === 'function'){
		plugin.apply(null,plugin,args);
	}
	installedPlugins.push(plugin);
	return this;
}
```
1、在Vue.js上新增了use方法，并接收一个参数plugin。

2、首先判断插件是不是已经别注册过，如果被注册过，则直接终止方法执行，此时只需要使用indexOf方法即可。

3、toArray方法我们在就是将类数组转成真正的数组。使用toArray方法得到arguments。除了第一个参数之外，剩余的所有参数将得到的列表赋值给args，然后将Vue添加到args列表的最前面。这样做的目的是保证install方法被执行时第一个参数是Vue，其余参数是注册插件时传入的参数。

4、由于plugin参数支持对象和函数类型，所以通过判断plugin.install和plugin哪个是函数，即可知用户使用哪种方式祖册的插件，然后执行用户编写的插件并将args作为参数传入。

5、最后，将插件添加到installedPlugins中，保证相同的插件不会反复被注册。(~~让我想起了曾经面试官问我为什么插件不会被重新加载！！！哭唧唧，现在总算明白了)

