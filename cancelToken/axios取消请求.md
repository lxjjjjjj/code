[原文链接](https://juejin.cn/post/7153831304042119198)
应用场景
取消请求在前端有时候会用到，以下是两个工作中可能会用到的场景

tab切换时刷新某个列表数据，如果他们共用一个变量存储数据列表，当请求有延时，可能会导致两个tab数据错乱；
导出文件或下载文件时，中途取消 。

如何取消请求
取消http请求，axios文档里提供了两种用法：
第一种：使用 CancelToken
const { CancelToken, isCanCel } = axios;
const source = CancelToken.source();

axios.get('/user/12345', {
  cancelToken: source.token
}).catch(thrown => {
  if (isCancel(thrown)) {
    // 获取 取消请求 的相关信息
    console.log('Request canceled', thrown.message);
  } else {
    // 处理其他异常
  }
});

axios.post('/user/12345', {
  name: 'new name'
}, {
  cancelToken: source.token
})

// 取消请求。参数是可选的，参数传递一个取消请求的相关信息，在 catch 钩子函数里能获取到
source.cancel('Operation canceled by the user.');

第二种：给构造函数 CancelToken 传递一个 executor 函数作为参数。这种方法的好处是，可以用同一个 cancel token 来取消多个请求
const CancelToken = axios.CancelToken;
let cancel;
axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // 参数 c 也是个函数
    cancel = c;
  })
});
// 取消请求，参数用法同上
cancel();

项目中用法示例
在一个真实的项目中，一般都会对axios进行二次封装，针对请求、响应、状态码、code等做处理。贴一个项目里常用的request.js:
import axios from 'axios'
import store from '@/store'
import { getToken } from '@/utils/auth'

// 创建一个 axios 实例，并改变默认配置
const service = axios.create({
  baseURL: process.env.BASE_API, // api 的 base_url
  timeout: 5000 // request timeout
})

// 请求拦截
service.interceptors.request.use(
  config => {
    // Do something before request is sent
    if (store.getters.token) {
      // 让每个请求携带token-- ['X-Token']为自定义key 请根据实际情况自行修改
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    // Do something with request error
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// 响应拦截
service.interceptors.response.use(
  response => response,
  error => {
    alert(error)
    return Promise.reject(error)
  }
)

export default service

对于某一个请求添加取消的功能，要在调用api时，加上cancelToken选项，使用时的示例：
// api.js
import request from 'request'
export function getUsers(page, options) {
  return request({
    url: 'api/users',
    params: {
      page
    },
    ...options
  })
}

// User.vue
import { CancelToken, isCancel } from 'axios'
import { getUsers } from 'api'
...
cancel: null
...

toCancel() {
  this.cancel('取消请求')
}

getUsers(1,
  {
    cancelToken:  new CancelToken(c => (this.cancel = c))
  }
)
.then(...)
.catch(err => {
  if (isCancel) {
    console.log(err.message)
  } else {
    ...
  }
})

以上，我们就可以顺顺利利地使用封装过的axios，取消某一个请求了。其原理无非就是把cancelToken的配置项，在调用api时加上，然后就可以在业务代码取消特定请求了。

批量取消请求

在 document 里的第二种方法已经说过：通过指定同一个cancel token来取消。但是，在上面的项目示例中，不能控制拿到相同的cancel token。我们可以换个思路：用数组保存每个需要取消的cancel token，然后逐一调用数组里的每一项即可：
// User.vue
import { CancelToken, isCancel } from 'axios'
import { getUsers } from 'api'

...

cancel: []

...

toCancel() {
  while (this.cancel.length > 0) {
    this.cancel.pop()('取消请求')
  }
}

getUser1(1,
  {
    cancelToken:  new CancelToken(c1 => (this.cancel.push(c1)))
  }
)

getUser2(2,
 {
  cancelTokem: new CancleTokem(c2 => (this.cancel.push(c2)))
 }
)

切换路由时，取消请求

上面讲了取消一个请求及页面内批量abort的方法，此外，还有一种需求——切换路由时，取消所有。
这里不详细赘述了，大概思路就是在请求拦截器里，统一加个token，并设置全局变量source控制一个cancel token，在路由变化时调用cancel方法。

http.interceptors.request.use(config => {
    config.cancelToken = store.source.token
    return config
}, err => {
    return Promise.reject(err)
})

router.beforeEach((to, from, next) => {
    const CancelToken = axios.CancelToken
    store.source.cancel && store.source.cancel()
    store.source = CancelToken.source()
    next()
})

// 全局变量
store = {
    source: {
        token: null,
        cancel: null
  }
}

取消请求的实现原理

cancelToken 的 source 方法维护了一个对象，里面包括了 token 令牌和 cancel 方法，token 来自与构造函数CancelToken，调用 cancel 方法后，token 的 promise 状态为 resolved，进而又调用了xhr的abort方法，取消请求成功。
来分析下取消请求是怎么实现的，先从一个简单的取消请求的例子开始：

var CancelToken = axios.CancelToken;
var source = CancelToken.source();
axios.get('/get?name=xmz', {
    cancelToken : source.token
}).then((response)=>{
    console.log('response', response)
}).catch((error)=>{
    if(axios.isCancel(error)){
        console.log('取消请求传递的消息', error.message)
    }else{
        console.log('error', error)
    }
})
// 取消请求
source.cancel('取消请求传递这条消息');

这就是一个简单的取消请求的例子，那么就从最开始的axios.CancelToken来看，先去axios/lib/axios.js文件中。
axios.CancelToken = require('./cancel/CancelToken');

不费吹灰之力，就找到了CancelToken，在例子中我们调用了source方法，那么就去axios/lib/cancel/CancelToken.js文件中看看这个source方法到底是干什么的？
CancelToken.source = function(){
    var cancel;
    var token = new CancelToken(function executor(c) {
        cancel = c
    })
    return {
        token : token,
        cancel : cancel
    }
}

source方法很简单，就是返回一个具有token和cancel属性的对象，但是token和cancel都是通过CancelToken这个构造函数来的，那么还在这个文件中向上看，找到CancelToken函数。
function CancelToken (executor){
    // ...
    // 判断executor是一个函数，不然就报错
    var resolvePromise;
    this.promise = new Promise(function(resolve){
        resolvePromise = resolve;
    })
    var token = this;
    // 以上token现在有一个promise属性，是一个未成功的promise对象；
    executor(function cancel(message){
        if(token.reason){
            return;
        }
        token.reason = new Cancel(message);
        resolvePromise(token.reason);
    })
    // 这个cancel函数就是 上面函数中的cancel，也就是source.cancel；
}

现在知道了source.cancel是一个函数，souce.token是一个实例化对象，暂时就知道这些，继续看文章最开始的例子，接下来是去发送请求了，最下面还有一行代码是执行souce.cancel();
souce.cancel就是用来触发取消请求的函数。
现在再回头来看，上面的cancel函数，cancel执行，给token加了一个reason属性，那么看下这个reason属性是什么吧，看下这个Cancel构造函数，在axios/lib/cancel/Cancel.js文件中
function Cancel(message){
    this.message = message
}

Cancel特别简单就是给实例化对象添加一个message属性，所以现在token.reason是一个具有message属性的对象了。
继续回到cancel函数中，resolvePromise函数执行了，那么token.promise对象，这个原本未变成，成功状态的promise，变成了成功状态了，并且将token.reason对象传递过去了。
简单总结一下，执行取消函数，就是让token的promise的状态变成了成功；
好了，突然发现分析中断了，变成成功状态又怎样了，怎么取消的呢？虽然现在的同步代码都执行完了，但是请求还没发送出去呢，我们还要去看发送请求的函数
在分析发送请求之前，再看下最开始的例子，和最普通的发送一个get请求还是有一点区别的，配置对象中多了，一个cancelToken的属性，值是token，到底起了什么作用呢，去axios/lib/adapters/xhr.js中一探究竟（这里只截取其中关于cancelToken的部分）。
// 在发送请求之前，验证了cancelToken，看来此处就是用来取消请求的；
if(config.cancelToken){
    // 具体是如何取消的，是在这个判断内定义的；
    config.cancelToken.promise.then(function(cancel){
        request.abort();
        reject(cancel);
        request = null;
    })
}
// 发送请求
request.send(requestData);

仔细看这只是一个promise的then函数，只有在promise的状态变成成功后才会执行，而刚才我们分析了，cancel就是让这个promise的状态变成成功，所以如果执行了，取消请求的函数，这个then就会执行，取消发送请求，并且把发送请求的promise变成reject,被axiox.get().catch()捕获；
流程已经清楚了，最后再总结一下:
执行cancel是让token的promise变成成功，在真正发送请求之前，验证token.promise的状态是否已经变了，如果变了，就取消请求，就是这样一个简单的思想来进行取消请求的。
