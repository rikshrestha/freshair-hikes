const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return {
      type: "sourceFile",
      filePath: path.join(projectRoot, "stubs/react-native-maps.js"),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
