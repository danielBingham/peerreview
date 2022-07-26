const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const outputDirectory = 'public';

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
    devServer: {
        port: 3000,
        open: true,
        historyApiFallback: true,
        proxy: {
            '/api/0.0.0': 'http://localhost:8080',
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: './index.html',
            template: './server/views/index.html',
        })
    ]
};
