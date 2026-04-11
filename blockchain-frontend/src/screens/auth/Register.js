// screens/auth/Register.js
import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert, InteractionManager } from 'react-native';
import { Dialog, Portal, Card, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { Dropdown } from 'react-native-paper-dropdown';
import {
	WalletConnectModal
} from '@walletconnect/modal-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { providerMetadata, connectWallet } from '../../config/walletConnect';
import { useEthereum } from '../../hooks/useWalletConnect';
import { registerUser } from '../../utils/blockchain';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function Register({ navigation }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { getSigner, address } = useEthereum();
	const [message, setMessage] = useState(null);
	const [process, setProcess] = useState(null);
	const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { colors } = useTheme();
	
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kontak: '',
    role: '',
  });

  const OPTIONS = [
    { label: 'Pemerintah', value: 'PEMERINTAH' },
    { label: 'Mitra UKM', value: 'MITRA' },
    { label: 'UKM', value: 'UKM' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async () => {
    const { kode, nama, kontak, role } = formData;

    if (!kode || !nama || !kontak || !role) {
      Alert.alert('Registrasi Gagal', 'Semua field wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      // if (!isConnected) {
      //   console.log('⏳ Menunggu animasi selesai...');
      //   await new Promise(resolve => {
      //     InteractionManager.runAfterInteractions(() => {
      //       openModal().then(resolve).catch();
      //     });
      //   });
      // }

      // // Tunggu signer tersedia
      // let signer = null;
      // let retries = 0;
      // while (!signer && retries < 15) {
      //   signer = await getSigner();
      //   if (!signer) {
      //     await new Promise(r => setTimeout(r, 1000));
      //   }
      //   retries++;
      // }

      // if (!signer) {
      //   Alert.alert('Gagal', 'Signer tidak tersedia setelah koneksi wallet.');
      //   return;
      // }

      const signer = await getSigner();

      const address = await signer.getAddress();
      if (!address) throw new Error('Signer tidak memiliki address (belum terkoneksi)');


      // Kirim ke smart contract
      const txHash = await registerUser(signer, role, kode, nama, kontak);
      console.log('📦 Transaksi berhasil dikirim dengan hash:', txHash);

      await AsyncStorage.setItem('wallet', address);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('userid', kode);
      await AsyncStorage.setItem('nama', nama);
      await AsyncStorage.setItem('kontak', kontak);

      setProcess('Sukses');
      setMessage('Registrasi berhasil! Silakan login.');
      setVisible(true);
      navigation.navigate('MainApp', { screen: 'Dashboard' });

    } catch (err) {
      console.error('Registrasi error:', err);
      const errmsg =
        err?.response?.data?.error || err?.message || 'Terjadi kesalahan saat registrasi';
      setVisible(true);
      setProcess('Gagal');
      setMessage(errmsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="titleLarge" style={[styles.title, { color: colors.inverseSurface }]}>
          Register Bantuan UKM Application
        </Text>

        <TextInput
          label="ID"
          value={formData.kode}
          onChangeText={text => handleChange('kode', text)}
          style={styles.input}
        />

        <TextInput
          label="Nama"
          value={formData.nama}
          onChangeText={text => handleChange('nama', text)}
          style={styles.input}
        />

        <TextInput
          label="Nomor Kontak"
          value={formData.kontak}
          onChangeText={text => handleChange('kontak', text)}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <View style={styles.input}>
          <Dropdown
            label="Organisasi"
            placeholder="Pilih Organisasi"
            options={OPTIONS}
            value={formData.role}
            onSelect={value => handleChange('role', value)}
            visible={showDropdown}
            showDropDown={() => setShowDropdown(true)}
            onDismiss={() => setShowDropdown(false)}
          />
        </View>

        <TextInput
          label="Password"
          value={formData.password}
          onChangeText={text => handleChange('password', text)}
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.button}
          disabled={loading}
          loading={loading}
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </Button>


        <Text style={styles.loginText}>
          Sudah punya akun?{' '}
          <Text onPress={() => navigation.navigate('Login')} style={{ color: 'lightblue' }}>
            Login
          </Text>
        </Text>
      </ScrollView>
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Registrasi {process || '...'}</Dialog.Title>
          <Dialog.Content>
            <Text>{message || '...'}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <WalletConnectModal
        explorerRecommendedWalletIds={[
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        ]}
        explorerExcludedWalletIds={'ALL'}
        projectId="1cce4f444c2ea269a7c1cd573eaf9f5c"
        providerMetadata={providerMetadata}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
  },
  loginText: {
    marginTop: 12,
    textAlign: 'center',
  },
});
