# 1、以promise的形式封装request方法
```
/* eslint-disable no-undef */
import { buildUrl, getEnvObj, serialize, transformRes } from './util'

export default function request (config, mpx) {
  return new Promise((resolve, reject) => {
    const paramsSerializer = config.paramsSerializer || serialize
    const bodySerializer = config.bodySerializer || paramsSerializer

    if (config.params) {
      config.url = buildUrl(config.url, config.params, paramsSerializer)
      // 这个参数保留的话，若其value是响应式数据，在Android支付宝小程序中可能有问题
      delete config.params
    }

    const header = config.header || {}
    const contentType = header['content-type'] || header['Content-Type']
    if (/^POST|PUT$/i.test(config.method) && /application\/x-www-form-urlencoded/i.test(contentType) && typeof config.data === 'object') {
      config.data = bodySerializer(config.data)
    }

    const rawSuccess = config.success
    const rawFail = config.fail
    let requestTask
    let cancelMsg
    const cancelToken = config.cancelToken
    if (cancelToken) {
      cancelToken.then((msg) => {
        cancelMsg = msg
        requestTask && requestTask.abort()
      })
    }
    config.success = function (res) {
      res = Object.assign({ requestConfig: config }, transformRes(res))
      typeof rawSuccess === 'function' && rawSuccess.call(this, res)
      resolve(res)
    }
    config.fail = function (res) {
      res = Object.assign({ requestConfig: config }, transformRes(res))
      const err = cancelMsg !== undefined ? cancelMsg : res
      typeof rawFail === 'function' && rawFail.call(this, err)
      reject(err)
    }
    const envObj = getEnvObj()

    if (envObj && typeof envObj.request === 'function') {
      requestTask = envObj.request(config)
      return
    }

    if (__mpx_mode__ === 'ali' && typeof envObj.httpRequest === 'function') {
      requestTask = envObj.httpRequest(config)
      return
    }

    mpx = mpx || global.__mpx
    if (typeof mpx !== 'undefined' && typeof mpx.request === 'function') {
      // mpx
      const res = mpx.request(config)
      requestTask = res.__returned || res
      return
    }
    console.error('no available request adapter for current platform')
  })
}

```
# 2、请求和响应拦截器的实现
promise.then的fulfilled函数、promise.then的rejected函数

请求拦截器的chain队列 -> 真正请求的resolve/reject -> 响应拦截器的chain队列
```
import { isThenable } from './util'

export default class InterceptorManager {
  constructor () {
    this.interceptors = []
  }

  use (fulfilled, rejected) {
    const wrappedFulfilled = (result) => {
      const returnedResult = fulfilled(result)
      if (returnedResult === undefined) {
        return result
      } else {
        if (isThenable(returnedResult)) {
          return returnedResult.then((resolvedReturnedResult) => resolvedReturnedResult === undefined ? result : resolvedReturnedResult)
        }
        return returnedResult
      }
    }
    const interceptor = {
      fulfilled: wrappedFulfilled,
      rejected
    }
    this.interceptors.push(interceptor)
    return function remove () {
      const index = this.interceptors.indexOf(interceptor)
      index > -1 && this.interceptors.splice(index, 1)
    }
  }

  forEach (fn) {
    this.interceptors.forEach(interceptor => fn(interceptor))
  }
}

```
xfetch文件的做法
```
import requestAdapter from './request'
import InterceptorManager from './interceptorManager'

export default class XFetch {
  constructor (options, MPX) {
    this.requestAdapter = (config) => requestAdapter(config, MPX)
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  create (options) {
    return new XFetch(options)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      return this.requestAdapter(config)
    }

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    chain.push(request, undefined)

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}

```
# 3、多平台的兼容
微信-request/支付宝-httpRequest
微信-header/支付宝-headers
# 4、参数序列化
序列化数组和时间对象
```
export function serialize (params) {
  if (isURLSearchParams(params)) {
    return params.toString()
  }
  const parts = []
  forEach(params, (val, key) => {
    if (typeof val === 'undefined' || val === null) {
      return
    }

    if (isArray(val)) {
      key = key + '[]'
    }

    if (!isArray(val)) {
      val = [val]
    }

    forEach(val, function parseValue (v) {
      if (isDate(v)) {
        v = v.toISOString()
      } else if (isObject(v)) {
        v = JSON.stringify(v)
      }
      parts.push(encode(key) + '=' + encode(v))
    })
  })

  return parts.join('&')
}
```
xfetch的写法
```
export default class XFetch {
  constructor (options, MPX) {
    // this.requestAdapter = (config) => requestAdapter(config, MPX)
    // 当存在 useQueue 配置时，才使用 this.queue 变量
    this.requestAdapter = (config) => requestAdapter(config, MPX)
  }

  static normalizeConfig (config) {
    if (!config.url) {
      throw new Error('no url')
    }

    transformReq(config)

    if (!config.method) {
      config.method = 'GET'
    } else {
      config.method = config.method.toUpperCase()
    }

    const params = config.params || {}

    if (/^GET|DELETE|HEAD$/i.test(config.method)) {
      Object.assign(params, config.data)
      // get 请求都以params为准
      delete config.data
    }

    if (isNotEmptyObject(params)) {
      config.params = params
    }

    if (/^POST|PUT$/i.test(config.method)) {
      const header = config.header || {}
      let contentType = header['content-type'] || header['Content-Type']
      if (config.emulateJSON && !contentType) {
        header['content-type'] = 'application/x-www-form-urlencoded'
        config.header = header
      }
      delete config.emulateJSON
    }
  }

  create (options) {
    return new XFetch(options)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      // 对config进行以下正规化处理：
      // 1. 检查config.url存在
      // 2. 抹平微信/支付宝header/headers字段差异
      // 3. 填充默认method为GET, method大写化
      // 4. 抽取url中query合并至config.params
      // 5. 对于类GET请求将config.data移动合并至config.params(最终发送请求前进行统一序列化并拼接至config.url上)
      // 6. 对于类POST请求将config.emulateJSON实现为config.header['content-type'] = 'application/x-www-form-urlencoded'
      // 后续请求处理都应基于正规化后的config进行处理(proxy/mock/validate/serialize)
      XFetch.normalizeConfig(config)
      return this.requestAdapter(config)
    }

    chain.push(request, undefined)

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
```
## 组装get请求和参数

将params组装到url后面变成queryString data放到body中
```
export function buildUrl (url, params = {}, serializer) {
  if (!serializer) {
    serializer = serialize
  }
  const serializedParams = serializer(params)
  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams
  }

  return url
}
```
# cancelToken
利用传入参数cancelToken。cancalToken 本身是promise.resolve。当调用exec方法时让promise达到resolve的状态，promise.resolve内部没有异步逻辑所以要比请求的promise完成的快，所以执行request.abort()可以让请求取消
```
export default class CancelToken {
  constructor () {
    this.token = new Promise(resolve => {
      this.resolve = resolve
    })
  }
  exec (msg) {
    return new Promise(resolve => {
      this.resolve && this.resolve(msg)
      resolve()
    })
  }
}
```
在发出请求之前会判断是否有cancelToken
```
if (cancelToken) {
      cancelToken.then((msg) => {
        cancelMsg = msg
        requestTask && requestTask.abort()
      })
    }
```

# 请求优先级队列

建立正常等级的队列和低等级的队列，在每次发送请求的时候将请求根据优先级放到请求队列中,每发一次请求就开始循环将work放到队列中，先执行正常优先级的请求，然后执行低优先级的请求。如此循环直到workingList和workList还有lowWorkList都是空就停止，每次循环又个宏任务的间隔时间控制下一次异步开始的时间。

## useQueue
```
export default class RequestQueue {
  constructor (config) {
    if (!config.adapter) {
      console.error('please provide a request adapter ')
      return
    }
    this.adapter = config.adapter
    this.limit = config.limit || 10
    this.delay = config.delay || 0
    this.ratio = config.ratio || 0.3
    this.flushing = false
    this.workList = []
    this.lowWorkList = []
    this.workingList = []
    this.lowPriorityWhiteList = []
  }

  addLowPriorityWhiteList (rules) {
    if (!Array.isArray(rules)) {
      rules = [rules]
    }
    for (let rule of rules) {
      this.lowPriorityWhiteList.indexOf(rule) === -1 && this.lowPriorityWhiteList.push(rule)
    }
  }

  checkInLowPriorityWhiteList (url) {
    return this.lowPriorityWhiteList.some(item => {
      return item === '*' || (item instanceof RegExp ? item.test(url) : url.indexOf(item) > -1)
    })
  }

  request (requestConfig, priority) {
    let proxy = null
    const promise = new Promise((resolve, reject) => {
      proxy = {
        resolve,
        reject
      }
    })
    if (!priority) {
      priority = this.checkInLowPriorityWhiteList(requestConfig.url) ? 'low' : 'normal'
    }
    const work = {
      request: requestConfig,
      priority,
      promise: proxy
    }
    this.addWorkQueue(work)
    this.flushQueue()
    return promise
  }

  addWorkQueue (work) {
    switch (work.priority) {
      case 'normal':
        this.workList.push(work)
        break
      case 'low':
        this.lowWorkList.push(work)
        break
      default:
        this.workList.push(work)
        break
    }
  }

  delWorkQueue (work) {
    let index = this.workingList.indexOf(work)
    if (index !== -1) {
      this.workingList.splice(index, 1)
    }
  }

  flushQueue () {
    if (this.flushing) return
    this.flushing = true
    setTimeout(() => {
      this.workingRequest()
    }, this.delay)
  }

  workingRequest () {
    while (this.workingList.length < this.limit && this.workList.length) {
      let work = this.workList.shift()
      this.workingList.push(work)
      this.run(work)
    }
    // 对低优先级请求总有所保留，为之后的正常请求提供一个buffer
    const buffer = parseInt((this.limit - this.workingList.length) * this.ratio, 10) || 1
    const limit = this.limit - buffer
    while (this.workingList.length < limit && this.lowWorkList.length) {
      let work = this.lowWorkList.shift()
      this.workingList.push(work)
      this.run(work)
    }
    this.flushing = false
  }

  requestComplete (work) {
    this.delWorkQueue(work)
    this.flushQueue()
  }

  run (work) {
    this.adapter(work.request).then((res) => {
      work.promise.resolve(res)
      this.requestComplete(work)
    }, (err) => {
      work.promise.reject(err)
      this.requestComplete(work)
    })
  }
}

```
## xfetch的实现
```
export default class XFetch {
  constructor (options, MPX) {
    // this.requestAdapter = (config) => requestAdapter(config, MPX)
    // 当存在 useQueue 配置时，才使用 this.queue 变量
    if (options && options.useQueue && typeof options.useQueue === 'object') {
      this.queue = new RequestQueue({
        adapter: (config) => requestAdapter(config, MPX),
        ...options.useQueue
      })
    } else {
      this.requestAdapter = (config) => requestAdapter(config, MPX)
    }
  }

  addLowPriorityWhiteList (rules) {
    // when useQueue not optioned, this.quene is undefined
    this.queue && this.queue.addLowPriorityWhiteList(rules)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      return this.queue ? this.queue.request(config, priority) : this.requestAdapter(config)
    }

    chain.push(request, undefined)

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
```
# proxy代理
```
import { match } from 'path-to-regexp'
import { isArray, isFunction, isNotEmptyArray, isNotEmptyObject, isString, parseUrl, deepMerge } from './util'

/**
 * 匹配项所有属性值，在源对象都能找到匹配
 * @param test 匹配项
 * @param input 源对象
 * @returns {boolean}
 */
function attrMatch (test = {}, input = {}) {
  let result = true
  for (const key in test) {
    // value 值为 true 时 key 存在即命中匹配
    if (test.hasOwnProperty(key) && input.hasOwnProperty(key)) {
      if (test[key] === true) continue
      // value 如果不是字符串需要进行序列化之后再匹配
      const testValue = isString(test[key]) ? test[key] : JSON.stringify(test[key])
      const inputValue = isString(input[key]) ? input[key] : JSON.stringify(input[key])
      if (testValue !== inputValue) {
        result = false
      }
    } else {
      result = false
    }
  }
  return result
}

/**
 * 匹配 rule 中的对应项
 * @param config 原请求配置项
 * @param test 匹配配置
 * @returns {{matchParams, matched: boolean}}
 */
function doTest (config, test) {
  const { url, params = {}, data = {}, header = {}, method = 'GET' } = config
  const {
    url: tUrl = '',
    protocol: tProtocol = '',
    host: tHost = '',
    port: tPort = '',
    path: tPath = '',
    search: tSearch = '',
    params: tParams = {},
    data: tData = {},
    header: tHeader = {},
    method: tMethod = ''
  } = test

  const { baseUrl, protocol, hostname, port, path, search } = parseUrl(url)

  // 如果待匹配项为空，则认为匹配成功
  // url 匹配
  let urlMatched = false
  let matchParams = {}
  if (tUrl) {
    // 处理协议头
    const protocolReg = /^(?:\w+(\\)?:|(:\w+))\/\//

    const hasProtocol = protocolReg.exec(tUrl)

    let handledTUrl = tUrl

    if (hasProtocol) {
      if (!hasProtocol[1] && !hasProtocol[2]) {
        handledTUrl = tUrl.replace(':', '\\:')
      }
    } else {
      handledTUrl = (tUrl.startsWith('//') ? ':protocol' : ':protocol//') + tUrl
    }

    try {
      // 匹配结果参数
      const matcher = match(handledTUrl)
      const result = matcher(baseUrl)
      urlMatched = !!result
      matchParams = result.params
    } catch (error) {
      console.error('Test url 不符合规范，test url 中存在 : 或者 ? 等保留字符，请在前面添加 \\ 进行转义，如 https\\://baidu.com/xxx.')
    }
  } else {
    // protocol 匹配
    const protocolMatched = tProtocol ? tProtocol === protocol : true
    // host 匹配
    const hostMatched = tHost ? tHost === hostname : true
    // port 匹配
    const portMatched = tPort ? tPort === port : true
    // path 匹配
    const pathMatched = tPath ? tPath === path : true

    urlMatched = protocolMatched && hostMatched && portMatched && pathMatched
  }
  // search 匹配
  const searchMatched = tSearch ? search.includes(tSearch) : true
  // params 匹配
  const paramsMatched = isNotEmptyObject(tParams) ? attrMatch(tParams, params) : true
  // data 匹配
  const likeGet = /^GET|DELETE|HEAD$/i.test(method)
  const dataMatched = isNotEmptyObject(tData) ? attrMatch(tData, likeGet ? params : data) : true
  // header 匹配
  const headerMatched = isNotEmptyObject(tHeader) ? attrMatch(tHeader, header) : true
  // method 匹配
  let methodMatched = false
  if (isArray(tMethod)) {
    const tMethodUpper = tMethod.map((item) => {
      return item.toUpperCase()
    })
    methodMatched = isNotEmptyArray(tMethodUpper) ? tMethodUpper.indexOf(method) > -1 : true
  } else if (isString(tMethod)) {
    methodMatched = tMethod ? tMethod.toUpperCase() === method : true
  }

  // 是否匹配
  const matched = urlMatched && searchMatched && paramsMatched && dataMatched && headerMatched && methodMatched

  return {
    matched,
    matchParams
  }
}

/**
 * 处理 config
 * @param config 请求配置项
 * @param proxy 目标代理配置
 * @param matchParams 匹配完成后的参数
 * @returns {config}
 */
function doProxy (config, proxy, matchParams) {
  let finalConfig = config
  if (isNotEmptyObject(proxy)) {
    const { url = '', params = {}, data = {}, header = {}, method = 'GET' } = config
    const {
      url: pUrl = '',
      protocol: pProtocol = '',
      host: pHost = '',
      port: pPort = '',
      path: pPath = '',
      search: pSearch = '',
      params: pParams = {},
      data: pData = {},
      header: pHeader = {},
      method: pMethod = '',
      custom
    } = proxy

    // 如果存在 custom 直接执行 custom 函数获取返回结果
    if (isFunction(custom)) {
      return custom(config, matchParams) || config
    }

    const { baseUrl, protocol, hostname, port, path, search } = parseUrl(url)

    let finalUrl = baseUrl

    if (pUrl) {
      finalUrl = pUrl
      for (let k in matchParams) {
        // 替换 $
        const reg = new RegExp(`\\$${k}`, 'g')
        finalUrl = finalUrl.replace(reg, matchParams[k])
      }
    } else if (pProtocol || pHost || pPort || pPath) {
      const compoProtocol = pProtocol || protocol
      const compoHost = pHost || hostname
      const compoPort = pPort || port
      const compoPath = pPath || path
      finalUrl = compoProtocol + '//' + compoHost + (compoPort && ':' + compoPort) + compoPath
    }

    let finalSearch = pSearch || search
    if (finalSearch && !finalSearch.startsWith('?')) {
      finalSearch = '?' + finalSearch
    }

    finalUrl = finalUrl + finalSearch

    const finalHeader = Object.assign(header, pHeader)
    const finalParams = deepMerge(params, pParams)
    const likeGet = /^GET|DELETE|HEAD$/i.test(method)
    const finalData = deepMerge(likeGet ? params : data, pData)
    const finalMethod = pMethod || method

    finalConfig = {
      url: finalUrl,
      header: finalHeader,
      params: finalParams,
      data: finalData,
      method: finalMethod
    }
  }

  return finalConfig
}

// 请求拦截
export function requestProxy (options, config) {
  const configBackup = Object.assign({}, config) // 备份请求配置

  let newConfig = config

  options && options.some((item) => {
    const { test, proxy, waterfall } = item
    const { matched, matchParams } = doTest(configBackup, test)
    if ((isFunction(test.custom) && test.custom(configBackup)) || matched) {
      // 匹配时
      newConfig = doProxy(newConfig, proxy, matchParams)

      // waterfall 模式
      return !waterfall
    }
  })

  return Object.assign({}, configBackup, newConfig)
}

```
# 参数校验
```
import { match } from 'path-to-regexp'
import { isString, isArray, isFunction, isObject, isNotEmptyObject, isNotEmptyArray, parseUrl, type, doTest } from './util'

/**
 * 校验参数是否正确
 * @param rules 参数规则
 * @param config 参数实例
 * @returns {boolean}
 */
export function doValidator(rules, config, url, greedy) {
  // 错误的result length不为0的时候 不发送请求
  let errorResult = []
  // warning的result length不为0的时候 也会发送请求 只是一个warning
  let warningResult = []
  let ruleBackUp = Object.assign({},rules)
  for(let key in config){
    // 没添加校验规则但是参数里有这个属性但是无需校验所有参数
    if(!ruleBackUp[key] && typeof greedy !=='undefined' && !greedy){
      continue
    }
    // 没添加校验规则但是参数里有这个属性
    if(!ruleBackUp[key]){
      errorResult.push(`请给${key}属性添加校验规则`)
      continue
    }

    // 参数值是undefined或者是null
    if(config[key] === undefined || config[key] === null){
      warningResult.push(`${key}参数的值是null或undefined`)
      continue
    }

    // 有校验规则并且参数里也有这个属性
    switch(ruleBackUp[key]?.type){
      //校验type是undefined
      case undefined:
        warningResult.push(`请给${key}属性添加type类型`)
        break;
      // 校验enum类型
      case 'enum':
        isNotEmptyArray(ruleBackUp[key].include) ?
        !(ruleBackUp[key].include.indexOf(config[key]) > -1) && errorResult.push(`${key}属性枚举值不正确`)
        : errorResult.push(`${key}属性枚举值为空数组`)
        break;
      // any类型不校验
      case 'any':
        break;
      // 自定义参数校验
      case 'custom':
        if (isFunction(ruleBackUp[key].custom)) {
          let customRes = ruleBackUp[key].custom(config)
          customRes && errorResult.push(customRes)
        } else {
          errorResult.push(`如果是自定义类型校验请添加自定义校验函数`)
        }
        break;
      // 一般属性校验
      default:
        let typeMatched
        try{
          if (isArray(ruleBackUp[key].type)) {
            const vType = ruleBackUp[key].type.map((item) => {
              return item.toLowerCase()
            })
            isNotEmptyArray(vType) ?  
              typeMatched = vType.indexOf(type(config[key]).toLowerCase()) > -1 
              : warningResult.push(`${key}属性校验type为空数组`)
          } else if (isString(ruleBackUp[key].type)) {
            typeMatched = type(config[key]).toLowerCase() === ruleBackUp[key].type.toLowerCase()
          }
          !typeMatched && errorResult.push(`${key}属性类型不正确`)
        }catch(err){
          errorResult.push(err.toString())
        }
    }
  
    ruleBackUp[key] && delete ruleBackUp[key]
  }
  // 添加了校验规则但是参数里没有的属性且require为true的情况
  Object.keys(ruleBackUp).forEach(key=>{
    if(ruleBackUp[key]?.require){
      errorResult.push(`请添加必传的${key}属性`)
    }
  })
  console.warn(' validator url ',url ,'warningResult',warningResult)
  return {
    valid: !errorResult.length,
    message: errorResult,
    url,
    warningResult: warningResult.join(',')
  }
}
// 请求拦截
export function Validator(options, config) {
  let result
  options && options.some((item) => {
    const { test, validator, waterfall, greedy } = item
    const matched = isFunction(test.custom) ? test.custom(config) : doTest(config, test).matched
    if (matched) {
      if(isFunction(validator.custom)){
        result = validator.custom(config)
        return true
      }
      // 如果checkType是true那么表示validator下是不区分data和params分开校验的
      const checkType = validator[Object.keys(validator)[0]] && Object.keys(validator[Object.keys(validator)[0]]).includes('type') && !isObject(validator[Object.keys(validator)[0]]?.type)
      const isPostMethod = /^POST|PUT$/i.test(config.method)
      if(checkType){
        result =  doValidator(validator, Object.assign({}, config.params, config.data), test.path, greedy)
      }else{
        if(isPostMethod){
          let dataRes = doValidator(validator.data, config.data, test.path, greedy)
          let paramsRes = doValidator(validator.params, config.params, test.path, greedy)
          result = {
            valid: dataRes.valid && paramsRes.valid,
            message: dataRes.message.concat(paramsRes.message),
            url: test.path,
            warningResult: dataRes.warningResult.concat(paramsRes.warningResult).join(',')
          }
        }else{
          result = doValidator(validator.params, config.params, test.path, greedy) 
        }
      }
      return true
    }
  })
  return result
}
```
## xfetch
```
import { Validator } from './validator'

export default class XFetch {
  constructor (options, MPX) {
    this.onValidatorError = options?.onValidatorError || (error => { console.log(error) })
    this.onError = options?.onError || (error => { console.log(error) })
    if (options && options.useQueue && typeof options.useQueue === 'object') {
      this.queue = options.useQueue instanceof RequestQueue
        ? options.useQueue
        : new RequestQueue({
          adapter: (config) => signRequest({  ...mergeConfig, ...config }, this.signWhiteList, MPX),
          ...options.useQueue
        })
    } else {
      this.requestAdapter = (config) => signRequest({  ...mergeConfig, ...config }, this.signWhiteList, MPX)
    }
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
    if (options && options.proxy) this.setProxy(options.proxy)
  }
  setValidator (options) {
    // 代理配置
    if (isNotEmptyArray(options)) {
      this.validatorOptions = options || []
    } else if (isNotEmptyObject(options)) {
      this.validatorOptions = [options] || []
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  getValidator () {
    // 返回代理配置
    return this.validatorOptions
  }

  checkValidator (config) {
    return Validator(this.validatorOptions, config)
  }


  fetch (config, priority) {
    if (responsePromise) {
      return responsePromise
    }
    if (typeof my !== 'undefined') {
      // 支付宝
      config = Object.assign({}, {
        timeout: this.myTimeout
      }, config)
    } else {
      config = Object.assign({}, config)
    }

    /** @type { Function | undefined } */
    const request = (config) => {
      // 对config进行以下正规化处理：
      // 1. 检查config.url存在
      // 2. 抹平微信/支付宝header/headers字段差异
      // 3. 填充默认method为GET, method大写化
      // 4. 抽取url中query合并至config.params
      // 5. 对于类GET请求将config.data移动合并至config.params(最终发送请求前进行统一序列化并拼接至config.url上)
      // 6. 对于类POST请求将config.emulateJSON实现为config.header['content-type'] = 'application/x-www-form-urlencoded'
      // 后续请求处理都应基于正规化后的config进行处理(proxy/mock/validate/serialize)
      XFetch.normalizeConfig(config)
      this.checkTraceId(config)
      config = this.checkProxy(config)
      let checkRes,validatorRes
      if(this.getValidator()?.length){
        checkRes = this.checkValidator(config)
        validatorRes = isObject(checkRes) ? checkRes.valid : checkRes
      }
      if(typeof validatorRes !== 'undefined' && !validatorRes && this.getValidator()?.length){
        this.onValidatorError(`xfetch参数校验错误 ${checkRes?.url} ${checkRes?.message ? 'error:' + checkRes.message.join(','):''} ${checkRes?.warningResult ? 'warning:' + checkRes?.warningResult : ''}`)
      }
      if (this.queue) {
        return this.queue.request(config, priority)
      } else {
        return this.requestAdapter(config)
      }
    }
    const chain = []
    let promise = Promise.resolve(config)

    

    // 优先考虑队列，无队列则走 this.requestAdapter 兜底
    chain.push(request, undefined)

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    if (config.usePre) {
      const cacheKey = formatCacheKey(config.url)
      this.cacheRequestData[cacheKey] && (this.cacheRequestData[cacheKey].responsePromise = promise)
    }
    return promise
  }
}

```
# xfetch的完整代码
```
export default class XFetch {
  constructor (options, MPX) {
    this.CancelToken = CancelToken
    // this.requestAdapter = (config) => requestAdapter(config, MPX)
    // 当存在 useQueue 配置时，才使用 this.queue 变量
    if (options && options.useQueue && typeof options.useQueue === 'object') {
      this.queue = new RequestQueue({
        adapter: (config) => requestAdapter(config, MPX),
        ...options.useQueue
      })
    } else {
      this.requestAdapter = (config) => requestAdapter(config, MPX)
    }
    if (options && options.proxy) this.setProxy(options.proxy)
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  static normalizeConfig (config) {
    if (!config.url) {
      throw new Error('no url')
    }

    transformReq(config)

    if (!config.method) {
      config.method = 'GET'
    } else {
      config.method = config.method.toUpperCase()
    }

    const params = config.params || {}

    if (/^GET|DELETE|HEAD$/i.test(config.method)) {
      Object.assign(params, config.data)
      // get 请求都以params为准
      delete config.data
    }

    if (isNotEmptyObject(params)) {
      config.params = params
    }

    if (/^POST|PUT$/i.test(config.method)) {
      const header = config.header || {}
      let contentType = header['content-type'] || header['Content-Type']
      if (config.emulateJSON && !contentType) {
        header['content-type'] = 'application/x-www-form-urlencoded'
        config.header = header
      }
      delete config.emulateJSON
    }
  }

  create (options) {
    return new XFetch(options)
  }

  addLowPriorityWhiteList (rules) {
    // when useQueue not optioned, this.quene is undefined
    this.queue && this.queue.addLowPriorityWhiteList(rules)
  }

  setProxy (options) {
    // 代理配置
    if (isNotEmptyArray(options)) {
      this.proxyOptions = options
    } else if (isNotEmptyObject(options)) {
      this.proxyOptions = [options]
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  getProxy () {
    // 返回代理配置
    return this.proxyOptions
  }

  clearProxy () {
    // 解除代理配置
    this.proxyOptions = undefined
  }

  // 向前追加代理规则
  prependProxy (proxyRules) {
    if (isNotEmptyArray(proxyRules)) {
      this.proxyOptions = proxyRules.concat(this.proxyOptions)
    } else if (isNotEmptyObject(proxyRules)) {
      this.proxyOptions.unshift(proxyRules)
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  // 向后追加代理规则
  appendProxy (proxyRules) {
    if (isNotEmptyArray(proxyRules)) {
      this.proxyOptions = this.proxyOptions.concat(proxyRules)
    } else if (isNotEmptyObject(proxyRules)) {
      this.proxyOptions.push(proxyRules)
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  checkProxy (config) {
    return requestProxy(this.proxyOptions, config)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      // 对config进行以下正规化处理：
      // 1. 检查config.url存在
      // 2. 抹平微信/支付宝header/headers字段差异
      // 3. 填充默认method为GET, method大写化
      // 4. 抽取url中query合并至config.params
      // 5. 对于类GET请求将config.data移动合并至config.params(最终发送请求前进行统一序列化并拼接至config.url上)
      // 6. 对于类POST请求将config.emulateJSON实现为config.header['content-type'] = 'application/x-www-form-urlencoded'
      // 后续请求处理都应基于正规化后的config进行处理(proxy/mock/validate/serialize)
      XFetch.normalizeConfig(config)
      config = this.checkProxy(config) // proxy
      return this.queue ? this.queue.request(config, priority) : this.requestAdapter(config)
    }

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    chain.push(request, undefined)

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
```

