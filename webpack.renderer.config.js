const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push(
    { // see: https://github.com/css-modules/css-modules/pull/65#issuecomment-354712147
        test: /\.css$/,
        oneOf: [
            {
                resourceQuery: /^\?raw$/,
                use: [{ loader: 'style-loader' }, { loader: 'css-loader',}]
            },
            {
                test: /\.css$/,
                use: [
                    { loader: 'style-loader' },
                    { loader: 'css-loader',  options: { modules: true }}
                ],
            },
        ]
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
    output: {
        publicPath: './../',
    },
    plugins: [plugins.forkTsCheckerWebpackPlugin, plugins.optimizeCssnanoPlugin, plugins.provideJqueryPlugin],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
    },
};
