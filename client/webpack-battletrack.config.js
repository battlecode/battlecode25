const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env) => {
    const development = env.dev

    var config = {
        entry: './battletrack/src/app.tsx',
        target: 'web',
        devtool: development ? 'source-map' : undefined,
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            fallback: {
                assert: require.resolve('assert/')
            }
        },
        module: {
            rules: [
                {
                    test: /\.ts(x?)$/,
                    exclude: [/node_modules/, /src-tauri/, /packaged-client/],
                    loader: 'ts-loader'
                },
                {
                    test: /\.css$/,
                    exclude: [/node_modules/, /src-tauri/, /packaged-client/],
                    use: ['style-loader', 'css-loader', 'postcss-loader']
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg|ttf|otf|woff|woff2|eot)$/,
                    exclude: [/node_modules/, /src-tauri/, /packaged-client/],
                    loader: 'url-loader'
                }
            ]
        },
        devServer: {
            compress: true,
            hot: true,
            port: 3000,
            static: {
                directory: path.join(__dirname, '/src')
            }
        },
        output: {
            path: path.resolve(__dirname, './dist'),
            filename: 'bundle.js'
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './index.html',
                favicon: './icons/icon.ico'
            }),
            new webpack.LoaderOptionsPlugin({
                minimize: !development,
                debug: development
            }),
            new webpack.ProvidePlugin({
                process: 'process/browser'
            }),
            new CopyPlugin({
                patterns: [{ from: 'src/static', to: 'static' }]
            })
        ]
    }

    return config
}
