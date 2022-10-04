/**
 * @description: 基于 XHR 封装的网络请求工具函数
 * @param {String} url 请求接口地址
 * @param {Document | XMLHttpRequestBodyInit | null} body 请求体
 * @param {Object} requestHeader 请求头
 * @param {String} method 请求方法
 * @param {String} responseType 设置响应内容的解析格式
 * @param {Boolean} async 请求是否异步
 * @param {Number} timeout 设置请求超时时间(单位：毫秒)
 * @param {Boolean} withCredentials 设置跨域请求是否允许携带 cookies 或 Authorization header 等授权信息
 * @return {Promise} 可包含响应内容的 Promise 实例
*/
function request({
  url,
  body = null,
  requestHeader = {'Content-Type': 'application/x-www-form-urlencoded'},
  method = 'GET',
  responseType = 'text',
  async = true,
  timeout = 30000,
  withCredentials = false,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!url) {
      return reject(new TypeError('the required parameter [url] is missing.'));
    }
    
    if (method.toLowerCase() === 'get' && body) {
      url += `?${request.serialize(body)}`;
      body = null;
    }
    
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, async);

    // 将请求接口地址以及请求体和 XHR 实例存入 cache 中
    let cacheKey = url;
    if (body) {
      cacheKey += `_${request.serialize(body)}`;
    }

    // 每次发送请求之前将上一个未完成的相同请求进行中断
    request.cache[cacheKey] && request.clearCache(cacheKey);
    request.cache[cacheKey] = xhr;

    if (async) {
      xhr.responseType = responseType;
      xhr.timeout = timeout;
    }
    xhr.withCredentials = withCredentials;

    if (requestHeader && typeof requestHeader === 'object') {
      Object.keys(requestHeader).forEach(key => xhr.setRequestHeader(key, requestHeader[key]));
    }

    xhr.onreadystatechange = function onReadyStateChange() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
          // 请求完成之后清除缓存
          request.clearCache(cacheKey);
          resolve(xhr.response);
        }
      }
    };

    xhr.onerror = function onError(error) {
      console.log(error);
      // 请求报错之后清除缓存
      request.clearCache(cacheKey);
      reject({ message: '请求出错，请稍后重试' });
    };

    xhr.ontimeout = function onTimeout() {
      reject({ message: '接口超时，请稍后重试' });
    };

    xhr.send(body ? JSON.stringify(body) : null);
  });
}

// 调用
request({
  url: 'http://www.some-domain.com/path/to/example',
  method: 'POST',
  requestHeader: {'Content-Type': 'application/json; charset=UTF-8'},
  body: {key: value}
}).then(response => console.log(response));

// 在XHR实例上为我们提供了一个abort方法用于终止该请求，并且当一个请求被终止的时候，该请求所对应的XHR实例的readyState属性将会被设置为XMLHttpRequest.UNSET(0)，同时status属性会被重置为0，因此在本示例中我们同样使用abort方法来实现请求中断。

// 我们通过request.cache来临时存储请求接口地址以及请求体和XHR实例的映射关系，因为在同一页面中一般可能会涉及到多个接口地址不同的请求，或者同一个请求对应不同的请求体，因此这里考虑加上了请求体以做区分。当然为了作为request.cache中的唯一键名，我们还需要对请求体进行序列化操作，因此简单封装一个序列化工具函数。

// 参考以上示例
function request({
  // 省略入参
} = {}) {
  return new Promise((resolve, reject) => {
    // 省略代码
  });
}

// 存储请求接口地址以及请求体和 XHR 实例的映射关系
request.cache = {};

/**
 * @description: 根据提供的键名中断对应的请求 
 * @param {String} key 存储在 request.cache 属性中的键名，若未提供则中断全部请求 
 * @return {void}
 */
request.clearCache = (key) => {
  if (key) {
    const instance = request.cache[key];
    if (instance) {
      instance.abort();
      delete request.cache[key];
    }

    return;
  }

  Object.keys(request.cache).forEach(cacheKey => {
    const instance = request.cache[cacheKey];
    instance.abort();
    delete request.cache[cacheKey];
  });
};

/**
 * @description: 将请求体序列化为字符串
 * @param {Document | XMLHttpRequestBodyInit | null} data 请求体
 * @return {String} 序列化后的字符串
 */
request.serialize = (data) => {
  if (data && typeof data === 'object') {
    const result = [];

    Object.keys(data).forEach(key => {
      result.push(`${key}=${JSON.stringify(data[key])}`);
    });

    return result.join('&');
  }

  return data;
}