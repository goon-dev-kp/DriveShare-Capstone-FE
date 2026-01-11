
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {
        web: {
          // Prevent prototype chain issues on web
          unstable_transformProfile: "default",
        }
      }]
    ],
    plugins: [
      // Handle module resolution for web
      ["module-resolver", {
        alias: {
          "@": "./",
        },
      }],
    ],
    env: {
      web: {
        plugins: [
          // Add web-specific transforms to prevent prototype issues
          ["@babel/plugin-transform-runtime", {
            helpers: true,
            regenerator: true,
          }],
        ],
      },
    },
  };
};
