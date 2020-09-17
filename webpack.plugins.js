const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

const path = require('path');
// const puppeteer = require('puppeteer');
// const exec = require('child_process').exec;

/**
 * The copyPlugin is used to add some necessary assets to the final bundle. The downloading and bundling  puppeteer was
 * a way to overcome the limitations of electron and puppeteer-in-electron, but resulted in a huge app with several
 * hundred MB size. After a puppeteer-independent solution for the PDF/PNG export was found the puppeteer the
 * .local-chromium instance does not need to be included any more, the plugin-setup will be left here first for
 * reference.
 */
module.exports = {
  forkTsCheckerWebpackPlugin: new ForkTsCheckerWebpackPlugin(),
  optimizeCssnanoPlugin: new OptimizeCssnanoPlugin({}),
  copyPlugin: new CopyPlugin({
    patterns: [
      // This fix missing assets for html-docx-js
      {
        from: path.resolve(__dirname, 'node_modules/html-docx-js/build/assets'),
        to: path.resolve(__dirname, '.webpack/main/assets'),
      },
      // This fix missing styling and template for jsonresume-theme-flat
      {
        from: path.resolve(__dirname, 'node_modules/jsonresume-theme-flat/style.css'),
        to: path.resolve(__dirname, '.webpack/main/'),
      },
      {
        from: path.resolve(__dirname, 'node_modules/jsonresume-theme-flat/resume.template'),
        to: path.resolve(__dirname, '.webpack/main/'),
      },
        /*
      {
        from: path.resolve(__dirname, puppeteer.executablePath().split('/.local-chromium')[0], '.local-chromium'),
        to: path.resolve(__dirname, '.webpack/main/chromium'),
        globOptions: {
          followSymbolicLinks: false,
        }
      },
      */
    ],
  }),
  runShellAfterEmitPlugin: {
    /*
    apply: (compiler) => {
      compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
        exec(`chmod -R 755 ${path.resolve(__dirname, '.webpack/main/chromium/')}`, (err, stdout, stderr) => {
          if (stdout) process.stdout.write(stdout);
          if (stderr) process.stderr.write(stderr);
        });
      });
    },
    */
  },
  definePlugin: new DefinePlugin({
     // CHROMIUM_BINARY: JSON.stringify(path.join('chromium', puppeteer.executablePath().split('/.local-chromium/')[1])),
  }),
};
