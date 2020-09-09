const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin');
const PermissionsOutputPlugin = require('webpack-permissions-plugin');
const { DefinePlugin } = require('webpack');

const path = require('path');
const chromium = require('chromium');

module.exports = {
  forkTsCheckerWebpackPlugin: new ForkTsCheckerWebpackPlugin(),
  optimizeCssnanoPlugin: new OptimizeCssnanoPlugin({}),
  copyPlugin: new CopyPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'node_modules/html-docx-js/build/assets'),
        to: path.resolve(__dirname, '.webpack/main/assets'),
      },
      {
        from: path.resolve(__dirname, chromium.path.split('/lib')[0], 'lib'),
        to: path.resolve(__dirname, '.webpack/main/'),
      },
    ],
  }),
  webpackShellPlugin: new WebpackShellPlugin(
      {
        onBuildStart: [],
        onBuildEnd: [`chmod -R 755 ${path.resolve(__dirname, '.webpack/main/chromium/')}`]}),
  permissionsOutputPlugin: new PermissionsOutputPlugin({
    buildFolders: {
      path: path.resolve(__dirname, '.webpack/main/chromium/'),
      fileMode: '755',
      dirMode: '644'
    }
  }),
  definePlugin: new DefinePlugin({
    CHROMIUM_BINARY: JSON.stringify(path.resolve(__dirname, '.webpack/main/', chromium.path.split('/lib/')[1])),
  }),
};
