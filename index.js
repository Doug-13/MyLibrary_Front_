/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// 

AppRegistry.registerComponent(appName, () => App);



// import { AppRegistry, LogBox } from 'react-native';
// import { name as appName } from './app.json';

// console.log('[BOOT] index.js start');

// // Não esconda nada por enquanto
// LogBox.ignoreAllLogs(false);

// // Global error handler
// if (global.ErrorUtils) {
//   const prev = global.ErrorUtils.getGlobalHandler?.();
//   global.ErrorUtils.setGlobalHandler((err, isFatal) => {
//     console.error('[GLOBAL ERROR]', isFatal, err?.message, err?.stack);
//     prev && prev(err, isFatal);
//   });
// }

// let Root;
// try {
//   console.log('[BOOT] importing App...');
//   Root = require('./App').default; // evita throw de import quebrar o registro
//   console.log('[BOOT] App imported OK');
// } catch (e) {
//   console.error('[BOOT] FAILED importing App:', e?.message, e?.stack);
//   // evita “has not been registered” por falta de componente
//   Root = () => null;
// }

// try {
//   AppRegistry.registerComponent('MyLibrary', () => {
//     console.log('[BOOT] registerComponent executed (MyLibrary)');
//     return Root;
//   });
//   console.log('[BOOT] registerComponent done');
// } catch (e) {
//   console.error('[BOOT] registerComponent ERROR:', e?.message, e?.stack);
// }
