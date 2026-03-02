const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "react/compiler-runtime": require.resolve("react-compiler-runtime"),
};

module.exports = withNativeWind(config, { input: './global.css' })