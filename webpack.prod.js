/* eslint import/no-extraneous-dependencies:0 */
const webpack = require('webpack');
const path = require('path');
const CleanPlugin = require('clean-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const cssnano = require('cssnano');
const forEach = require('lodash.foreach');

const config = require('./assets/config');

const outputPath = path.join(__dirname, config.output.path);

const assetsPluginProcessOutput = function process(assets) {
  const results = {};

  forEach(assets, (chunk, key) => {
    forEach(chunk, (filename, ext) => {
      results[`${key}.${ext}`] = path.basename(filename);
    });
  });

  return JSON.stringify(results);
};

const webpackConfig = {
  context: path.resolve(config.context),
  entry: config.entry,
  output: {
    path: outputPath,
    publicPath: config.output.publicPath,
    filename: 'scripts/[name]_[chunkhash].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'eslint-loader',
          options: {
            failOnWarning: false,
            failOnError: true,
          },
        },
        enforce: 'pre',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [['es2015', { modules: false }]],
          cacheDirectory: true,
        },
      },
      {
        test: /\.s?css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: false,
              },
            },
            {
              loader: 'postcss-loader',
            },
            {
              loader: 'sass-loader',
            },
          ],
        }),
      },
      {
        test: /.*\.(gif|png|jpe?g)$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8000,
              name: '/images/[name]_[sha512:hash:base64:7].[ext]',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {
              optipng: {
                optimizationLevel: 7,
              },
              gifcicle: {
                interlaced: false,
              },
              pngquant: {
                quality: '65-90',
                speed: 4,
              },
              mozjpeg: {
                quality: 65,
              },
            },
          },
        ],
      },
      {
        test: /.*\.svg$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '/images/[name]_[sha512:hash:base64:7].[ext]',
            },
          },
          {
            loader: 'image-webpack-loader',
            options: {},
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules'],
  },
  plugins: [
    new CleanPlugin([outputPath]),
    new ExtractTextPlugin({
      filename: 'styles/[name]_[hash].css',
      allChunks: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new AssetsPlugin({
      path: outputPath,
      filename: 'assets.json',
      fullPath: false,
      processOutput: assetsPluginProcessOutput,
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      sourceMap: true,
    }),
    new OptimizeCssAssetsPlugin({
      cssProcessor: cssnano,
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true,
    }),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  target: 'web',
  devtool: 'cheap-module-source-map',
};

module.exports = webpackConfig;
