const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const outputDirectory = 'public/dist';

module.exports = {
    entry: './client/index.js',
    output: {
        path: path.resolve(__dirname, outputDirectory),
        filename: '[name].[hash].bundle.js',
        publicPath: '/'
    },
    resolve: {
        roots: [__dirname+'/client/']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'server/views/index.html'
        })
    ],
    devtool: 'source-map'
};
