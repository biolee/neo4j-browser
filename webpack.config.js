const webpack = require('webpack')
const path = require('path')

const DashboardPlugin = require('webpack-dashboard/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const autoprefixer = require('autoprefixer')
const precss = require('precss')

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'

const jsSourcePath = path.join(__dirname, './src/browser')
const buildPath = path.join(__dirname, './build')
const assetsPath = path.join(__dirname, './build/assets')
const sourcePath = path.join(__dirname, './src/browser')

// Common plugins
const plugins = [
  new CopyWebpackPlugin([
    {
      from: {
        glob: path.resolve('./src/browser/images') + '/**/*',
        dot: false
      },
      to: assetsPath
    },
    {
      from: path.resolve('./src/browser/external/d3.min.js'),
      to: assetsPath + '/js'
    },
    {
      from: path.resolve('./src/browser/external/neoPlanner.js'),
      to: assetsPath + '/js'
    }
  ]),
  new webpack.NormalModuleReplacementPlugin(/\/iconv-loader$/, 'node-noop'),
  new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks: Infinity,
    filename: 'vendor-[hash].js'
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new webpack.NamedModulesPlugin(),
  new HtmlWebpackPlugin({
    template: path.join(sourcePath, 'index.html'),
    path: buildPath,
    filename: 'index.html'
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      postcss: [
        precss(),
        autoprefixer({
          browsers: [
            'last 3 version',
            'ie >= 10'
          ]
        })
      ],
      context: sourcePath
    }
  })
]

// Common rules
const rules = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: [
      'babel-loader'
    ]
  },
  {
    test: /\.json$/,
    loader: 'json-loader'
  },
  {
    test: /\.css$/, // Guides
    include: path.resolve('./src/browser/modules/Guides'),
    loader: ['style-loader', 'css-loader?modules&importLoaders=1&camelCase&localIdentName=[local]', 'postcss-loader']
  },
  {
    test: /\.css$/,
    include: path.resolve('./src'), // css modules for component css files
    exclude: [path.resolve('./src/browser/external'), path.resolve('./src/browser/styles'), path.resolve('./src/browser/modules/Guides'), path.resolve('./src/browser/modules/D3Visualization/src')],
    use: ['style-loader', 'css-loader?modules&importLoaders=1&camelCase&localIdentName=[name]__[local]___[hash:base64:5]', 'postcss-loader']
  },
  {
    test: /\.css$/, // global css files that don't need any processing
    exclude: [path.resolve('./src/browser/components'), path.resolve('./src/browser/modules'), path.resolve('./src/browser/guides')],
    use: ['style-loader', 'css-loader']
  },
  {
    test: /\.css$/, // global css files that don't need any processing
    include: path.resolve('./src/browser/modules/D3Visualization/src'), // css modules for component css files
    use: ['css-loader']
  },
  {
    test: /\.coffee$/,
    exclude: /node_modules/,
    loader: 'coffee-loader'
  },
  {
    test: /\.(png|gif|jpg|svg)$/,
    include: [path.resolve('./src/browser/modules')],
    use: 'url-loader?limit=20480&name=assets/[name]-[hash].[ext]'
  },
  {
    test: /\.html?$/,
    use: ['html-loader']
  },
  { test: /\.svg$/, use: 'file-loader?limit=65000&mimetype=image/svg+xml&name=assets/fonts/[name].[ext]' },
  { test: /\.woff$/, use: 'file-loader?limit=65000&mimetype=application/font-woff&name=assets/fonts/[name].[ext]' },
  { test: /\.woff2$/, use: 'file-loader?limit=65000&mimetype=application/font-woff2&name=assets/fonts/[name].[ext]' },
  { test: /\.[ot]tf$/, use: 'file-loader?limit=65000&mimetype=application/octet-stream&name=assets/fonts/[name].[ext]' },
  { test: /\.eot$/, use: 'file-loader?limit=65000&mimetype=application/vnd.ms-fontobject&name=assets/fonts/[name].[ext]' }
]

if (isProduction) {
  // Production plugins
  plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true
      },
      output: {
        comments: false
      }
    }),
    new ExtractTextPlugin('style-[hash].css')
  )
} else {
  // Development plugins
  plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new DashboardPlugin()
  )
}

module.exports = {
  devtool: isProduction ? 'eval' : 'source-map',
  context: jsSourcePath,
  entry: {
    js: [
      'index.jsx'
    ],
    vendor: [
      'neo4j-driver-alias',
      'codemirror',
      'rxjs',
      'babel-polyfill',
      'isomorphic-fetch',
      'preact',
      'preact-compat',
      'redux-observable',
      'suber',
      'preact-suber',
      'redux'
    ]
  },
  output: {
    path: buildPath,
    publicPath: '',
    filename: 'app-[hash].js'
  },
  module: {
    rules
  },
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx', '.css', '.coffee'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      jsSourcePath
    ],
    alias: {
      'neo4j-driver-alias': 'neo4j-driver/lib/browser/neo4j-web.min.js',
      'src-root': './src',
      'services': './src/shared/services',
      'browser-services': './src/browser/services',
      'shared': './src/shared',
      'react': 'preact-compat',
      'react-dom': 'preact-compat',
      'browser-components': './src/browser/components',
      'browser': './src/browser',
      'browser-styles': './src/browser/styles'
    }
  },
  plugins,
  devServer: {
    contentBase: isProduction ? './build' : './src/browser',
    historyApiFallback: true,
    port: 8080,
    compress: isProduction,
    inline: !isProduction,
    hot: !isProduction,
    host: '0.0.0.0',
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
        green: '\u001b[32m'
      }
    }
  }
}
