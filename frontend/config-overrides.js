const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  // Fix resolve fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "os": require.resolve("os-browserify/browser"),
    "process": require.resolve("process"),
    "util": require.resolve("util"),
    "events": require.resolve("events"),
    "assert": require.resolve("assert")
  };

  // Fix process resolution
  config.plugins = [
    ...config.plugins,
    // Buffer polyfill
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    // Process polyfill
    new webpack.ProvidePlugin({
      process: 'process'
    }),
    // For environment variables
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env || {})
    })
  ];

  // Add resolve extensions
  config.resolve.extensions = [...config.resolve.extensions, '.js', '.jsx', '.ts', '.tsx'];
  
  // Add aliases to fix module resolution issues
  config.resolve.alias = {
    ...config.resolve.alias,
    // Fix for process/browser module resolution
    'process/browser': require.resolve('process'),
    // Add any other problem modules here
  };

  // COMPLETELY DISABLE SOURCE MAPS for production builds
  // This is the most straightforward way to eliminate the source map warnings
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Disabling source maps for production build to avoid warnings');
    config.devtool = false;
  }

  return config;
};
