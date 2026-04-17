import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Button, Text, TextInput, RadioButton, useTheme } from 'react-native-paper';
import { useEthereum } from '../../hooks/useWalletConnect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { getUserDetails } from '../../utils/blockchain';

export default function Login({ navigation }) {
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const { provider, address } = useEthereum();
  const [loading, setLoading] = useState(true);
  
  const { colors } = useTheme();

  const fetchUser = async () => {
    console.log(address);
    
    const [roleUser, kodeUser, namaUser, kontakUser] = await getUserDetails(address);

    await AsyncStorage.setItem('role', roleUser);
    await AsyncStorage.setItem('userid', kodeUser);
    await AsyncStorage.setItem('nama', namaUser);
    await AsyncStorage.setItem('kontak', kontakUser);

    setKode(kodeUser);
    setNama(namaUser);

    console.log(roleUser);
    
    if (roleUser?.trim()) {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = async () => {
    try {
      navigation.navigate('MainApp', { screen: 'Dashboard'});
    } catch (err) {
      console.error(err);
      const errorMsg =
      err.response?.data?.error || 'Terjadi kesalahan, silakan coba lagi.';
      Alert.alert('Login Gagal', errorMsg);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.topContent}>
        <LottieView
          source={require('../../../assets/lottie/login.json')}
          autoPlay
          loop
          style={{ width: 220, height: 220, marginBottom: 10 }}
        />
        <Text 
          variant="headlineMedium"
          style={{marginBottom: 10, textAlign: 'center', color: colors.primary, fontWeight: 'bold'}}
        >
          EduChain Bantuan
        </Text>
        <Text 
          variant="bodyMedium"
          style={{marginBottom: 20, textAlign: 'center', color: '#94A3B8'}}
        >
          Secure Blockchain Ecosystem for Academic Funding
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <TextInput
          label="User ID"
          value={kode}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <TextInput
          label="Nama Lengkap"
          value={nama}
          mode="outlined"
          style={styles.input}
          disabled
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.loginButton}
          labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
        >
          Log In to Dashboard
        </Button>

        <Text style={{marginTop: 20, textAlign: 'center', color: '#94A3B8'}}>
          Don't have an account? {' '}
          <Text onPress={handleRegister} style={{color: colors.primary, fontWeight: 'bold'}}>
            Register Now
          </Text>
        </Text>
      </View>
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
    marginBottom: 20,
  },
  bottomContent: {
    paddingHorizontal: 10,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  loginButton: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
