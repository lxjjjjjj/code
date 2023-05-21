// https://juejin.cn/post/6946094725703139358
// 最基本的发布订阅模式
class SyncHook {
  constructor(args = []) {
      this._args = args;       // 接收的参数存下来
      this.taps = [];          // 一个存回调的数组
  }

  // tap实例方法用来注册回调
  tap(name, fn) {
      // 逻辑很简单，直接保存下传入的回调参数就行
      this.taps.push(fn);
  }

  // call实例方法用来触发事件，执行所有回调
  call(...args) {
      // 逻辑也很简单，将注册的回调一个一个拿出来执行就行
      const tapsLength = this.taps.length;
      for(let i = 0; i < tapsLength; i++) {
          const fn = this.taps[i];
          fn(...args);
      }
  }
}

// SyncBailHook的作用是当前一个回调返回不为undefined的值的时候，阻止后面的回调执行
class SyncBailHook {
  constructor(args = []) {
      this._args = args;
      this.taps = [];
  }

  tap(name, fn) {
      this.taps.push(fn);
  }

  // 其他代码跟SyncHook是一样的，就是call的实现不一样
  // 需要检测每个返回值，如果不为undefined就终止执行
  call(...args) {
      const tapsLength = this.taps.length;
      for(let i = 0; i < tapsLength; i++) {
          const fn = this.taps[i];
          const res = fn(...args);

          if( res !== undefined) return res;
      }
  }
}

// 实例化一个加速的hook
const accelerate = new SyncHook(["newSpeed"]);

// 注册第一个回调，加速时记录下当前速度
accelerate.tap("LoggerPlugin", (newSpeed) =>
  console.log("LoggerPlugin", `加速到${newSpeed}`)
);

// 再注册一个回调，用来检测是否超速
accelerate.tap("OverspeedPlugin", (newSpeed) => {
  if (newSpeed > 120) {
    
    console.log("OverspeedPlugin", "您已超速！！");
  }
});

// 触发一下加速事件，看看效果吧
accelerate.call(500);


