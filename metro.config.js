const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific resolver and transformer settings to prevent prototype issues
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  alias: {
    ...config.resolver.alias,
    // Ensure consistent module resolution
    'react-native$': 'react-native-web',
  },
};

config.transformer = {
  ...config.transformer,
  // Enable minification to reduce prototype chain issues
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Add web-specific transforms
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};



module.exports = config;
