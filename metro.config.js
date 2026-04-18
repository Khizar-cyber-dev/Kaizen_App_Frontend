const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "react/compiler-runtime": require.resolve("react-compiler-runtime"),
};

const finalConfig = withNativeWind(config, { input: './global.css' });

// Export both the config and a loadAsync function to satisfy different
// versions of Expo's Metro loader (some expect ExpoMetroConfig.loadAsync).
module.exports = finalConfig;
module.exports.loadAsync = async () => finalConfig;