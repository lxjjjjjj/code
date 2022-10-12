# 1、以promise的形式封装request方法
# 2、拦截器的实现
## 请求拦截器的实现
promise.then的fulfilled函数、promise.then的rejected函数
## 响应拦截器的实现
promise.then的fulfilled函数、promise.then的rejected函数

请求拦截器的chain队列 -> 真正请求的resolve/reject -> 响应拦截器的chain队列

# 3、多平台的兼容
微信-request/支付宝-httpRequest

# 4、参数序列化
get请求的参数/content-type是/application\/x-www-form-urlencoded/的POST或者PUT请求的参数以web接口的URLSearchParams规范序列化get请求的params

# cancelToken
利用传入参数cancelToken。cancalToken 本身是promise.resolve。当调用exec方法时让promise达到resolve的状态，因为promise的状态一旦改变就不会逆转。所以可以让还没发出请求的request取消请求。

# 请求优先级队列

建立正常等级的队列和低等级的队列，在每次发送请求的时候将请求根据优先级放到请求队列中,每发一次请求就开始循环将work放到队列中，先执行正常优先级的请求，然后执行低优先级的请求。如此循环直到workingList和workList还有lowWorkList都是空就停止，每次循环又个宏任务的间隔时间控制下一次异步开始的时间。




