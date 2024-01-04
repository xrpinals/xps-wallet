require('babel-polyfill')
var path = require('path')
var webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')

const env = process.env.NODE_ENV

const isProd = env === 'production'

module.exports = {
  entry: ['babel-polyfill', './src/main.js'],
  output: {
    path: path.resolve(__dirname, './static'),
    publicPath: env === 'production' ? '../static/' : '/static/',
    filename: 'main.js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
            // the "scss" and "sass" values for the lang attribute to the right configs here.
            // other preprocessors should work out of the box, no loader config like this necessary.
            less: 'vue-style-loader!css-loader!less-loader',
          },
          // other vue-loader options go here
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, './node_modules/ecpair/src/ecpair.js'),
        ],
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.(png|jpg|gif|svg|woff|ttf|eot)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        },
      },
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
  },
  performance: {
    hints: false,
  },
  plugins: [
    new ExtractTextPlugin('main.css'),
    new ParallelUglifyPlugin({
      uglifyJS: {
        output: {
          beautify: !isProd,
          comments: !isProd,
        },
        compress: {
          warnings: !isProd,
          drop_console: isProd,
          collapse_vars: isProd,
          reduce_vars: isProd,
        },
      },
      test: /.js$/g,
      include: [],
      exclude: [],
      cacheDir: '',
      workerCount: '',
      sourceMap: !isProd,
    }),
  ],
  devtool: isProd ? '' : '#eval-source-map',
}

if (isProd) {
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
  ])
}
