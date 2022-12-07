const path = require('path')

module.exports = {
  mode: 'development',
  target: 'node',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'node'),
    filename: 'index.js',
    library: {
      type: 'commonjs'
    }
  },
  experiments: {
    topLevelAwait: true
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@babel/plugin-syntax-top-level-await'],
          }
        }
      },
      {
        test: /\.node$/,
        use: {
          loader: 'node-loader'
        }
      }
    ]
  }
}
