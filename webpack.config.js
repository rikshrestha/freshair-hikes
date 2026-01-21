const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Stub native-only modules on web to avoid bundling errors.
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'react-native-maps': false,
  };

  return config;
};
