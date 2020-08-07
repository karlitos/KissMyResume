const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push(
    {
      test: /\.css$/,
      use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
    },
    { // see: https://chriscourses.com/blog/loading-fonts-webpack
      test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
          loader: 'file-loader',
          options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
          }
      }]
    }
);

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
};
