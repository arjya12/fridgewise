const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add node_modules to watchFolders
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Add support for additional extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

// Block node-specific modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "stream" || moduleName === "crypto") {
    return {
      type: "empty",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
