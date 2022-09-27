# 什么是thread-loader
[webpack官网介绍-thread-loader](https://webpack.docschina.org/loaders/thread-loader/#root)
```
thread-loader会把它后面的loader放到worker pool中工作

工作再worker pool中的loader是有限制的

1.这些 loader 不能 通过 this.emitFile 生成一个新文件webpack 文档传送门 # this.emitFile
2.这些 loader 不能使用插件自定义的 loader 方法，所谓插件自定义就是通过插件向 loaderContext 扩展自定义的方法，loaderContext 是 webpack 提供的一个 loader 运行时的上下文对象；
3.这些 loader 同样也无法获取 webpack 打包的配置对象；

每个 worker 都是一个独立的 node.js 进程，其开销大约为 600ms 左右。同时会限制跨进程的数据交换。
请仅在耗时的操作中使用此 loader。

webpack.config.js

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve('src'),
        use: [
          "thread-loader",
          // 耗时的 loader （例如 babel-loader）
        ],
      },
    ],
  },
};
```
## thread-loader 的工作主要有以下几部分重点工作：
```
1.接管 loader；
2.workerPool 处理并发；
3.child_process 衍生实现 worker；
4.自定义管道完成进程间通信；
```
### 接管 loader

thread-loader 通过 pitching loader 截断 loader的运行过程，将 loader 运行工作接管。其实现大致如下

```
// 该 pitch 方法为 thread-loader.pitch 方法
function pitch() {
  const workerPool = getPool(options);

  const callback = this.async();

  workerPool.run(
    {
      // 通过 this.loaderIndex + 1 复制 thread-loader 以后的 loader
      loaders: this.loaders.slice(this.loaderIndex + 1).map((l) => {
        return {
          loader: l.path,
          options: l.options,
          ident: l.ident,
        };
      }),
      // ... 省略其他属性
    },
    (err, r) => {
      // 收集 loader 运行结果返回
      callback(null, ...r.result);
    }
  );
}

export { pitch }; // 实现 thread-loder.pitch 方法
```
从代码可以看出，thread-loader 实现了 pitch 方法，在该方法内，通过 this.loaderIndex + 1 获知哪些是需要被接管的 loader，this.loaderIndex 是一个索引，表示的是当前被运行的 loader 在所有该文件类型需要被应用的 loaders 中的索引位置；

thread-loader 把后面的 loader 作为一个选项传递给了 workerPool.run 方法，这个也就是下面的要说处理并发和调度的的 workerPool 对象。

### workerPool 处理并发
thread-loader 的重要特性就是并发执行 loader，这里的并发的实现和调度是通过 workerPool 这个对象实现的。顾名思义，workerPool 就是 worker 池子，负责调度里面的 worker 的。后面有个概念叫做 poolWorker，这两个是有明显区别的

workerPool 是 WorkerPool 的实例：

```
export default class WorkerPool {
  constructor(options) {
    // ... 

    // 调度 worker 的异步队列
    this.poolQueue = asyncQueue(
      this.distributeJob.bind (this), // 创建 worker 并分配任务给 worker 
      options.poolParallelJobs // 并发数
    );
    this.terminated = false;

    this.setupLifeCycle();
  }

  run(data, callback) {
    // ... 这里就是 pitch 方法中调用的 workerPool.run 方法
    this.poolQueue.push(data, callback)
  }

  distributeJob(data, callback) {
    // ... 寻找合适的 worker 并分配任务
  }
  createWorker() {
    // ... 创建 worker
  }
}
```

通过上面的代码可以看出 WorkerPool 这个类实例化的过程中创建了一个 poolQueue 对象，这个对象由 asyncQueue 方法返回，asyncQueue 来自另一个知名库 neo-async。

asyncQueue 接收调度函数 和 并发数量 两个参数，创建一个异步队列，并且提供了向队列中插入、移除、遍历的方法，方便进行异步队列的管理。

这里我们传递个 asyncQueue 的调度函数就是 this.distributeJob，传递个并发数量是 options.poolParallelJobs；当 poolQueue 对象接收到数据即 poolQueue.push 方法被调用时，poolQueue 内部会收集任务到队列中，然后并发调用调度函数（distributeJob 方法）消耗队列中任务，直到到达并发数量限。当并发数超限时就停止调度函数调用仅仅收集任务，直到有任务完成有闲置 worker 后才会重启调度函数的调用消耗队列。

asyncQueue 方法内部实现比较复杂，也不是本文的重点，这里就不在赘述 neo-async 内部的实现细节，感兴趣的朋友可以尝试尝试 neo-async 源码。

### child_process 实现 worker

上面有一个类是 WorkerPool，这个类是调度 worker 的，接下来我们看下 worker 的创建过程。thread-loader 的 worker 是子进程（child_process）实现的。WorkerPool.prototype.createWorker 方法负责创建 worker 实例
```
export default class WorkerPool {
  constructor(options) {}

  distributeJob(data, callback) {
    const newWorker = this.createWorker();

    newWorker.run(data, callback);
  }

  createWorker() {
    // 创建一个新 worker 实例
    const newWorker = new PoolWorker(
      {
        nodeArgs: this.workerNodeArgs,
        parallelJobs: this.workerParallelJobs,
      },
      () => this.onJobDone() // worker 的任务完成时要触发的回调
    );

    // 把 worker 实例放到 worker 池子中
    this.workers.add(newWorker);

    // 返回新建 worker
    return newWorker;
  }

  onJobDone() {  }
}

上面的代码中可以看出 worker 是 PoolWorker 的一个实例，这个类基于 child_process.spawn 方法衍生独立子进程创建 worker 实例：

class PoolWorker {
  constructor(options, onJobDone) {

    const sanitizedNodeArgs = (options.nodeArgs || []).filter((opt) => !!opt);

    this.worker = childProcess.spawn(
      process.execPath, // env 中 Node.js 的可执行文件路径
      [].concat(sanitizedNodeArgs).concat(workerPath, options.parallelJobs),
      {
        detached: true, // 独立
        stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'],
      }
    );
  }
}
```
### 自定义管道通信


```
在多进程架构中进程间通信是绕不开的话题，thread-loader 采用的是经典的自定义管道通信解决方案。这种自定义管道（匿名管道）允许有亲缘关系的进程间进行通信，在这里亲缘关系只父子进程关系。 在 thread-loader 中对通信的要求主要来自两方面：

对应 thread-loader 运行于子进程的 loader 在执行结束之后需要把 loader 的结果给到主进程，以便继续 webpack 的打包工作流；

运行在子进程的 loader 并没有获取原来的 loaderContext 的能力，子进程有些工作需要委托给主进程完成，待完成后再将结果发送给子进程；

有了上面的诉求，自定义管道可以完美胜任这一工作，其基于以下原理实现：

父进程创建管道，得到两个文件描述符指向两端；
被衍生的子进程同样获得相同文件描述符的管道；
管道的单向性，被父进程定义为读取管道的文件描述符子进程只能写；同理，被父进程定义为写的管道子进程只能读。数据从写入端流入，从读端流出。
```
#### 2.4.1 父进程定义管道
父进程定义管道则是通过 child_process.spawn 衍生子进程时指定 stdio[3] 和 stdio[4] 这两个管道，这两个管道就是自定义管道。而前三项 stdio[0]/stdio[1]/stdio[2] 分别对应 标准输入、标准输出、标准错误，代码如下：
```
class PoolWorker {
  constructor(options, onJobDone) {

    this.worker = childProcess.spawn(
      process.execPath, // env 中 Node.js 的可执行文件路径
      [].concat(sanitizedNodeArgs).concat(workerPath, options.parallelJobs),
      {
        detached: true, // 独立
        stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'], //  stdio[3] 和 stdio[4] 是自定义管道
      }
    );
    // readPipe 索引为 fd[3]，可读流对象
    // writePipe 索引为 fd[4] 可写流对象
    const [, , , readPipe, writePipe] = this.worker.stdio;

    //这两个通道并挂载到实例
    this.readPipe = readPipe;
    this.writePipe = writePipe;
  }
}
```
#### 2.4.2 子进程获取管道

```
在上文中 创建子进程要执行的脚本 workerPath 对应的 js 模块就是 src/worker.js，这个脚本将会在子进程中运行。子进程启动后会创建指定文件描述符的流对象实现管道代码如下：

// 子进程创建指定文件描述符的流对象
const writePipe = fs.createWriteStream(null, { fd: 3 }); // 父进程的 fd[3] 只读，子进程只写
const readPipe = fs.createReadStream(null, { fd: 4 }); // 父进程的 fd[4] 只写，子进程只读
```
#### 2.4.3 数据格式

```
thread-loader 进程间通信的数据格式为 JSON 格式的字符串，但是这些数据最终以 Buffer 的形式写入 Stream 对象中。为了更好的处理这个数据，thread-loader 设计了一种数据格式。

这种格式由两部分组成：

第一部分是 4 个字节代表的一个整数，这个整个表示真实的数据的长度；
第二部分是数据本身，所以无论是写入还是读取，首先要构造这种数据格式；
我们以读取为例，首先要读取 4 个字节的长度，得到长度后再读取长度个字节，然后再转换成真实数据；
```

```
readNextMessage() {
  // 读取长度
  this.readBuffer(4, (lengthReadError, lengthBuffer) => {

    // 得到长度后开始读取数据
    this.readBuffer(length, (messageError, messageBuffer) => {
         // 这里得到最终的数据

        // 下个事件循环接着读，实现源源不断的读取
        setImmediate(() => this.readNextMessage());
      });
    });

  });
}

// readBuffer 方法，从 readPipe 读取数据
readBuffer(length, callback) {
  readBuffer(this.readPipe, length, callback);
}
```
#### 3. 用 worker_threads 改写
在改写之前调研了 worker_threads 必须具备这些能力：

创建子线程执行某个 js 模块；
可以与主进程进行通信（这方面 worker_threads 做了实现，甚至还可以在各 worker 线程间通信）；
#### 2.1 worker_threads 实现 worker
```

对应 thread-loader 中调用 child_process.spawn() 启用新的进程运行 js 模块，这要求 worker_threads 可以创建线程并且无限制能力的执行 js 模块；
new worker_threads.Worker() 对应了这一能力，代码示例如下！

const { Worker } = require('worker_threads');
const woker = new Worker('dist/worker.js');
修改 thread-loader 中 WorkerPool 源码：

import { Worker } from 'worker_threads';
class PoolWorker {
  constructor(options, onJobDone) {

    const sanitizedNodeArgs = (options.nodeArgs || []).filter((opt) => !!opt);

    // 使用 worker_threads 下的 Worker 创建 woker 线程
    this.worker = new Worker(workerPath, {
      argv: [options.parallelJobs]
    })

    this.worker.unref();

    this.readNextMessage();
  }

}
经过上面的操作，把原来的子进程变成了子线程，据传创建线程的开销比创建进程的小，有希望改善一下性能。

```
#### 2.2 通信方式改写


```
thread-loader 使用 child_process 时的解决方案为自定义管道，stdio[3] 和 stdio[4] 的 'pipe' 便是文件描述符为 3、4 的自定义管道，一个用于发送，一个用于读取，如下：

improt child_process from 'child_process';

const worker = child_process.spawn('node', 'dist/worker.js', {
  stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']
});

// 自定义管道
cosnt [,,, readPipe, writePipe] = worker.stdio;
这期间并不需要子线程与子线程间通信，只需要子线程与主线程进行通信。如果用 worker_threads 改写，则要求各个 worker 线程与主进程进行通信。 worker_threads 对应的解决方案为：worker.postMessage & parentPort.postMessage。

前面已经详细介绍过 thread-loader 处理通信的过程，但是 worker_threads 在这方面有标准解决方案，所以就不需要前面那种复杂的设计了：在子线程中访问 parentPort，通过他把内容发送给主线程；在主线程中通过 worker.postMessage 即可把内容发送给子线程。
```
#### 2.2.1 父进程改造读写如下：

```
readNextMessage() {

  this.worker.on('message', message => {
    // message 即为子进程发来的数据
    message = JSON.parse(message, reviver);
  })
}
```

#### 2.2.2 改造父进程写入为 postMessage 方法：

```
writeJson(data) {
  this.worker.postMessage(JSON.stringify(data, replacer));
}
```

#### 2.2.3 改造 worker 线程读取数据

```
通过监听 parentPort 的 message 事件即可接收父进程发送来的数据：

function readNextMessage() {
  parentPort.on('message', (msg) => {
    msg = JSON.parse(msg, reviver);
  })
}
```

#### 2.2.4 改造子进程写入数据

```
通过 parentPort.postMessage 即可把数据发送到父进程，也就对应第一步的 message 事件监听；

function writeJson(data) {
  parentPort.postMessage(JSON.stringify(data, replacer))
}
```
### 三、 测速结果
3.1 child_process 版
avatar

以上测试结果使用支持 thread-loader 的 Mpx 版本在删除缓存的工况下得出
本人电脑 MBP intel i7 16G，运行命令为 npm run watch

从上面的测试结果对比来看，加入 thread-loader 后确实可以提升无缓存时打包速度，提速近 30%；

3.2 worker_threads 版
avatar

注：此表格的数据和上面表格使用的 thread-loadder 配置不一致；
以上测试结果仅配置了 babel-loader 和 ts-loader，poolParallelJobs 为默认值 cpus 核心数 - 1

上面的测试结果让我感受到不可思议，这是为什么呢？说好的创建 worker 线程的开销比创建子进程的开销小来着呢？
对比下来平均只快了 3s，甚至出现了使用 worker_threads 打包时间甚至会更长一些。

### 四、 排查问题
很显然上面的结果是出乎意料的，我迫切想知道发生了什么。最终我们决定参考以下几个维度来看看 worker_threads 和 child_process 的耗时情况；

loader 处理模块时长；
通信时长；
当并发数量设置为 1，忽略调度的工况；

#### 4.1 loader 处理模块时长
之所以测试这个速度，是猜测 worker 线程的资源可能比子进程要少，所以有可能导致运行性能差，所以耗时会长一些；我们通过在 worker.js 中调用 runLoaders 方法的回调中写日志的方式，对两种实现方式进行测试；

下面的运行时间是基于我的业务代码所得，并非 benchmark；
```
// worker.js
let dStart = Date.now();
_loaderRunner.default.runLoaders({
  loaders: data.loaders,
  resource: data.resource,
  readResource: _fs.default.readFile.bind(_fs.default),
  context: {}
}, (err, lrResult) => {
  // 获取 loader 结果的 回调函数
  writeF(`${data.resource}:${Date.now() - dStart}`); // 作差
})
大约有 599 个 request 被处理，因数据比较多所以放到了一个 cooper ，通过对模块时间求和。其中：

worker_threads 实现的 worker 用时 57692ms；
child_process 实现的 worker 用时 59763ms；
当然这个数据也跑了几次，但是没有求平均值，结果一致的，worker_threads 实现的 worker 用时比 child_process 的用时少一些，大约 2~3s。
但是这就更奇怪了，就整个构建流程来说，worker_threads 的总时长比 child_process 还是要长一些的，既然运行 loader 的时间比较少，那么这个多出来的时间消耗在哪里呢？

还有一个部分可能是耗时的原因 —— 通信时长！
```
#### 4.2 通信时长


```
接下来就需要统计通信耗时，我们同样通过在两个版本各自负责通信的方法中加入记录耗时日志的代码；记录日志也很简单，我们只需要在发送数据端记下发送时的时间戳，再接收消息的方法中取出，再和当前时间戳作差即可得到本次通信耗时；

伪代码实现如下：

 writeJson(data) {
    // 发送数据时记录开始时间
    data.dStart = Date.now();
    this.worker.postMessage(JSON.stringify(data, _serializer.replacer)); // this.worker.postMessage(data);
  }

onWorkerMessage(message, finalCallback) {
  // 收到时间戳记录日志
  const { dStart } = message;
  writeF(Date.now() - dStart);
}
```

```
通过多次运行发现，worker_threads 的通信耗时也低于 child_process 实现，举个比较明显的例子：

worker_threads 版通信 1210 次，总耗时 72493ms, 平均用时 59.91ms；
child_process 版本通信 1210 次，总耗时 137564ms，平均用时 113.6ms
这个结果令我更加迷惑，既然 worker_threads 通信效率明显比 child_process 的要高。那么为什么在总时长上仍然没有明显优势呢？

既然上面的 loader 运行耗时和通信耗时都不是降低 webpack 构建速度的因素，那么应该还有另一种情况，那就是 worker_threads 实现的 worker 在初期用掉了大量的硬件资源（CPU、内存），这导致 webpack 后段乏力，虽然前端赢得了一定时间，但是后续又被拉了回来。

接下来打包时通过观察电脑的监视器可以发现：

使用 worker_threads 实现的 thread-loader 构建时 CPU 峰值 330%，初期保持在 130% 附近，内存维持在 2.9G左右；

使用 child_process 版本构建时，CPU 峰值 180%，初期保持在 120% 附近，内存 1.8G 左右；

从监视器角度来讲，worker_threads 确实前期的消耗要大于 child_process，但是这种观察缺乏理论依据，那么如何可以更直观的感受到 worker_threads 的性能优于 child_process 呢？

我们可以把并发数改为 1，这样可以看下在忽略并发的情况下的运行结果，直观对比 worker_threads 和 child_process 两个版本的 worker 性能。
```

#### 4.3 1 个 worker 时

```
有了前面的推论，我们修改使用 thread-loader 的设置，将 poolParallelJobs 改为 1；此时，thread-loader 仅会创建一个 worker 来执行 loader。这样也就消除了线程（或进程）调度的影响。测试四次，结果如下：

avatar

通过上面的运行结果来看， worker_threads 在只有一个 worker 的情况下确实可以速度更快。这侧面反应了当 worker_threads 过多时，确实不利于构建速度的速度提升。
```
### worker_threads 局限性跟进
在后续的资料查阅过程中，发现了 thread-loader 仓库中的一个 issue，issue 的发起者也做过同样的工作，结果遇到的场景和笔者遇到的场景是一样的。

后面也有人回复了这个 issue，回复的主旨是当使用 worker_threads 创建的线程数超过 CPU 核心数时，性能非但不会提升反而会下降，但是具体原因没有透露太多。这方面同样也涉及到了我的知识盲区，若有大神能解惑，万分感谢~

通过对上面的测评，我们得出了现阶段 worker_threads 虽然具备了通信和无限制执行 js 模块的能力，但是还不能用于 thread-loader 中替换 child_process 实现的 worker，现阶段的主要问题在于随着并发数量的上升，worker_threads开销会更大，后续的构建流程就会被拖慢，导致原有的优势不复存在！

