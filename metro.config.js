const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  buffer: require.resolve('buffer/'),
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('react-native-get-random-values'),
};

config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
];

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Ensure html files can be required as assets for WebView local loading
if (config.resolver && config.resolver.assetExts && !config.resolver.assetExts.includes('html')) {
  config.resolver.assetExts.push('html');
}

module.exports = config;

