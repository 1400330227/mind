const path = require('path');

const resolve = dir => path.resolve(__dirname, '..', dir);

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    main: resolve('src/index.ts')
  },
  output: {
    path: resolve('dist'),
    publicPath: '/dist/',
    filename: "[name].js",
    library: 'mind'
  }
};
