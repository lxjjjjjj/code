const axios = require('axios')
const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')

/**
 * 下载代码包(zip)
 * @param params
 * @returns {Promise<{filePath: string, suffix: string}|null>} 返回文件存储路径
 */
async function downDist(params = {}) {
  let {
    url,
    mode,
    storePath,
    suffix = 'zip'
  } = params
  try {
    const { data } = await axios({ url, responseType: 'arraybuffer' })
    if (!fs.existsSync(storePath)) {
      mkdirp.sync(storePath)
    } else {
      rimraf.sync(storePath + '/*')
    }
    fs.writeFileSync(`${storePath}/${mode}.${suffix}`, data, 'binary')
    return { filePath: `${storePath}/${mode}`, suffix }
  } catch (e) {
    throw e
  }
}

module.exports = {
  downDist
}