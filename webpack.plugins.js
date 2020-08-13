const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new OptimizeCssnanoPlugin({}),
];
