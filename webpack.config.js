require('dotenv').load();

// Import depedencies
const webpack = require('webpack');
const path = require('path');
const NodeObjectHash = require('node-object-hash');

// const ManifestPlugin = require('webpack-manifest-plugin');
// const ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Config variables
let nodeEnv = process.env.NODE_ENV;
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
        filename: './asset/js/[name].[chunkhash].js',
    }),
    // Split app and vendor code of app1
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor-app',
        chunks: ['app'],
        minChunks: ({ resource }) => /node_modules/.test(resource),
    }),
    // Hash assets
    new WebpackMd5Hash(),

    // Add manifest to assets after build
    // new ManifestPlugin(),

    // Enable hash on chunk bundles
    // new ChunkManifestPlugin({ filename: 'chunk-manifest.json', manifestVariable: 'webpackManifest' }),

    // Separate CSS files from the Javascript files
    new ExtractTextPlugin({ filename: 'css/[name].[chunkhash].css', allChunks: true })
    );

    // Use css-loader and sass-loader as an input for ExtractTextPlugin If CSS files
    // are not extracted, use style-loader instead
    loaders.push({
        test: /\.(css|scss)$/,
        use: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!sass-loader' }),
    });
} else {
    // Enable hot reload on development
    plugins.push(new webpack.HotModuleReplacementPlugin());

    // Use style-loader, css-loader, and sass-loader on development
    loaders.push({
        test: /\.(css|sass|scss)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
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
        vendor: ['react', 'react-dom'],
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

    // webpack-dev-server (more like webpack-dev-middleware) configuration
    devServer: {
        // It should be the same as buildPath
        // contentBase: './dist',
        contentBase: path.resolve(__dirname, 'dist'),

        // Fallback to /index.html when not found
        historyApiFallback: true,
        port: 3001,

        // Proxy to a running server
        proxy: {
            '**': 'http://localhost:3000/',
        },

        // Enable hot-reload
        hot: true,

        // Inline HTML instead of iframe
        inline: true,

        // Same as output.publicPath
        publicPath: '/assets/',
        compress: false,

        // Enable "waiting" for file changes
        watchOptions: {
            poll: true,
        },

        // Show stats after in-memory bundle has been built
        stats: {
            assets: true,
            children: false,
            chunks: false,
            hash: false,
            modules: false,
            publicPath: false,
            timings: true,
            version: false,
            warnings: true,
            colors: {
                green: '\u001b[32m',
            },
        },
    },
};
