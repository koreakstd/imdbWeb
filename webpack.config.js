require('dotenv').load();

// Import depedencies
const webpack = require('webpack');
const BrowserSync = require('browser-sync-webpack-plugin');
const path = require('path');
const NodeObjectHash = require('node-object-hash');

const WebpackMd5Hash = require('webpack-md5-hash');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Config variables
// let nodeEnv = process.env.NODE_ENV;
let nodeEnv = 'production';
nodeEnv = nodeEnv != null ? nodeEnv.replace(' ', '') : nodeEnv;
const isProd = nodeEnv === 'production';

const nodeModulesPath = path.join(__dirname, './node_modules');
const cachePath = path.join(nodeModulesPath, './.cache');

const resourcePath = path.join(__dirname, './src');
const buildPath = path.join(__dirname, './dist');

// Common plugins
const plugins = [
    new HtmlWebpackPlugin({
        title: 'React',
        filename: '../index.html',
        template: 'index.html',
        hash: true,
    }),

    //  Make sure Webpack is given current environment with quotes ("")
    new webpack.DefinePlugin({
        'process.env': { NODE_ENV: JSON.stringify(nodeEnv) },
    }),

    // Provide plugin to prevent "moment is not defined" od "$ is not defined"
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.$': 'jquery',
        'window.jQuery': 'jquery',
    }),

    // exclude moment locale except EN and ID
    new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(en|id)$/),
];

const loaders = [
    // Use eslint-loader to linting code
    {
        enforce: 'pre',
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {
            quiet: true,
            failOnWarning: true,
            failOnTrue: true,
        },
    },

    // Use babel-loader to transpile file with JS/JSX extension
    {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
            babelrc: false,
            presets: [
                ['es2015'],
                'react',
                'stage-2',
            ],
        },
    },

    // Use file-loader to load fonts
    {
        test: /\.(woff2?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: isProd ? 'file-loader?publicPath=../&name=fonts/[name].[hash].[ext]' : 'file-loader?name=fonts/[name].[ext]',
    },
];

// Configure plugins and loaders depending on environment settings
if (isProd) {
    // Enable caching to improve build performance
    plugins.push(new HardSourceWebpackPlugin({
        cacheDirectory: `${cachePath}/hard-source/[confighash]`,
        recordsPath: `${cachePath}/hard-source/[confighash]/records.json`,
        configHash: NodeObjectHash({ sort: false }).hash,
    }),

    // Add global options for all loaders
    new webpack.LoaderOptionsPlugin({ minimize: true, debug: false }),

    // Uglify Javascript files
    new webpack.optimize.UglifyJsPlugin(),

    // Split each entry to app and vendor bundle Common vendor
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        filename: '[name].[chunkhash].js',
    }),
    // Split app and vendor code of app1
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor-app',
        chunks: ['app'],
        minChunks: ({ resource }) => /node_modules/.test(resource),
    }),
    // Hash assets
    new WebpackMd5Hash(),

    // Separate CSS files from the Javascript files
    new ExtractTextPlugin({ filename: 'css/[name].[chunkhash].css', allChunks: true })
    );

    // Use css-loader and sass-loader as an input for ExtractTextPlugin If CSS files
    // are not extracted, use style-loader instead
    loaders.push({
        test: /\.(css|scss|sass)$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
            use: [{
                loader: 'css-loader',
                options: {
                    // modules: true,
                    sourceMap: false,
                },
            }, {
                loader: 'sass-loader',
                options: {
                    sourceMap: false,
                },
            }],
            fallback: 'style-loader',
        }),
    });
} else {
    plugins.push(
        // vendor code of project
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            filename: 'js/[name].js',
        }),
        // Split app and vendor code of app
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor-app',
            chunks: ['app'],
            minChunks: ({ resource }) => /node_modules/.test(resource),
        }),
        new BrowserSync({
            host: '0.0.0.0',
            port: 8810,
            server: { baseDir: ['dist'] },
        }),
        new ExtractTextPlugin({ filename: 'css/[name].css', allChunks: true })
    );

    loaders.push({
        test: /\.(css|scss|sass)$/,
        exclude: /node_modules/,
        use: ExtractTextPlugin.extract({
            use: [{
                loader: 'css-loader',
                options: {
                    // modules: true,
                    sourceMap: false,
                },
            }, {
                loader: 'sass-loader',
                options: {
                    sourceMap: false,
                },
            }],
            fallback: 'style-loader',
        }),
    });
}

// Configuration
module.exports = {
    // source-map: long build, smaller size, production eval: fast build, bigger
    // size, development
    devtool: isProd ? 'source-map' : 'eval',

    // Source directory
    context: resourcePath,

    // Source files; relative to context
    entry: {
        app: ['./js/app.js'],
        vendor: ['react', 'react-dom', './js/vendor.js'],
    },

    // Output directory
    output: {
        path: `${buildPath}/assets`,
        filename: isProd ? 'js/[name].[chunkhash].js' : 'js/[name].js',
        chunkFilename: isProd ? 'js/[name].[chunkhash].js' : 'js/[name].js',
        publicPath: '/assets/',
    },

    // Loaders used to load modules
    module: {
        loaders,
    },

    // Resolve a module name as another module and directories to lookup when
    // searching for modules
    resolve: {
        alias: {
            joi: 'joi-browser',
        },
        modules: [resourcePath, nodeModulesPath],
    },

    // Plugins used
    plugins,
};
