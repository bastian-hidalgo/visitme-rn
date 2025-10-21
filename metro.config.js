const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  expo: path.resolve(__dirname, 'node_modules/expo'),
};

module.exports = config;
