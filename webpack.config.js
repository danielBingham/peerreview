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
    devtool: 'source-map',
    devServer: {
        port: 3000,
        open: true,
        historyApiFallback: true,
        server: {
            type: 'https',
            options: {
                key: './infrastructure/local/secrets/localhost.key',
                cert: './infrastructure/local/secrets/localhost.crt',
                requestCert: true
            }
        },
        proxy: {
            '/config': 'http://localhost:8080',
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
