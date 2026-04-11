// DrawerLayoutWrapperMinimal.js
import React, { useRef, useState, useEffect } from 'react';
import { DrawerLayout } from 'react-native-gesture-handler';
import { View, StyleSheet, Text } from 'react-native';
import { IconButton, Button, useTheme, Appbar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { providerMetadata, connectWallet } from '../config/walletConnect';
import { useEthereum } from '../hooks/useWalletConnect';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import Dashboard from '../screens/layouts/Dashboard';

export default function DrawerLayoutWrapper({ navigation, children }) {
  const drawer = useRef(null);
  const route = useRoute();
  const [role, setRole] = useState(null);
  const [kode, setKode] = useState(null);
  const [nama, setNama] = useState(null);

  const { colors } = useTheme();

  const fetchUser = async () => {
    const roleUser = await AsyncStorage.getItem('role');
    const kodeUser = await AsyncStorage.getItem('userid');
    const namaUser = await AsyncStorage.getItem('nama');

    setRole(roleUser);
    setKode(kodeUser);
    setNama(namaUser);
  }

  useEffect(() => {
    console.log(route.name);
    
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const renderNavigationView = () => (
    <View style={styles.drawerContent}>
      {/* Tombol Close */}
      <View style={styles.closeButtonContainer}>
        <IconButton
          icon="close"
          size={24}
          onPress={() => drawer.current?.closeDrawer()}
        />
      </View>

      <Text style={[styles.user, { color: colors.inverseSurface }]}>{nama}</Text>

      <Text style={[styles.title, { color: colors.inverseSurface }]}>Menu Utama</Text>

      <View style={styles.menu}>
        {role === 'PEMERINTAH' && (
          <>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('MainApp');
              }}
            >
              Dashboard
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('Anggaran');
              }}
            >
              Anggaran
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('Report');
              }}
            >
              Laporan
            </Button>
          </>
        )}

        {role === 'MITRA' && (
          <>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('MainApp');
              }}
            >
              Dashboard
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('BimbinganUKM');
              }}
            >
              Bimbingan UKM
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('Report');
              }}
            >
              Laporan
            </Button>
          </>
        )}

        {role === 'UKM' && (
          <>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('MainApp');
              }}
            >
              Dashboard
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('ValidasiAnggaran');
              }}
            >
              Validasi Anggaran
            </Button>
            <Button
              contentStyle={{ justifyContent: 'flex-start' }}
              labelStyle={{ textAlign: 'left', width: '100%', color: colors.inverseSurface }}
              onPress={() => {
                drawer.current.closeDrawer();
                navigation.navigate('Report');
              }}
            >
              Laporan
            </Button>
          </>
        )}
      </View>
      
    </View>
  );

  return (
    <DrawerLayout
      ref={drawer}
      drawerWidth={280}
      drawerPosition="left"
      renderNavigationView={renderNavigationView}
    >
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Appbar.Header>
          {/* Tombol Hamburger */}
          <IconButton
            icon="menu"
            size={24}
            onPress={() => drawer.current?.openDrawer()}
            style={styles.hamburgerIcon}
          />
          <IconButton 
            icon="logout"
            size={24} 
            style={styles.logoutIcon} 
            onPress={handleLogout}
          />
        </Appbar.Header>
        <View style={styles.container}>
          {route.name === 'MainApp' && (
            <Dashboard/>
          )}
          {children}
        </View>
      </View>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2C2B2B',
  },
  container: {
    padding: 20,
  },
  user: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userInformation: {
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    padding: 20,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentText: {
    fontSize: 18,
    marginTop: 100,
    textAlign: 'center',
  },
  hamburgerIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  logoutIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
  },
  menu: {
    justifyContent: 'flex-start'
  }
});
