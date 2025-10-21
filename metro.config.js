const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)

config.resolver.extraNodeModules = {
  ws: path.resolve(__dirname, 'shims/empty.js'),
  stream: path.resolve(__dirname, 'shims/empty.js'),
  events: path.resolve(__dirname, 'shims/empty.js'),
  http: path.resolve(__dirname, 'shims/empty.js'),
  https: path.resolve(__dirname, 'shims/empty.js'),
  crypto: path.resolve(__dirname, 'shims/empty.js'),
}

module.exports = config
