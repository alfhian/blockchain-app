import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { decode as atob, encode as btoa } from 'base-64';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://ebff32081f096910aa926495f34de437@o4509933839712256.ingest.us.sentry.io/4509933855375360',
  enabled: !__DEV__,
  sendDefaultPii: true,
});

// Ignore warnings
LogBox.ignoreLogs([
  'Possible Unhandled Promise Rejection',
  'Possible EventEmitter memory leak detected',
  'No matching key. history:',
  'react-native-compat: application module is not available',
]);

// Polyfill for atob/btoa
if (typeof global.atob === 'undefined') global.atob = atob;
if (typeof global.btoa === 'undefined') global.btoa = btoa;

const AcademicTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CC9F0', // Bright Cyan for actions
    secondary: '#4895EF', // Professional Blue
    tertiary: '#4361EE', // Deep Tech Blue
    background: '#0F172A', // Slate Dark Background (Modern Blockchain feel)
    surface: '#1E293B', // Lighter Slate for Cards
    onSurface: '#F8FAFC',
    outline: '#334155',
    error: '#EF4444',
  },
};

export default Sentry.wrap(function App() {

  useEffect(() => {
    const clearStaleWalletSession = async () => {
      try {
        await AsyncStorage.removeItem('walletconnect');
        console.log('WalletConnect session cleared');
      } catch (e) {
        console.warn('Gagal hapus session:', e);
      }
    };
    clearStaleWalletSession();
  }, []); // Added empty dependency array

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={AcademicTheme}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
});
