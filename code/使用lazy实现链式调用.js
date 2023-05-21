// // lazy函数可以链式调用，在调用函数的时候不会输出任何内容，当调用output时，输出前面每个函数的执行结果。

// // const lazyFun = lazy(2).add(2).top(console.log).delay(1000).multipy(3); 
// // 此时不会输出任何东西

// // setTimout(() => {
// //     lazyFun.output();
// // }, 1000);
// // console.log('start');


// // 输出内容
// // 'start'
// // 等待1000ms
// // 4
// // 4
// // 等待1000ms
// // 12

// // class中使用# class中声明的私有属性，无法在执行时获取，只有在class定义范围内才能访问这个私有属性image.pngimage.png

// // promise，aysnc/await

// // setTimeout

// // lazy函数可以访问add、top、delay、multipy方法，我们可以借助类来实现
// // lazy函数需要链式调用，所以函数的返回值需要是this
// // 在调用四个方法的时候，并没有输出结果，所以需要#cbs来保存函数调用记录
// // #cbs中的每项需要在output中区分执行，所以在记录的时候，使用了type区分类型
// // 对于add和multipy函数，调用output时再计算结果，所以在记录的时候，没有计算结果
// // 为什么要使用#定义属性，私有属性避免外面直接修改；其次前面看到这个知识点，练习下。

// class Lazy {
//     // 函数调用记录，私有属性
//     #cbs = [];
//     constructor(num) {
//         // 当前操作后的结果
//         this.res = num;
//     }

//     // output时，执行，私有属性
//     #add(num) {
//         this.res += num;
//         console.log(this.res);
//     }

//     // output时，执行，私有属性
//     #multipy(num) {
//         this.res *= num;
//         console.log(this.res)
//     }

//     add(num) {

//         // 往记录器里面添加一个add函数的操作记录
//         // 为了实现lazy的效果，所以没有直接记录操作后的结果，而是记录了一个函数
//         this.#cbs.push({
//             type: 'function',
//             params: num,
//             fn: this.#add
//         })
//         return this;
//     }
//     multipy(num) {

//         // 和add函数同理
//         this.#cbs.push({
//             type: 'function',
//             params: num,
//             fn: this.#multipy
//         })
//         return this;
//     }
//     top (fn) {

//         // 记录需要执行的回调
//         this.#cbs.push({
//             type: 'callback',
//             fn: fn
//         })
//         return this;
//     }
//     delay (time) {

//         // 增加delay的记录
//         this.#cbs.push({
//             type: 'delay',

//             // 因为需要在output调用是再做到延迟time的效果，利用了Promise来实现
//             fn: () => {
//                 return new Promise(resolve => {
//                     console.log(`等待${time}ms`);
//                     setTimeout(() => {
//                         resolve();
//                     }, time);
//                 })
//             }
//         })
//         return this;
//     }

//     // 关键性函数，区分#cbs中每项的类型，然后执行不同的操作
//     // 因为需要用到延迟的效果，使用了async/await，所以output的返回值会是promise对象，无法链式调用
//     // 如果需实现output的链式调用，把for里面函数的调用全部放到promise.then的方式
//     async output() {
//         let cbs = this.#cbs;
//         for(let i = 0, l = cbs.length; i < l; i++) {
//             const cb = cbs[i];
//             let type = cb.type;
//             if (type === 'function') {
//                 cb.fn.call(this, cb.params);
//             }
//             else if(type === 'callback') {
//                 cb.fn.call(this, this.res);
//             }
//             else if(type === 'delay') {
//                 await cb.fn();
//             }
//         }

//         // 执行完成后清空 #cbs，下次再调用output的，只需再输出本轮的结果
//         this.#cbs = [];
//     }
// }
// function lazy(num) {
//     return new Lazy(num);
// }

// const lazyFun = lazy(2).add(2).top(console.log).delay(1000).multipy(3)
// console.log('start');
// console.log('等待1000ms');
// setTimeout(() => {
//     lazyFun.output();
// }, 1000);

class Query {
    constructor(data) {
      this.data = data
    }
    cbs = []
    _where = (fn) => {
        return this.data.filter(fn)
    }
    _orderBy = (str) => {
      return this.data.sort((a, b) => a[str] - b[str])
    }
    _groupBy = (group) => {
        const res = {}, arr = []
        this.data.forEach(cur => {
          if(!res[cur[group]]) {
            res[cur[group]] = [cur]
          } else {
            res[cur[group]].push(cur)
          } 
        })
        Object.keys(res).forEach((key) => {
            return arr.push(res[key])
        })
        return arr
    }
    where = (fn) => {
      this.cbs.push(() => this._where(fn))
      return this
    }
    orderBy = (str) => {
      this.cbs.push(() => this._orderBy(str))
      return this
    }
    groupBy = (str) => {
      this.cbs.push(() => this._groupBy(str))
      return this
    }
    execute = () => {
      let res = []
      this.cbs.forEach(cb=> {
        res = cb()
        console.log('res', res)
      })
      return res
    }
  };
  const data = [
    { name: 'foo', age: 16, city: 'shanghai' },
    { name: 'bar', age: 24, city: 'hangzhou' },
    { name: 'fiz', age: 22, city: 'shanghai' },
    { name: 'baz', age: 19, city: 'hangzhou' }
  ];
  function query(data) {
        return new Query(data);
    }
    console.log(query(data)
      .where(item => item.age > 18)
    .orderBy('age')
    .groupBy('city')
    .execute())

    