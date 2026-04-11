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
          style={{ width: 200, height: 200, marginBottom: 10 }}
        />
        <Text 
          variant="titleLarge"
          style={{marginBottom: 20, textAlign: 'center', color: colors.inverseSurface}}
        >
          Log In Bantuan UKM App
        </Text>
      </View>

      <View style={styles.bottomContent}>
        <TextInput
          label="Kode"
          value={kode}
          style={{ color: colors.text }}
          disabled
        />

        <TextInput
          label="Nama"
          value={nama}
          style={{ color: colors.text }}
          disabled
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={{ marginTop: 20 }}
        >
          Log In
        </Button>

        <Text style={{marginTop: 10, color: colors.inverseSurface}}>Don't have an account? <Text onPress={handleRegister} style={{color: 'lightblue'}}>Register</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
		alignContent: 'center',
  },
  topContent: {
    alignItems: 'center',
    marginTop: 40,
  },
  bottomContent: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginTop: 8,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
  },
});
