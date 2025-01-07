const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env) => {
    const development = env.dev

    var config = {
        entry: {
            app: './src/app.tsx'
        },
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
            },
            devMiddleware: {
                // Ensures files copied by the CopyWebpackPlugin are available during development
                writeToDisk: (filePath) => filePath.includes('speedscope/')
            },
            static: {
                directory: path.join(__dirname, '/')
            }
        },
        output: {
            path: path.resolve(__dirname, './dist'),
            filename: (pathData) => {
                return pathData.chunk.name === 'app' ? 'bundle.js' : '[name].js'
            }
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
            }),
            new CopyPlugin({
                // Copy speedscope files
                patterns: [
                    {
                        from: 'node_modules/speedscope/dist/release',
                        to: 'speedscope',
                        transform: (content, filePath) => {
                            // Make speedscope's localProfilePath hash parameter support relative paths
                            if (filePath.endsWith('.js')) {
                                return content.toString().replace('file:///', '')
                            }
                            return content
                        }
                    }
                ]
            }),
            new CopyPlugin({
                // Copy speedscope js files (again) to root so imports can get resolved
                patterns: [{ from: 'node_modules/speedscope/dist/release/*.js', to: '[name][ext]' }]
            })
        ]
    }

    return config
}
