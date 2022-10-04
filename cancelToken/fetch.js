// 作为浏览器原生提供的XHR构造函数的理想替代方案，新增的Fetch API为我们提供了Request和Response
// (以及其他与网络请求有关的)对象的通用定义，一个Request对象表示一个资源请求，通常包含一些初始数据和正文内容，
// 例如资源请求路径、请求方式、请求主体等，而一个Response对象则表示对一次请求的响应数据。同时Fetch API还为我们
// 提供了一个全局的fetch方法，通过该方法我们可以更加简单合理地跨网络异步获取资源。fetch方法不仅原生支持Promise
// 的链式操作，同时还支持直接传入Request对象来发送请求，增加了很强的灵活性。IE浏览器下的兼容性不容乐观，可以通过
// isomorphic-fetch或者whatwg-fetch这两个第三方依赖来解决兼容性问题

const url = 'http://www.some-domain.com/path/to/example';
const initData = {
  method: 'POST',
  body: JSON.stringify({key: value}),
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
  },
  cache: 'no-cache',
  credentials: 'same-origin',
  mode: 'cors',
  redirect: 'follow',
  referrer: 'no-referrer',
};
fetch(url, initData).then(response => response.json()).then(data => console.log(data));
const request = new Request(url, initData);
fetch(request).then(response => response.json()).then(data => console.log(data));

// 在XHR实例中可以通过abort方法来取消请求，在Axios中可以通过CancelToken构造函数的参数来获得取消函数，从而通过取消函数来取消请求。
// 但是很遗憾的是，在Fetch API中，并没有自带的取消请求的API供我们调用。不过令人愉悦的是，除了IE浏览器外，其他浏览器已经为Abort API
// 添加了实验性支持，Abort API允许对XHR和fetch这样的请求操作在未完成时进行终止，那么接下来对Abort API做一下简要的介绍。
// 在Abort API的相关概念中主要包含了AbortController和AbortSignal两大接口：
// AbortController：表示一个控制器对象，该对象拥有一个只读属性signal和一个方法abort。
// signal属性表示一个AbortSignal实例，当我们需要取消某一个请求时，需要将该signal属性所对应的AbortSignal实例与请求进行关联，
// 然后通过控制器对象提供的abort方法来取消请求；
// AbortSignal：表示一个信号对象，作为控制器对象和请求之间通信的桥梁，允许我们通过控制器对象来对请求进行取消操作。
// 该对象拥有一个只读属性aborted和一个方法onabort，aborted属性体现为一个布尔值，表示与之通信的请求是否已经被终止，
// 而onabort方法会在控制器对象终止该请求时调用。

const abortableFetch = (url, initData) => {
    // 实例化控制器对象
    const abortController = new AbortController();
    
    // 获取信号对象
    const signal = abortController.signal;
    
    return {
      // 注意这里需要将 signal 信号对象与请求进行关联，关联之后才能通过 abortController.abort 方法取消请求
      ready: fetch(url, {...initData, signal}).then(response => response.json()),
      // 暴露 cancel 方法，用于在外层手动取消请求
      cancel: () => abortController.abort(),
    };
  };
  
  const {ready, cancel} = abortableFetch(url, initData);
  ready
    .then(response => console.log(response))
    .catch(err => {
      if (err.name === 'AbortError') {
        console.log('请求已被终止');
      }
    });
  
  // 手动取消请求
  cancel();