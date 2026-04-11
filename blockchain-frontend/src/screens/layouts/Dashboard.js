// DrawerLayoutWrapperMinimal.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useEthereum } from '../../hooks/useWalletConnect';
import { Dimensions } from "react-native";
import AnggaranPieChart from "../components/report/AnggaranPieChart";
import LineChartAnggaran from "../components/report/AnggaranLineChart";
import { getPublicRpcProvider } from '../../utils/getPublicRpcProvider';
import { ethers } from 'ethers';
import AnggaranBantuanABI from '../../abis/AnggaranBantuanABI.json';
import { pieChartAnggaran } from '../../utils/blockchain';

const screenWidth = Dimensions.get("window").width;
const CONTRACT_ADDRESS = '0x68a25bb8C9E7E1FF272023F948b2969793e09be7';

export default function Dashboard({ navigation }) {
  const [role, setRole] = useState(null);
  const [kode, setKode] = useState(null);
  const [nama, setNama] = useState(null);
  const { address } = useEthereum();
  
  const [formattedStats, setFormattedStats] = useState(null);

  const { colors } = useTheme();

  const fetchUser = async () => {
    const roleUser = await AsyncStorage.getItem('role');
    const kodeUser = await AsyncStorage.getItem('userid');
    const namaUser = await AsyncStorage.getItem('nama');
    console.log(roleUser);
    

    setRole(roleUser);
    setKode(kodeUser);
    setNama(namaUser);
  }

  useEffect(() => {
    const pieChart = async () => {
			const savedRole = await AsyncStorage.getItem('role');

			const stats = await pieChartAnggaran(savedRole, address);
      console.log(stats);

      setFormattedStats(stats);
		};

    fetchUser();
    pieChart(); 
  }, []);

  return (  
    <ScrollView style={[styles.userInformation]}>
      <Text variant="titleLarge" style={{ marginTop: 10, color: colors.inverseSurface }}>
        Hi, {nama} !
      </Text>
      <Card style={{ marginTop: 20 }}>
        <Card.Content style={{ alignItems: 'center' }}>
          {!formattedStats ? (
            <Text style={{ textAlign: 'center' }}>Memuat data chart...</Text>
          ) : (
            <AnggaranPieChart stats={formattedStats} />
          )}
          {role == 'PEMERINTAH' &&
            <>
              <View style={styles.chartRow}>
                <MaterialIcons name="fiber-manual-record" size={14} color="#ff7675" />
                <Text style={styles.pieChartLabel}>Belum Dialokasi: {formattedStats?.belumDialokasikan ?? '-'}</Text>
              </View>
              <View style={styles.chartRow}>
                <MaterialIcons name="fiber-manual-record" size={14} color="#ffeaa7" />
                <Text style={styles.pieChartLabel}>Menunggu Validasi: {formattedStats?.menungguValidasi ?? '-'}</Text>
              </View>
              <View style={styles.chartRow}>
                <MaterialIcons name="fiber-manual-record" size={14} color="#55efc4" />
                <Text style={styles.pieChartLabel}>Tervalidasi: {formattedStats?.tervalidasi ?? '-'}</Text>
              </View>
            </>
          }
          {(role == 'MITRA' || role == 'UKM') &&
            <>
              <View style={styles.chartRow}>
                <MaterialIcons name="fiber-manual-record" size={14} color="#ffeaa7" />
                <Text style={styles.pieChartLabel}>Menunggu Validasi: {formattedStats?.menungguValidasi ?? '-'}</Text>
              </View>
              <View style={styles.chartRow}>
                <MaterialIcons name="fiber-manual-record" size={14} color="#55efc4" />
                <Text style={styles.pieChartLabel}>Tervalidasi: {formattedStats?.tervalidasi ?? '-'}</Text>
              </View>
            </>
          }
        </Card.Content>
      </Card>

      <View style={{ padding: 16 }}>
        <LineChartAnggaran />
      </View>

      {/* <View style={{ padding: 16 }}>
        <LineChartAnggaran />
      </View> */}

      {/* <Text variant="titleLarge" style={{ marginVertical: 20, color: colors.inverseSurface }}>
        Your Details
      </Text>
      <View style={styles.userDetails}>
        <View style={styles.userDetailsLabel}>
          <MaterialIcons name="fingerprint" size={20} color="#fff"/>
          <Text style={styles.labelText}>Kode</Text>
        </View>
        <Text style={styles.valueText}>{kode}</Text>
      </View>
      <View style={styles.userDetails}>
        <View style={styles.userDetailsLabel}>
          <MaterialIcons name="person" size={20} color="#fff"/>
          <Text style={styles.labelText}>Nama</Text>
        </View>
        <Text style={styles.valueText}>{nama}</Text>
      </View>
      <View style={styles.userDetails}>
        <View style={styles.userDetailsLabel}>
          <MaterialIcons name="verified-user" size={20} color="#fff"/>
          <Text style={styles.labelText}>Role</Text>
        </View>
        <Text style={styles.valueText}>{isReadable(role)}</Text>
      </View>
      <View style={styles.userDetails}>
        <View style={styles.userDetailsLabel}>
          <MaterialIcons name="phone" size={20} color="#fff" />
          <Text style={styles.labelText}>Kontak</Text>
        </View>
        <Text style={styles.valueText}>081292277031</Text>
      </View> */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pieChartContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginVertical: 4,
  },
  pieChartLabel: {
    color: '#fff',
    marginLeft: 5,
  },
  user: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userInformation: {
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#454545', 
    borderRadius: 10,
    borderWidth: 2, 
    borderColor: '#A8A8A8',
  },

  userDetailsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  labelText: {
    marginLeft: 8,
    color: '#fff',
  },

  valueText: {
    color: '#fff',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 20,
  }
});
