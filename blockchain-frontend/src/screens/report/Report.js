import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from "ethers";
import DrawerWithContent from "../../navigation/DrawerWithContent";
import { useEthereum } from "../../hooks/useWalletConnect";
import { getProvider } from "../../utils/blockchain";
import AnggaranBantuanABI from "../../abis/AnggaranBantuanABI.json";
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const CONTRACT_ADDRESS = "0x68a25bb8C9E7E1FF272023F948b2969793e09be7";
const ITEMS_PER_PAGE = 10;

const formatToJuta = (value) =>
  `${Math.floor(value / 1_000_000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} jt`;

const formatDateTime = (timestamp) =>
  dayjs(parseInt(timestamp.toString()) * 1000).format("DD MMM YYYY HH:mm");

const safeDecode = (value) => {
  try {
    return value ? ethers.decodeBytes32String(value) : "-";
  } catch {
    return "-";
  }
};

export default function AnggaranListByPemerintah({ navigation }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { address } = useEthereum();
  const { colors } = useTheme();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchAnggaran = async () => {
      try {
        const roleUser = await AsyncStorage.getItem('role');
        setRole(roleUser);

        const provider = getProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, AnggaranBantuanABI.abi, provider);

        const ringkas = await contract.getAllAnggaranRingkas();
        const dataLengkap = [];

        for (let item of ringkas) {
          const detail = await contract.getAnggaran(item.id);

          let include = false;
          if (address && roleUser === 'PEMERINTAH' && detail[1].toLowerCase() === address.toLowerCase()) include = true;
          if (address && roleUser === 'MITRA' && detail[7].toLowerCase() === address.toLowerCase()) include = true;
          const ukmList = detail[8];
          if (address && roleUser === 'UKM' && Array.isArray(ukmList) && ukmList.some(a => a.toLowerCase() === address.toLowerCase())) include = true;

          if (include) {
            dataLengkap.push({
              id: item.id.toString(),
              kodePemerintah: detail[2],
              jumlahAnggaran: item.jumlahAnggaran.toString(),
              kegiatan: detail[5],
              submitTimestamp: item.submitTimestamp.toString(),
              validasiTimestamp: item.validasiTimestamp.toString(),
              sudahValidasi: item.sudahValidasi,
              sudahDialokasikan: item.sudahDialokasikan,
            });
          }
        }
        setItems(dataLengkap.reverse()); // Newest first
      } catch (error) {
        console.error("Gagal ambil data anggaran:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnggaran();
  }, [address]);

  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusInfo = (item) => {
    if (role === 'PEMERINTAH') {
      if (!item.sudahDialokasikan) return { label: "Unallocated", color: "#F59E0B" };
      if (!item.sudahValidasi) return { label: "Pending", color: "#3B82F6" };
      return { label: "Validated", color: "#10B981" };
    }
    return item.sudahValidasi 
      ? { label: "Validated", color: "#10B981" } 
      : { label: "Pending", color: "#3B82F6" };
  };

  return (
    <DrawerWithContent navigation={navigation}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.headerSection}>
          <Text variant="headlineSmall" style={styles.headerTitle}>Transaction Audit</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>Blockchain Ledger Explorer</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Syncing ledger...</Text>
          </View>
        ) : items.length > 0 ? (
          <>
            {paginatedItems.map((item) => {
              const status = getStatusInfo(item);
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.idLabel}>ID #{item.id}</Text>
                    <View style={[styles.badge, { backgroundColor: `${status.color}20`, borderColor: status.color }]}>
                      <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Agency Code</Text>
                      <Text style={styles.value}>{safeDecode(item.kodePemerintah)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Amount</Text>
                      <Text style={[styles.value, { color: colors.primary }]}>Rp {formatToJuta(item.jumlahAnggaran)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Activity</Text>
                      <Text style={styles.value}>{safeDecode(item.kegiatan)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Submitted</Text>
                      <Text style={styles.value}>{formatDateTime(item.submitTimestamp)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            <View style={styles.pagination}>
              <Button 
                mode="outlined" 
                onPress={() => setPage(p => p - 1)} 
                disabled={page === 1}
                style={styles.pageBtn}
              >Prev</Button>
              <Text style={styles.pageText}>Page {page} of {Math.ceil(items.length / ITEMS_PER_PAGE)}</Text>
              <Button 
                mode="outlined" 
                onPress={() => setPage(p => p + 1)} 
                disabled={page * ITEMS_PER_PAGE >= items.length}
                style={styles.pageBtn}
              >Next</Button>
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <MaterialIcons name="info-outline" size={48} color="#475569" />
            <Text style={styles.loadingText}>No transactions found for this address.</Text>
          </View>
        )}
      </ScrollView>
    </DrawerWithContent>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
  },
  center: {
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  idLabel: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#64748B',
    fontSize: 13,
  },
  value: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  pageText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  pageBtn: {
    borderColor: '#334155',
  }
});
