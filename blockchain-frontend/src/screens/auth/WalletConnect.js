import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useEthereum } from '../../hooks/useWalletConnect';
import {
  WalletConnectModal,
  useWalletConnectModal,
} from '@walletconnect/modal-react-native';
import { providerMetadata } from '../../config/walletConnect';
import LottieView from 'lottie-react-native';
import { getUserDetails } from '../../utils/blockchain';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletConnect({ navigation }) {
  const { provider } = useWalletConnectModal();
  const { isConnected, openModal, safeDisconnect, address } = useEthereum();
  const [loading, setLoading] = useState(false);

  const { colors } = useTheme();

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (isConnected) {
        await safeDisconnect();
      } else {
        await openModal();
      }
    } catch (err) {
      console.error('🔴 Koneksi gagal:', err);
      Alert.alert('Koneksi Gagal', err?.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topContent}>
        <LottieView
          source={require('../../../assets/lottie/walletconnect.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text
          variant="titleLarge"
          style={{
            marginTop: 16,
            textAlign: 'center',
            color: colors.inverseSurface,
          }}
        >
          Hubungkan MetaMask Wallet
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <Text style={{ textAlign: 'center' }}>
          {isConnected ? 'Wallet Address : ' + address : 'Belum Terhubung'}
        </Text>

        <Button
          mode="contained"
          onPress={handleConnect}
          disabled={loading}
          loading={loading}
          style={{ marginTop: 24 }}
        >
          {loading ? 'Memproses...' : isConnected ? 'Putuskan Koneksi' : 'Hubungkan'}
        </Button>

        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!isConnected}
          style={{ marginTop: 16 }}
        >
          Lanjut
        </Button>
      </View>

      <WalletConnectModal
        explorerRecommendedWalletIds={[
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        ]}
        explorerExcludedWalletIds="ALL"
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
              chains: ['eip155:11155111'],
              events: ['accountsChanged', 'chainChanged'],
            },
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  topContent: {
    alignItems: 'center',
    marginTop: 40,
  },
  bottomContent: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
});
