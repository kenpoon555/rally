const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoDefaultConfig } = require('expo/metro-config');

const expoConfig = getExpoDefaultConfig(__dirname);
const rnConfig = getDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
module.exports = mergeConfig(rnConfig, expoConfig, {
  resolver: {
    useWatchman: false,
  },
});
