module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Agar NativeWind use kar rahe hain toh wo plugin yahan hoga
      'react-native-reanimated/plugin',
    ],
  };
};