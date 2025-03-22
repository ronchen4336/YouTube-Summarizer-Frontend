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
  mode: 'production'
}; 