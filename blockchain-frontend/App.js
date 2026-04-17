import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, LogBox } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { WalletConnectModal } from '@walletconnect/modal-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { decode as atob, encode as btoa } from 'base-64';
import { providerMetadata } from './src/config/walletConnect';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://ebff32081f096910aa926495f34de437@o4509933839712256.ingest.us.sentry.io/4509933855375360',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
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
          <WalletConnectModal
            explorerRecommendedWalletIds={[
              'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            ]}
            explorerExcludedWalletIds={'ALL'}
            projectId="1cce4f444c2ea269a7c1cd573eaf9f5c"
            providerMetadata={providerMetadata}
            sessionParams={{
              namespaces: {
                eip155: {
                  methods: [
                    'eth_sendTransaction',
                    'eth_signTransaction',
                    'eth_sign',
                    'eth_signTypedData',
                    'personal_sign',
                  ],
                  chains: ['eip155:11155111'], // 👈 PENTING!
                  events: ['accountsChanged', 'chainChanged'],
                },
              },
            }}
          />
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
});