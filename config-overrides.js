/**
 * CRA webpack override to allow bare ESM imports without file extensions.
 * Needed for bvhecctrl which imports three/src modules without ".js".
 */
module.exports = function override(config) {
  if (!config.resolve) {
    config.resolve = {};
  }
  config.resolve.fullySpecified = false;

  // Ensure webpack relaxes ESM resolution for .mjs/.js files coming from dependencies.
  if (!Array.isArray(config.module?.rules)) {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
  }
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Ignore source map warnings for problematic packages
  config.ignoreWarnings = [
    {
      module: /@mediapipe\/tasks-vision/,
      message: /Failed to parse source map/,
    },
    {
      module: /bvhecctrl/,
      message: /Failed to parse source map/,
    },
  ];

  return config;
};
