const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

const path = require('path');
const puppeteer = require('puppeteer');
const exec = require('child_process').exec;

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
        from: path.resolve(__dirname, puppeteer.executablePath().split('/.local-chromium')[0], '.local-chromium'),
        to: path.resolve(__dirname, '.webpack/main/chromium'),
        globOptions: {
          followSymbolicLinks: false,
        }
      },
    ],
  }),
  runShellAfterEmitPlugin: {
    apply: (compiler) => {
      compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
        exec(`chmod -R 755 ${path.resolve(__dirname, '.webpack/main/chromium/')}`, (err, stdout, stderr) => {
          if (stdout) process.stdout.write(stdout);
          if (stderr) process.stderr.write(stderr);
        });
      });
    },
  },
  definePlugin: new DefinePlugin({
    CHROMIUM_BINARY: JSON.stringify(path.join('chromium', puppeteer.executablePath().split('/.local-chromium/')[1])),
  }),
};
