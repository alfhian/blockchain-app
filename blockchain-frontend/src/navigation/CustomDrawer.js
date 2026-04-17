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
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{nama}</Text>
        <Text style={styles.userRole}>{role}</Text>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>MAIN NAVIGATION</Text>
        
        <DrawerItem 
          label="Dashboard" 
          icon="dashboard" 
          active={route.name === 'MainApp'}
          onPress={() => {
            drawer.current.closeDrawer();
            navigation.navigate('MainApp');
          }}
        />

        {role === 'PEMERINTAH' && (
          <DrawerItem 
            label="Propose Budget" 
            icon="add-chart" 
            active={route.name === 'Anggaran'}
            onPress={() => {
              drawer.current.closeDrawer();
              navigation.navigate('Anggaran');
            }}
          />
        )}

        {role === 'MITRA' && (
          <DrawerItem 
            label="Allocate Funding" 
            icon="account-tree" 
            active={route.name === 'BimbinganUKM'}
            onPress={() => {
              drawer.current.closeDrawer();
              navigation.navigate('BimbinganUKM');
            }}
          />
        )}

        {role === 'UKM' && (
          <DrawerItem 
            label="Validate Receipt" 
            icon="verified" 
            active={route.name === 'ValidasiAnggaran'}
            onPress={() => {
              drawer.current.closeDrawer();
              navigation.navigate('ValidasiAnggaran');
            }}
          />
        )}

        <DrawerItem 
          label="Analytics Report" 
          icon="bar-chart" 
          active={route.name === 'Report'}
          onPress={() => {
            drawer.current.closeDrawer();
            navigation.navigate('Report');
          }}
        />
      </View>

      <View style={styles.footer}>
        <Button 
          icon="logout" 
          mode="text" 
          onPress={handleLogout}
          textColor="#EF4444"
          labelStyle={{ fontWeight: 'bold' }}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );

  return (
    <DrawerLayout
      ref={drawer}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={renderNavigationView}
    >
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
          <IconButton
            icon="menu"
            iconColor={colors.primary}
            size={28}
            onPress={() => drawer.current?.openDrawer()}
          />
          <Appbar.Content title="" />
          <IconButton 
            icon="bell-outline"
            iconColor="#94A3B8"
            size={24} 
            onPress={() => {}}
          />
        </Appbar.Header>
        <View style={styles.content}>
          {route.name === 'MainApp' && (
            <Dashboard/>
          )}
          {children}
        </View>
      </View>
    </DrawerLayout>
  );
}

const DrawerItem = ({ label, icon, onPress, active }) => (
  <Button
    mode={active ? "contained" : "text"}
    icon={({ color, size }) => <MaterialIcons name={icon} size={size} color={color} />}
    onPress={onPress}
    contentStyle={styles.drawerItemContent}
    style={[styles.drawerItem, active && styles.activeItem]}
    labelStyle={[styles.drawerItemLabel, { color: active ? '#0F172A' : '#94A3B8' }]}
  >
    {label}
  </Button>
);

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 50,
  },
  profileHeader: {
    paddingHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#4CC9F0',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginLeft: 16,
    marginBottom: 16,
  },
  drawerItem: {
    borderRadius: 12,
    marginBottom: 4,
  },
  activeItem: {
    backgroundColor: '#4CC9F0',
  },
  drawerItemContent: {
    justifyContent: 'flex-start',
    height: 48,
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
    width: '100%',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  }
});
