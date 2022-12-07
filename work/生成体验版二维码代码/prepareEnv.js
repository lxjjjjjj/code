const cp = require('child_process')
const path = require('path')
const fs = require('fs')

const entryPath = {
  'miniprogram-ci': 'dist/index.js',
  minidev: 'lib/index.js'
}


function resolveLib(lib) {
  // 查看在默认安装路径下有miniprogram-ci 和 minidev的包
  const npmPrefix = cp.execSync('npm config get prefix', { encoding: 'utf8' }).replace(/[\r\n]/g, '')
  // console.log('npm prefix: ', npmPrefix)
  // 获取全局的默认安装路径
  try {
    console.log('Trying to get lib: ', lib)
    // require.resolve(path.join(npmPrefix, './lib/node_modules', lib, entryPath[lib]))
    fs.existsSync(path.join(npmPrefix, './lib/node_modules', lib, entryPath[lib]))
    console.log('already installed: ', lib)
    return ''
  } catch (e) {
    console.log('prepareEnv: ', e.toString())
    return lib
  }
}

module.exports = resolveLib
