const path = require("path")
const os = require('os')
const home = os.homedir()

module.exports = {
  didi: {
    appId: {
      wx: 'wxaf35009675aa0b2a',
      ali: '2019062865745088'
    },
    private: {
      wx: require('./key/didi'),
      ali: {
        toolId: '4ad889e7d0364d4aa3aea28bdac38ba4',
        privateKey: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCcpmTIaBJht1+tY9GW7yAokP6//Dtyc/nnKS1635jrWHjz60W0GMBWwq/3xhDVi5SYYSX2YJRo3T5hjJxjin7eYS6NqHbtpXnw4EOOnyRvGaLd6c2ZkKd7hju+wGOYlslJ9T/snAwu71QS0s4GGy2Pi3tKS4GHuY4gZ5jNd+VXCMlg+R5ohcA4yTMLHzMmctMsjsgFG4nMCl2MQcL0IzTiN9znFkJi8aOxrDDmSKNDRZxj6c4379bQaEvCNxpmFQbB4P7zsyQYYRr76tp+zNzU3Cr2Bixam+blcHsX7zE0nLVmMOWFHu4f701aJYXvg9R+HsCgdC5KJlHAZjgggbcTAgMBAAECggEBAI0NGqSFaT/JgQI8ZiV07cz5Ohmewdx952Co6EXCfgwz3r0rdNkEjHPS2+XL166g/0zx9N/S+O8vgBMQLGVI+JG+ic+OCIBVxuYI2Wvbik/rkoYlFzcWVGhaZwOMcmGcLGVGyqd/n0zHvTkxzccbw7uECaDNOjX+86XkAmfIdJ4XXOrKrlDupkFUaMb8UNb3vYwzd9lyjUW82q0zndZEcII1ZO3tXmS7jBJTDt12ydnywIN9pi4SXMw3W0Ez8iCINENIY1ztRBQeL0mJUOnrmCOwB/e6YZEXVuVbg84y+lb2DSpX3juKXj6oK0ynEkpPKT7WLyP8yr+EbIBBpl/SHYkCgYEA/5Ej3PnArNLMeTPiNwUP7JavazFDhWscXi6x+iMSvrxZyDTf2Uc79Uq+2A9nYk4IckRzvrD67ZYGwX+AkPR51CMow1Q3fdTZ4q2fFQSFgCggJ/0Wg+swAFTjZwMcAAMdMXOwJrXNhCyYQmPzhBD6dEz1GmiMMEIK0fvw2AgODIUCgYEAnOpYaUElOM+WqCtv/DdIbUyMcmW0WqweTSGfya0WLQVWATZGIXeZ5WbowsDuJB5x0tnNamH9HpOPaO6sTTyMhuQpjmTbyIv1DDj3hsSwcx6GJEO8376ym81HhzNMGEDiSDaXJSrTKk4Z+7NmG+jhlxHom224uGpnxdWr9bro9LcCgYALMBpm0RQrPKsw3yGXEQSqccpKIgT3sUGzqc2myqRGb05q4k2uYFzylwwVv07iUdIy1mZOwcaqYff3vpItRlaS/9sH+gbX3lqPftRJAkKp4pfNyFmU+tXGHfE6kDtIkNpVUOA0QZ82mxErTt7ZODkOoFPWjR8d+bYpjSL1Ah1DVQKBgQCcUbkR4hw6pFLp5ZwCHvDAMeoYbMlnKuBk5oJQX2YgI5iyTGdBH+zoY8Stf5W91bZ+3wuMV2HZ/BZ56osrxo4YM2RSvpdVClhsfLPaRkeh516q8fBO1aMJI0+GmMvNvZWvavLXy/nhwzyPSwEF/NH/tY+Mh5nl3drTczGD81fvsQKBgCvnt1+ByYhqIuKIpWeTfj1s3jbBuus/mvUcH6zWrIr5h9aHOgpuj0Tn0lhbqlWFWi6gr4SlKwNg+a6RPRiUEaxcCDWacaiir9nSFvk/pdKdETh+XkeA7A4nXzjPVG29iA6c5jjU6avIU4f/z8UJDO+AOXa6nVGr7QgY0U9lTQR9'
      }
    },
    distPath: path.resolve(home, '.myshell/dist_didi'),
    previewPath: path.resolve(home, '.myshell/preview_didi')
  },
  kf: {
    appId: {
      wx: 'wxd98a20e429ce834b',
      ali: ''
    },
    private: {
      wx: require('./key/kf'),
      ali: {
        toolId: '',
        privateKey: ''
      }
    },
    distPath: path.resolve(home, '.myshell/dist_kf'),
    previewPath: path.resolve(home, '.myshell/preview_kf')
  }
}
