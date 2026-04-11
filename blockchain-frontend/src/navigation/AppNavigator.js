// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import WalletConnect from '../screens/auth/WalletConnect';

import Register from '../screens/auth/Register';
import Login from '../screens/auth/Login';

import DrawerLayoutWrapper from './CustomDrawer';
import Dashboard from '../screens/layouts/Dashboard';
import Anggaran from '../screens/transactions/Anggaran';
import BimbinganUKM from '../screens/transactions/BimbinganUKM';
import ValidasiAnggaran from '../screens/transactions/ValidasiAnggaran';

import Report from '../screens/report/Report';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WalletConnect" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="WalletConnect" component={WalletConnect} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="MainApp" component={DrawerLayoutWrapper} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Anggaran" component={Anggaran} />
        <Stack.Screen name="BimbinganUKM" component={BimbinganUKM} />
        <Stack.Screen name="ValidasiAnggaran" component={ValidasiAnggaran} />
        <Stack.Screen name="Report" component={Report} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
