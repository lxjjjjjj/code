import {
  isFunction,
  isNotEmptyObject,
  parseUrl,
  deepMerge,
  doTest
} from './util'

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
      for (const k in matchParams) {
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
export function doTest (config, test) {
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
    return false
  })

  return Object.assign({}, configBackup, newConfig)
}