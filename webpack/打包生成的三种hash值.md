webpack中的三种hash分别是：
[原文链接](https://juejin.cn/post/7060688758370205733#heading-6)
# hash：全局hash
所有的文件共享一个hash 无论是css文件还是js文件,修改一个文件，所有文件的hash值就都变了
```
// 多入口打包
entry: {
    main: './src/main.js',
    console: './src/console.js'
  },
// 输出配置
output: {
    path: path.resolve(__dirname, './dist'),
    // 这里预设为hash
    filename: 'js/[name].[hash].js',
    clean: true
  },
plugins: [
      // 打包css文件的配置
      new MiniCssExtractPlugin({
      // 这里预设为hash
      filename: 'styles/[name].[hash].css'
    })
]
```
# chunkhash：分组hash
我们把输出文件名规则修改为chunkhash
```
entry: {
    main: './src/main.js',
    console: './src/console.js'
  },
output: {
    path: path.resolve(__dirname, './dist'),
    // 修改为 chunkhash
修改    filename: 'js/[name].[chunkhash].js',
    clean: true
  },
plugins: [
      new MiniCssExtractPlugin({
      // 修改为 chunkhash
修改      filename: 'styles/[name].[chunkhash].css'
    })
]
```
[打包结果](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c282f66132c440beb48e22ce6422287f~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

hash值会根据入口文件的不同而分出两个阵营：

main.js、main.css一个阵营，都属于main.js入口文件
console.js一个阵营，属于console.js入口文件
# contenthash：内容hash

我们把输出文件名规则修改为contenthash：
```
entry: {
    main: './src/main.js',
    console: './src/console.js'
  },
output: {
    path: path.resolve(__dirname, './dist'),
    // 修改为 contenthash
修改    filename: 'js/[name].[contenthash].js',
    clean: true
  },
plugins: [
      new MiniCssExtractPlugin({
      // 修改为 contenthash
修改      filename: 'styles/[name].[contenthash].css'
    })
]
```
可以看到，每个文件的hash值都不一样，每个文件的hash值都是根据自身的内容去生成的。