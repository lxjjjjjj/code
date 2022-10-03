# Promise的出现为了解决什么问题
## 解决回调地狱问题
```
setTimeout(()=>{
    doSomething();
    setTimeout(){
        doSomething();
        setTimeout(){
            doSomething();
            setTimeout(){
                doSomething();
            },1000};
        },1000};
    },1000};
,1000);
```
## 解决信任问题
GitHub上或自己都会有对xhr进行封装，例如Ajax，这些封装的第三方库的回调是否真的可靠呢？对成功或失败等回调能保证只调用一次吗.回调过早（一般是异步被同步调用）, 回调过晚或没有回调.

Promise有这些特征：
1.只能决议一次，决议值只能有一个，决议之后无法改变。
2.任何then中的回调也只会被调用一次。
所以Promise的特征保证了Promise可以解决信任问题。
## 解决捕获错误能力

```
p.then(res => {
    console.log('这是resovle的回调.then方法', res);
    console.log(undefinedData) //未定义的变量
})
.catch(reason => {
    console.log('这是reject的回调.catch方法', reason);
})
```