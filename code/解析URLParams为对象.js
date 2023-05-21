let url = 'http://www.domain.com/?user=anonymous&id=123.0&id=456.1&city=%E5%8C%97%E4%BA%AC&enabled';
console.log(parseParam1(url))
/* 结果
{ user: 'anonymous',
  id: [ 123, 456 ], // 重复出现的 key 要组装成数组，能被转成数字的就转成数字类型
  city: '北京', // 中文需解码
  enabled: true, // 未指定值得 key 约定为 true
}
*/
function parseParam(url) {
  const paramsStr = /.+\?(.+)$/.exec(url)[1]; // 将 ? 后面的字符串取出来
  const paramsArr = paramsStr.split('&'); // 将字符串以 & 分割后存到数组中
  let paramsObj = {};
  // 将 params 存到对象中
  paramsArr.forEach(param => {
    if (/=/.test(param)) { // 处理有 value 的参数
      let [key, val] = param.split('='); // 分割 key 和 value
      val = decodeURIComponent(val); // 解码
      val = /^\d+$/.test(val) ? parseFloat(val) : val; // 判断是否转为数字

      if (paramsObj.hasOwnProperty(key)) { // 如果对象有 key，则添加一个值
        paramsObj[key] = [].concat(paramsObj[key], val);
      } else { // 如果对象没有这个 key，创建 key 并设置值
        paramsObj[key] = val;
      }
    } else { // 处理没有 value 的参数
      paramsObj[param] = true;
    }
  })

  return paramsObj;
}

function parseParam1(url) {
  // 获取url 参数
  const urlParamsStr = url.split('?')[1]
  const urlParamsArr = urlParamsStr.split('&')
  if (!urlParamsArr.length) return {}

  return urlParamsArr.reduce((prev, next) => {
    let [key, value] = next.split('=')
    if (value) {
      // 进行解码
      value = decodeURIComponent(value)
      // 判断是否为数字
      value = Number(value) ? parseFloat(value) : value
      if (prev[key]) prev[key] = [].concat(prev[key], value)
      else prev[key] = value
    } else {
      prev[key] = true
    }
    return prev
  }, {})
}
