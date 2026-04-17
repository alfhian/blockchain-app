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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.welcomeText}>
            Welcome back,
          </Text>
          <Text variant="headlineMedium" style={styles.nameText}>
            {nama}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statTile, { backgroundColor: '#1E293B' }]}>
          <MaterialIcons name="account-balance-wallet" size={24} color={colors.primary} />
          <Text style={styles.statValue}>
            {role === 'PEMERINTAH' ? (formattedStats?.belumDialokasikan || 0) : (formattedStats?.menungguValidasi || 0)}
          </Text>
          <Text style={styles.statLabel}>{role === 'PEMERINTAH' ? 'Unallocated' : 'Pending'}</Text>
        </View>
        <View style={[styles.statTile, { backgroundColor: '#1E293B' }]}>
          <MaterialIcons name="verified" size={24} color="#10B981" />
          <Text style={styles.statValue}>{formattedStats?.tervalidasi || formattedStats?.tervalidasi || 0}</Text>
          <Text style={styles.statLabel}>Validated</Text>
        </View>
      </View>

      <Text variant="titleMedium" style={styles.sectionTitle}>Analytics Overview</Text>
      
      <Card style={styles.mainCard}>
        <Card.Content style={{ alignItems: 'center' }}>
          {!formattedStats ? (
            <Text style={{ color: '#94A3B8' }}>Syncing data...</Text>
          ) : (
            <AnggaranPieChart stats={formattedStats} />
          )}
          
          <View style={styles.legendContainer}>
            {role == 'PEMERINTAH' &&
              <>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Unallocated</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Validated</Text>
                </View>
              </>
            }
            {(role == 'MITRA' || role == 'UKM') &&
              <>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Validated</Text>
                </View>
              </>
            }
          </View>
        </Card.Content>
      </Card>

      <View style={{ marginTop: 24, marginBottom: 40 }}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Funding Activity Trend
        </Text>
        <Card style={styles.mainCard}>
          <Card.Content>
            <LineChartAnggaran />
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 24,
  },
  welcomeText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  nameText: {
    color: '#F8FAFC',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  roleBadge: {
    backgroundColor: 'rgba(76, 201, 240, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.3)',
  },
  roleText: {
    color: '#4CC9F0',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statTile: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#F8FAFC',
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 18,
  },
  mainCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 0,
  },
  legendContainer: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
