import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import { Portal, Dialog, Button, Text, TextInput, useTheme } from 'react-native-paper';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import { useEthereum } from '../../hooks/useWalletConnect';
import { getAnggaranBelumDialokasikan, getUserDetails, getAllUkm, alokasikanAnggaran, getInfoAnggaran, getProvider } from '../../utils/blockchain';

/**
 * Screen for Mitra to allocate budget to UKMs.
 */
export default function BimbinganUKM({ navigation }) {
  const [id, setId] = useState('');
  const [idOptions, setIdOptions] = useState([]);
  const [idPemerintah, setIdPemerintah] = useState('');
  const [idMitraUKM, setIdMitraUKM] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [anggaranPemerintah, setAnggaranPemerintah] = useState('');
  const [rawAnggaranPemerintah, setRawAnggaranPemerintah] = useState(0);
  const [kodeRegulasi, setKodeRegulasi] = useState('');
  
  const [ukm1, setUkm1] = useState('');
  const [ukm2, setUkm2] = useState('');
  const [ukm3, setUkm3] = useState('');
  const [anggaran1, setAnggaran1] = useState('');
  const [anggaran2, setAnggaran2] = useState('');
  const [anggaran3, setAnggaran3] = useState('');
  
  const [ukmOptions, setUkmOptions] = useState([]);
  const { getSigner, address } = useEthereum();
  
  const [message, setMessage] = useState(null);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { colors } = useTheme();
  
  const KEGIATAN_OPTIONS = [
    { label: 'Bimbingan', value: 'Bimbingan' },
    { label: 'Pelatihan', value: 'Pelatihan' },
    { label: 'Pendampingan', value: 'Pendampingan' },
  ];

  const ANGGARAN_OPTIONS = [
    { label: '5.000.000', value: '5000000' },
    { label: '10.000.000', value: '10000000' },
    { label: '15.000.000', value: '15000000' },
    { label: '20.000.000', value: '20000000' },
    { label: '25.000.000', value: '25000000' },
    { label: '30.000.000', value: '30000000' },
  ];

  const loadInitialData = async () => {
    if (!address) return;
    try {
      const ids = await getAnggaranBelumDialokasikan();
      const userData = await getUserDetails(address);
      setIdMitraUKM(userData[1] || '');
      setIdOptions(ids);
      
      const ukms = await getAllUkm();
      setUkmOptions(ukms);
    } catch (err) {
      console.error("Gagal load data awal:", err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [address]);

  const handleSelectAnggaran = async (selectedId) => {
    if (!selectedId) {
      resetForm();
      return;
    }
    try {
      const data = await getInfoAnggaran(selectedId);
      setIdPemerintah(data[0]);
      setKodeRegulasi(data[1]);
      setAnggaranPemerintah(data[2]);
      setRawAnggaranPemerintah(Number(data[3]));
    } catch (err) {
      console.error("Gagal load info anggaran:", err);
    }
  };

  const resetForm = () => {
    setIdPemerintah('');
    setKodeRegulasi('');
    setAnggaranPemerintah('');
    setRawAnggaranPemerintah(0);
  };

  const getFilteredOptions = (excludeList = []) => {
    return ukmOptions.filter(option => !excludeList.includes(option.value));
  };

  const handleBimbinganUKM = async () => {
    if (!id || !kegiatan || (!ukm1 && !ukm2 && !ukm3)) {
      Alert.alert('Validasi', 'ID, Kegiatan, dan minimal 1 UKM harus diisi');
      return;
    }

    const ukmAddresses = [ukm1, ukm2, ukm3].filter(Boolean);
    const anggaranUkmValues = [anggaran1, anggaran2, anggaran3].filter((_, i) => [ukm1, ukm2, ukm3][i]).map(Number);

    if (ukmAddresses.length !== anggaranUkmValues.length) {
      Alert.alert('Validasi', 'Setiap UKM terpilih harus memiliki alokasi anggaran.');
      return;
    }

    const totalAlokasi = anggaranUkmValues.reduce((a, b) => a + b, 0);

    if (totalAlokasi > rawAnggaranPemerintah) {
      Alert.alert('Validasi', `Total alokasi (${totalAlokasi}) melebihi anggaran pemerintah (${rawAnggaranPemerintah})`);
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

      const txHash = await alokasikanAnggaran(signer, id, kegiatan, ukmAddresses, anggaranUkmValues);
      console.log('Alokasi tx sent:', txHash);

      const provider = getProvider();
      const receipt = await provider.waitForTransaction(txHash);

      if (receipt && receipt.status === 1) {
        setProcess('Sukses');
        setMessage('Anda berhasil alokasikan anggaran!');
        setId('');
        resetForm();
        setUkm1(''); setUkm2(''); setUkm3('');
        setAnggaran1(''); setAnggaran2(''); setAnggaran3('');
        loadInitialData(); // Refresh list
      } else {
        setProcess('Gagal');
        setMessage('Transaksi gagal di blockchain.');
      }
      setVisible(true);
    } catch (err) {
      console.error('Gagal alokasi:', err);
      const errmsg = err?.reason || err?.message || 'Gagal alokasi anggaran';
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
          <MaterialIcons name="account-tree" size={40} color={colors.primary} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Budget Allocation
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Distribute government funding to selected UKM participants
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="labelLarge" style={styles.groupLabel}>SOURCE BUDGET</Text>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Select Government Proposal"
              placeholder="Choose ID"
              options={idOptions} 
              value={id}
              onSelect={(selectedId) => {
                setId(selectedId);
                handleSelectAnggaran(selectedId);
              }}
              mode="outlined"
            />
          </View>
          
          <View style={styles.row}>
            <TextInput
              label="Dept ID"
              value={idPemerintah}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              disabled
              mode="outlined"
            />
            <TextInput
              label="Reg Code"
              value={kodeRegulasi}
              style={[styles.input, { flex: 1 }]}
              disabled
              mode="outlined"
            />
          </View>

          <TextInput
            label="Total Available Budget (IDR)"
            value={anggaranPemerintah}
            style={styles.input}
            disabled
            mode="outlined"
          />

          <View style={styles.divider} />

          <Text variant="labelLarge" style={styles.groupLabel}>ALLOCATION DETAILS</Text>
          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Activity Type"
              placeholder="Select Activity"
              options={KEGIATAN_OPTIONS}
              value={kegiatan}
              onSelect={setKegiatan}
              mode="outlined"
            />
          </View>

          <View style={styles.ukmListHeader}>
            <Text variant="labelMedium" style={{ color: '#94A3B8' }}>UKM PARTICIPANTS (Max 3)</Text>
          </View>

          {/* UKM Group 1 */}
          <View style={styles.ukmGroup}>
            <Dropdown
              label="UKM 1"
              options={getFilteredOptions([ukm2, ukm3])}
              value={ukm1}
              onSelect={setUkm1}
              mode="outlined"
            />
            <View style={{ marginTop: 8 }}>
              <Dropdown
                label="Amount 1"
                options={ANGGARAN_OPTIONS}
                value={anggaran1}
                onSelect={setAnggaran1}
                mode="outlined"
              />
            </View>
          </View>

          {/* UKM Group 2 */}
          <View style={styles.ukmGroup}>
            <Dropdown
              label="UKM 2 (Optional)"
              options={getFilteredOptions([ukm1, ukm3])}
              value={ukm2}
              onSelect={setUkm2}
              mode="outlined"
            />
            <View style={{ marginTop: 8 }}>
              <Dropdown
                label="Amount 2"
                options={ANGGARAN_OPTIONS}
                value={anggaran2}
                onSelect={setAnggaran2}
                mode="outlined"
              />
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleBimbinganUKM}
            disabled={!id || !kegiatan || loading}
            loading={loading}
            style={styles.submitButton}
            contentStyle={{ height: 50 }}
          >
            Execute Allocation
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={{ color: process === 'Sukses' ? '#10B981' : '#EF4444' }}>
            {process === 'Sukses' ? 'Success' : 'Failed'}
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 40,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownWrapper: {
    marginBottom: 16,
  },
  ukmListHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 8,
  },
  ukmGroup: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 24,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  dialog: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
});
