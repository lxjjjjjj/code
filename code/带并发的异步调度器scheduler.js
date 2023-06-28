// JS 实现一个带并发限制的异度调度器 Scheduler，保证同时运行的任务最多有两个。
// 完善下面代码中的 Scheduler 类，使得以下程序能正确输出。

class Scheduler {
  constructor() {
    this.waitTasks = []; // 待执行的任务队列
    this.excutingTasks = []; // 正在执行的任务队列
    this.maxExcutingNum = 2; // 允许同时运行的任务数量
  }

  add(promiseMaker) {
    if (this.excutingTasks.length < this.maxExcutingNum) {
      this.run(promiseMaker);
    } else {
      this.waitTasks.push(promiseMaker);
    }
  }

  run(promiseMaker) {
    const len = this.excutingTasks.push(promiseMaker);
    const index = len - 1;
    promiseMaker().then(() => {
      this.excutingTasks.splice(index, 1);
      if (this.waitTasks.length > 0) {
        this.run(this.waitTasks.shift());
      }
    })
  }
}

const myScheduler = new Scheduler()

myScheduler.add(() => new Promise(resolve => {
  setTimeout(() => {
    resolve('a')
    console.log('a')
  }, 1000)
}))

myScheduler.add(() => new Promise(resolve => {
  setTimeout(() => {
    resolve('b')
    console.log('b')
  }, 2000)
}))

myScheduler.add(() => new Promise(resolve => {
  setTimeout(() => {
    resolve('c')
    console.log('c')
  }, 5000)
}))

