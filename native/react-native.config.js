module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: './platform/RillSandboxNative.podspec',
      },
      macos: {
        podspecPath: './platform/RillSandboxNative.podspec',
      },
      android: {
        sourceDir: './platform/android',
      },
    },
  },
};
