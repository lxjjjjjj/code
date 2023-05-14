// Axios想必是我们使用最多的一个第三方开源免费的HTTP库，其本身基于Promise的特性使得我们可以很方便地写出
// 更加优雅且易维护的代码，从而避免函数多层嵌套所带来的一系列问题。当然，它最大的特点在于可以同时兼容浏览器端
// 和NodeJS服务端。底层通过判定不同的运行环境来自动提供不同的适配器，在浏览器端通过原生的XHR对象来发送请求，
// 而在NodeJS服务端则通过内置的http模块来发送请求。不仅如此，在其底层的Promise管道链中还为我们暴露了称之为
// 拦截器的入口，使得我们可以参与到一个请求的生命周期中，在请求发送之前和响应接收之后能够自定义实现数据的装配和
// 转换操作。带来的如此之多的人性化操作，使得我们没有理由不去用它，这也奠定了其长久以来依旧如此火爆的基础。

// 导入 axios
import qs from 'qs';
import { CacheUtils } from './cacheUtils.js.js';
import axios from 'axios';
// 创建 axios 实例
const instance = axios.create({
  baseURL: 'https://www.some-domain.com/path/to/example',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});
// 设置 axios 实例默认配置
instance.defaults.headers.common['Authorization'] = '';
instance.defaults.headers.post['Content-Type'] = 'application/json; charset=UTF-8';

// 自定义请求拦截器
instance.interceptors.request.use(config => {
  let cacheKey = config.url;

  const token = window.localStorage.getItem('token');
  token && (config.headers['Authorization'] = token);
  
  const method = config.method.toLowerCase();
  if (method === 'get' && config.params && typeof config.params === 'object') {
    cacheKey += qs.stringify(config.params, { addQueryPrefix: true });
  }
  
  if (['post', 'put', 'patch'].includes(method) && config.data && typeof config.data === 'object') {
    config.data = qs.stringify(config.data);
    cacheKey += `_${qs.stringify(config.data, { arrayFormat: 'brackets' })}`;
  }
  
  // 每次发送请求之前将上一个未完成的相同请求进行中断
  CacheUtils.cache[cacheKey] && CacheUtils.clearCache(cacheKey);
  
  // 将当前请求所对应的取消函数存入缓存
  config.cancelToken = new axios.CancelToken(function executor(c) {
    CacheUtils.cache[cacheKey] = c;
  });
  
  // 临时保存 cacheKey，用于在响应拦截器中清除缓存
  config.cacheKey = cacheKey;
  
  return config;
}, error => Promise.reject(error));

// 自定义响应拦截器
instance.interceptors.response.use(response => {
  // 响应接收之后清除缓存
  const cacheKey = response.config.cacheKey;
  delete CacheUtils.cache[cacheKey];
  if (response.status === 200) {
    return Promise.resolve(response.data);
  }
  
  return Promise.reject(response);
}, error => {
    if (error.config) {
        const cacheKey = error.config.cacheKey;
        delete CacheUtils.cache[cacheKey];
    }
    Promise.reject(error)
});

// 接下来我们结合Axios提供的CancelToken构造函数来创建一个简单的post请求：
const CancelToken = axios.CancelToken;
let cancel;

instance.post('/api/user/123', {
  name: 'new name',
  phone: 'new phone',
}, {
  // CancelToken 构造函数接收一个 executor 函数参数，并且该函数接收一个取消函数 c 用于取消该次请求
  cancelToken: new CancelToken(function executor(c) {
    // 将取消函数赋值到外部变量，方便从外部取消请求
    cancel = c;
  }),
});

// 手动取消请求
cancel();

// 针对需要同时取消多个请求以及自动取消的应用场景，上面的示例显然不能满足我们的需求。
// 这里我们同样可以利用上一小节的思路来维护一个请求接口地址以及请求体和取消函数c之间的映射关系。
// 同时为了避免在每个请求中都需要手动去实例化CancelToken，我们可以巧妙利用request拦截器来整合这部分的逻辑，
// 实现逻辑复用。首先我们将缓存逻辑拆分到一个单独的文件中：
// cacheUtils.js
export const CacheUtils = {
  // 存储请求接口地址以及请求体和取消函数之间的映射关系
  cache: {},
  
  // 根据提供的键名 key 取消对应的请求，若未提供则取消全部请求
  clearCache: function (key) {
    if (key) {
      const cancel = this.cache[key];
      if (cancel && typeof cancel === 'function') {
        cancel();
        delete this.cache[key];
      }

      return;
    }

    Object.keys(this.cache).forEach(cacheKey => {
      const cancel = this.cache[cacheKey];
      cancel();
      delete this.cache[cacheKey];
    });
  },
};

const arr = new Array(10);
arr.fill(0);
console.log(arr)


