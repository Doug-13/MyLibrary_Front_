module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [

    // 'react-native-reanimated/plugin', // <- precisa estar por último
    'react-native-worklets/plugin',
  ],
};
