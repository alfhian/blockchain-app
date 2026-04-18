import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import { Dialog, Portal, Button, Text, TextInput, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import { useEthereum } from '../../hooks/useWalletConnect';
import { getAnggaranUntukUKM, getUserDetails, getAnggaranUntukUKMById, validasiDana, getProvider } from '../../utils/blockchain';

/**
 * Screen for UKM to validate received budget allocations.
 */
export default function ValidasiAnggaran({ navigation }) {
  const [id, setId] = useState('');
  const [idOptions, setIdOptions] = useState([]);
  const [idPemerintah, setIdPemerintah] = useState('');
  const [idMitraUKM, setIdMitraUKM] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [anggaranPemerintah, setAnggaranPemerintah] = useState('');
  const [kodeRegulasi, setKodeRegulasi] = useState('');
  const [kodeUKM, setKodeUKM] = useState('');
  const [anggaran, setAnggaran] = useState('');
  
  const { getSigner, address } = useEthereum();
  
  const [message, setMessage] = useState(null);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();

  const loadAnggaranUKM = async () => {
    if (!address) return;
    try {
      const ids = await getAnggaranUntukUKM(address);
      const [,,, ] = await getUserDetails(address); // Just to ensure user exists
      
      // We'll get kodeUKM from the specific budget details later or from a separate call
      const userData = await getUserDetails(address);
      setKodeUKM(userData[1] || '');
      
      setIdOptions(ids);
    } catch (err) {
      console.error("Gagal ambil ID anggaran:", err);
    }
  };

  const handleSelectAnggaran = async (selectedId) => {
    if (!selectedId) {
      resetForm();
      return;
    }
    try {
      const data = await getAnggaranUntukUKMById(selectedId, address);
      // Data format from blockchain.js: [kodePemerintah, kodeRegulasi, formattedTotal, rawTotal, kegiatan, kodeMitra, formattedAlokasi]
      setIdPemerintah(data[0]);
      setKodeRegulasi(data[1]);
      setAnggaranPemerintah(data[2]);
      setKegiatan(data[4]);
      setIdMitraUKM(data[5]);
      setAnggaran(data[6]);
    } catch (err) {
      console.error("Gagal load detail anggaran:", err);
      Alert.alert("Error", "Gagal mengambil detail anggaran.");
    }
  };

  const resetForm = () => {
    setIdPemerintah('');
    setKodeRegulasi('');
    setAnggaranPemerintah('');
    setKegiatan('');
    setIdMitraUKM('');
    setAnggaran('');
  };

  useEffect(() => {
    loadAnggaranUKM();
  }, [address]);

  const handleValidasiAnggaran = async () => {
    if (!id) {
      Alert.alert('Validasi', 'Pilih ID Transaksi terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        Alert.alert('Signer Error', 'Wallet belum terkoneksi.');
        setLoading(false);
        return;
      }

      const txHash = await validasiDana(signer, id);
      console.log('Validasi tx sent:', txHash);

      const provider = getProvider();
      const receipt = await provider.waitForTransaction(txHash);

      if (receipt && receipt.status === 1) {
        setProcess('Sukses');
        setMessage('Anda berhasil validasi anggaran!');
        setId('');
        resetForm();
        loadAnggaranUKM(); // Refresh list
      } else {
        setProcess('Gagal');
        setMessage('Transaksi gagal di blockchain.');
      }
      setVisible(true);
    } catch (err) {
      console.error('Gagal validasi:', err);
      const errmsg = err?.reason || err?.message || 'Gagal validasi anggaran';
      setProcess('Gagal');
      setMessage(errmsg);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerWithContent navigation={navigation}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.formHeader}>
          <MaterialIcons name="verified" size={40} color="#10B981" />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Validate Receipt
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Confirm that you have received the allocated academic funding
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="labelLarge" style={styles.groupLabel}>TRANSACTION SELECTOR</Text>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Active Allocations"
              placeholder="Select Transaction ID"
              options={idOptions} 
              value={id}
              onSelect={(selectedId) => {
                setId(selectedId);
                handleSelectAnggaran(selectedId);
              }}
              mode="outlined"
            />
          </View>
        
          <View style={styles.divider} />

          <Text variant="labelLarge" style={styles.groupLabel}>FUNDING ORIGIN</Text>
          <TextInput
            label="Government Agency"
            value={idPemerintah}
            style={styles.input}
            disabled
            mode="outlined"
            left={<TextInput.Icon icon="bank-outline" />}
          />

          <TextInput
            label="Mitra Coordinator"
            value={idMitraUKM}
            style={styles.input}
            disabled
            mode="outlined"
            left={<TextInput.Icon icon="account-tie-outline" />}
          />

          <TextInput
            label="Regulation Reference"
            value={kodeRegulasi}
            style={styles.input}
            disabled
            mode="outlined"
          />

          <View style={styles.infoRow}>
             <MaterialIcons name="event-note" size={20} color="#94A3B8" />
             <Text style={styles.infoText}>Activity: {kegiatan || '-'}</Text>
          </View>

          <View style={styles.divider} />

          <Text variant="labelLarge" style={[styles.groupLabel, { color: '#10B981' }]}>YOUR ALLOCATION</Text>
          
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Confirmed Amount (IDR)</Text>
            <Text style={styles.amountValue}>{anggaran || '0'}</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleValidasiAnggaran}
            disabled={!id || loading}
            loading={loading}
            style={[styles.submitButton, { backgroundColor: '#10B981' }]}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontWeight: 'bold' }}
          >
            Confirm Receipt
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={{ color: process === 'Sukses' ? '#10B981' : '#EF4444' }}>
            {process === 'Sukses' ? 'Validation Successful' : 'Validation Failed'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">{message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)} textColor={colors.primary}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </DrawerWithContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontWeight: '800',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupLabel: {
    color: '#4CC9F0',
    marginBottom: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  dropdownWrapper: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    color: '#CBD5E1',
    marginLeft: 8,
    fontSize: 14,
  },
  amountCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 24,
    alignItems: 'center',
  },
  amountLabel: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountValue: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  submitButton: {
    borderRadius: 12,
  },
  dialog: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
});
