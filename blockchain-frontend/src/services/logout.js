import AsyncStorage from '@react-native-async-storage/async-storage';

export const logout = async (navigation) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userid');
    await AsyncStorage.removeItem('role');
    await AsyncStorage.removeItem('nama');
    await AsyncStorage.removeItem('kontak');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  } catch (error) {
    console.error('Gagal logout:', error);
  }
};
