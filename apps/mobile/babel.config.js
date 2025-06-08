module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/features': './src/features',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/types': './src/types',
            '@/styles': './src/styles',
            '@/config': './src/config',
          },
        },
      ],
    ],
  };
}; 