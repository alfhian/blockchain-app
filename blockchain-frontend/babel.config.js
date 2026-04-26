module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      ['@babel/plugin-transform-private-methods', { loose: true }],
      '@babel/plugin-syntax-import-meta',
      'babel-plugin-transform-import-meta',
      'react-native-reanimated/plugin',
    ],
  };
};
