const path = require('path');

module.exports = {
  entry: {
    content: './content.js',
    background: './background.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production',
  optimization: {
    minimize: true,
    usedExports: true,
  },
  experiments: {
    topLevelAwait: true
  },
  resolve: {
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  chrome: "88"
                }
              }]
            ],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ]
  }
}; 