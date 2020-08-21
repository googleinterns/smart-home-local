const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  target: 'web',
  entry: './build/src/browser/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: 'main.js',
    library: 'localHomePlatform',
    libraryTarget: 'window',
  },
  node: {
    Buffer: true,
  },
};
