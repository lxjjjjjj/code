[简单概述koa内部实现中间件原理](https://juejin.cn/post/6854573208348295182)

# Koa中间件的作用
中间件主要用于请求拦截和修改请求或响应结果。一次Http请求通常包含很多工作，如请求体解析、Cookie处理、权限验证、参数验证、记录日志、ip过滤、异常处理。中间件功能是可以访问请求对象（request），响应对象（response）和应用程序的请求-响应周期中通过 next 对下一个中间件函数的调用。通俗来讲，利用这个特性在 next 之前对 request 进行处理，在 next 函数之后对 response 处理。Koa 的中间件模型可以非常方便的实现后置处理逻辑。

## 总结
在使用use函数创建中间件的时候，会将每个callback函数都添加到middleware数组中，createServer函数创建一个server实例之后，koa将req和res整合成ctx对象传给通过compose函数构建的middleware函数，在每个middleware函数中，都有ctx参数和next函数，如何做到让开发者自动调用每个中间件next函数实现中间件调用，在每个fn调用的时候都通过闭包变量i的值取到第i个middleware。
## 中间件例子

```
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log(1);
  await next();
  console.log(2);
});

app.use(async (ctx, next) => {
  console.log(3);
  await next();
  console.log(4);
});

app.use(async (ctx, next) => {
  ctx.body = 'Hello, Koa';
});

app.listen(3001);
```
## koa内部的实现

### use函数
省略了部分校验和转换的代码，use 函数最核心的就是 this.middleware.push(fn)  这句。将注册的中间件函数都缓存到 middleware 栈中，并且返回了 this 自身，方便进行链式调用
```
use(fn) {
  // 省略部分代码...
  this.middleware.push(fn);
  return this;
}
```
### 创建server服务

```
listen(...args) {
  const server = http.createServer(this.callback());
  return server.listen(...args);
}

```
http.createServer(RequestListener)接受请求侦听器函数作为参数。所以，this.callback()函数的调用返回 RequestListener函数。RequestListener函数接受请求对象（request）和 响应对象（response）两个参数。

callback 创建 RequestListener 请求侦听器函数
```
callback() {
  // compose 为中间件运行的核心
  const fn = compose(this.middleware);

  // handleRequest 就是 callback 函数返回的函数
  const handleRequest = (req, res) => {
    const ctx = this.createContext(req, res);
    return this.handleRequest(ctx, fn);
  };
  return handleRequest;
}
```

handleRequest 函数中的 const ctx = this.createContext(req, res) 将每次请求的 request（简称：req）和 response（简称：res） 对象结合创建一个 context（简称：ctx）上下文对象，并且创建三者的互相引用关系。当然，这不是本篇文章重点，只是简单带过。然后将 ctx 和 fn 交给 handleRequest 进行处理。

### compose的实现
```
function compose (middleware) {
  if (!Array.isArray(middleware)) 
    throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') 
      throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} ctx
   * @return {Promise}
   * @api public
   */
  return function fn (ctx, next) {
    // 简化了部分代码
    return dispatch(0)
    function dispatch (i) {
      let middlewareFn = middleware[i]
      try {
        return Promise.resolve(middlewareFn(ctx, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```
传递给 handleRequest 函数的 fn 就是如下代码：

```
return function fn (ctx, next) {
  // 简化了部分代码
  return dispatch(0)
  function dispatch (i) {
    let middlewareFn = middleware[i]
    try {
      // dispatch.bind(null, i + 1) 就是 middleware的next函数
      return Promise.resolve(middlewareFn(ctx, dispatch.bind(null, i + 1)));
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
```
### handleRequest 

每次请求都需要根据中间件注册的顺序进行中间件函数的执行

```
handleRequest(ctx, fn) {
  // 省略无关代码...
  const onerror = err => ctx.onerror(err);
  const handleResponse = () => respond(ctx);
  // 省略无关代码...
  return fn(ctx).then(handleResponse).catch(onerror);
}

```
将上下文对象（ctx）作为参数传入 fn 函数，在 fn 内部所有中间件全部执行完毕后，即调用 resolve 通知外部的 handleResponse 函数进行后续响应数据的处理。fn 内部首次调用 dispatch(0) 根据自定义下标 i 取出 middleware 栈中的第一个中间件函数 middlewareFn 。
async (ctx, next) => {
  console.log(1);
  await next();
  console.log(2);
}

执行第一个中间件函数，将 **上下文对象（ctx）和 dispatch.bind(null, i+1) **作为参数传递给中间件函数。首先执行 console.log(1) 打印 1，然后执行 await next() 将当前中间件函数的执行权转交给 next（即： dispatch(1) ）执行，则继续取出第二个中间件函数执行，如此类推，直到所有中间件都执行完毕。
所有中间件函数依次执行完毕后，最后执行的中间件函数出栈后，将执行权转交给前一个中间件函数的 await 出，继续代码的执行。

# 洋葱圈模型

基于函数的入栈和出栈

# 总结 

中间件函数的 next 不是直接调用的下一个中间件函数，而是调用的 fn 内部的 dispatch 函数，由它来调用下一个中间件函数并传递上下文对象（ctx）和自身（dispatch）。


中间件函数的执行顺序和注册顺序一致, 先 use 的中间件函数先执行。


一个中间件函数执行完毕，相应的 dispatch 函数将执行权转交给上一个中间件函数的 **await next()，**执行该中间件函数 await 后续的代码。


