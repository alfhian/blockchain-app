import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DrawerContentScrollView,
  DrawerItem,
  createDrawerNavigator
} from '@react-navigation/drawer';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { logout } from '../services/logout';

import Dashboard from '../screens/layouts/Dashboard';
// import Anggaran from '../screens/transactions/Anggaran';
// import BimbinganUKM from '../screens/transactions/BimbinganUKM';
// import ValidasiAnggaran from '../screens/transactions/ValidasiAnggaran';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getRole = async () => {
      const savedRole = await AsyncStorage.getItem('role');
      setRole(savedRole);
      console.log(savedRole);
      
    };
    getRole();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 20, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Menu Utama</Text>
      </View>

      <DrawerContentScrollView {...props}>
        {role === 'PEMERINTAH' && (
          <>
            <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate('Dashboard')} />
            {/* <DrawerItem label="Anggaran" onPress={() => props.navigation.navigate('Anggaran')} /> */}
          </>
        )}
        {role === 'MITRA' && (
          <>
            <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate('Dashboard')} />
            {/* <DrawerItem label="Bimbingan UKM" onPress={() => props.navigation.navigate('Bimbingan UKM')} /> */}
          </>
        )}
        {role === 'UKM' && (
          <>
            <DrawerItem label="Dashboard" onPress={() => props.navigation.navigate('Dashboard')} />
            {/* <DrawerItem label="Validasi Anggaran" onPress={() => props.navigation.navigate('Validasi Anggaran')} /> */}
          </>
        )}
      </DrawerContentScrollView>

      <View style={{ padding: 20 }}>
        <Button mode="contained" onPress={() => logout(props.navigation)}>Logout</Button>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard" drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      {/* <Drawer.Screen
        name="index" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: 'Home',
          title: 'overview',
        }}
      /> */}
      {/* <Drawer.Screen name="Anggaran" component={Anggaran} /> */}
      {/* <Drawer.Screen name="Bimbingan UKM" component={BimbinganUKM} />
      <Drawer.Screen name="Validasi Anggaran" component={ValidasiAnggaran} /> */}
    </Drawer.Navigator>
  );
}
