const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    context: path.resolve(__dirname, 'frontend/src'),
    entry: './index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'codicem-bundle.js',
        path: path.resolve(__dirname, 'frontend/dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html', // Specify the path to your HTML template file
            filename: 'index.html' // Specify the name of the output HTML file
        })
    ]
};