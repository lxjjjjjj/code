```
// 重新渲染函数
function render() {
    stateIndex = 0;
    effectIndex = 0;
    ReactDOM.render(<App />, document.getElementById('root'));
}

// 存储上一次的依赖值
const preDepsAry = [];
let effectIndex = 0;
function useEffect(callback, depsAry) {
    // 判断callback是否是函数
    if (Object.prototype.toString.call(depsAry) !== '[object Array]') {
        throw new Error('useEffect 函数的第二个参数必须是数组');
    } else {
        // 获取上一次的状态值
        const prevDeps = preDepsAry[effectIndex];
        // 如果存在就去做对比，如果不存在就是第一次执行
        // // 将当前的依赖值和上一次的依赖值做对比， every如果返回true就是没变化，如果false就是有变化
        const hasChanged = prevDeps ? depsAry.every((dep, index) => dep === prevDeps[index]) === false : true;
        // 值如果有变化
        if (hasChanged) {
            callback();
        }
        // 同步依赖值
        preDepsAry[effectIndex] = depsAry;
        // 累加
        effectIndex++;
    }
}
```