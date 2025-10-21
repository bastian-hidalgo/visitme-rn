import 'react-native-url-polyfill/auto';

const globalScope = globalThis;

if (typeof globalScope.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalScope.WebSocket = require('react-native-websocket');
}

import 'expo-router/entry';
