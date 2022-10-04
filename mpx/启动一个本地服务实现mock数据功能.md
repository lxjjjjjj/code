const fs = require('fs')
const path = require('path')
const express = require('express')
const JSON5 = require('json5')

module.exports = function getMockServer ({ mock }) {
  if (mock) {
    const app = express()
    const mockRoot = path.resolve(__dirname, '../mockData')
    app.use((req, res, next) => {
      res.set({ 'Access-Control-Allow-Origin': '*' })
      // 取兩個長度
      const jsonName = req.path.split('/').reverse().slice(0, 3).join('-') + '.json'
      fs.readFile(path.join(mockRoot, jsonName), 'utf8', (err, data) => {
        if (!err) {
          try {
            const mockData = JSON5.parse(data)
            const isOpenMockJsonData = !mockData.disableMock
            if (isOpenMockJsonData) {
              // console.log(`在${req.path}接口使用mock数据`)
              res.send(mockData)
            } else {
              next()
            }
          } catch (e) {
            console.error(e)
            next()
          }
        } else {
          console.error(`对于请求：${req.originalUrl} 未找到 ${jsonName}`)
          // 如果没有匹配的，继续别的路由拦截尝试
          next()
        }
      })
    })
    const port = typeof mock === 'number' ? mock : '8084'
    console.log('****** 启动mock服务 *******')
    app.listen(port, (err) => {
      if (err) console.error(err)
      else console.log(`****** mock服务启动成功，端口号:${port}! *******`)
    })
    return app
  }
}
