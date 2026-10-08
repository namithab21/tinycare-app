// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const nodeGlobals = Object.fromEntries(
  ['Buffer', 'process', 'console', 'fetch', 'URL', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'].map((g) => [g, 'readonly']),
);

module.exports = defineConfig([
  expoConfig,
  // Plain-Node code (server + tests) is not React Native: give it Node globals.
  { files: ['server/**', 'tests/**', 'scripts/**'], languageOptions: { globals: nodeGlobals } },
  { ignores: ['dist/*', 'dist-android/*', 'dist-ios/*', 'shots/*', 'docs/*', 'server/data/*'] },
]);
