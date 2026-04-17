import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog, Portal, Button, Text, TextInput, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import { useEthereum } from '../../hooks/useWalletConnect';
import { ajukanAnggaran, getProvider } from '../../utils/blockchain';

/**
 * Screen for Pemerintah to submit budget proposals.
 */
export default function Anggaran({ navigation }) {
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kodeRegulasi, setKodeRegulasi] = useState('');
  const [anggaran, setAnggaran] = useState('');
  const { getSigner } = useEthereum();
  
  const [message, setMessage] = useState(null);
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { colors } = useTheme();

  const ANGGARAN_OPTIONS = [
    { label: '10.000.000', value: '10000000' },
    { label: '20.000.000', value: '20000000' },
    { label: '30.000.000', value: '30000000' },
  ];

  const fetchUser = async () => {
    try {
      const kodeUser = await AsyncStorage.getItem('userid');
      const namaUser = await AsyncStorage.getItem('nama');
      setKode(kodeUser || '');
      setNama(namaUser || '');
    } catch (err) {
      console.warn('Failed to fetch user data from storage:', err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleAnggaran = async () => {
    if (!kodeRegulasi || !anggaran) {
      Alert.alert('Validasi', 'Semua field wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const signer = await getSigner();
      if (!signer) {
        Alert.alert('Signer Error', 'Wallet belum terkoneksi atau tidak tersedia.');
        setLoading(false);
        return;
      }

      const txHash = await ajukanAnggaran(signer, kodeRegulasi, anggaran);
      console.log('Transaction sent with hash:', txHash);

      const provider = getProvider();
      const receipt = await provider.waitForTransaction(txHash);

      if (receipt && receipt.status === 1) {
        console.log('Transaction successful');
        setKodeRegulasi('');
        setAnggaran('');
        setProcess('Sukses');
        setMessage('Anda berhasil membuat anggaran!');
      } else {
        setProcess('Gagal');
        setMessage('Transaksi gagal di blockchain.');
      }
      setVisible(true);
    } catch (err) {
      console.error('Transaction failed:', err);
      const errmsg = err?.reason || err?.message || 'Gagal membuat anggaran';
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
          <MaterialIcons name="add-chart" size={40} color={colors.primary} />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            New Funding Proposal
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Submit academic budget for government regulation
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="labelLarge" style={styles.groupLabel}>PROPOSER IDENTITY</Text>
          <TextInput
            label="User ID"
            value={kode}
            style={styles.input}
            disabled
            mode="outlined"
            left={<TextInput.Icon icon="fingerprint" />}
          />
          <TextInput
            label="Department / Agency"
            value={nama}
            style={styles.input}
            disabled
            mode="outlined"
            left={<TextInput.Icon icon="domain" />}
          />

          <View style={styles.divider} />

          <Text variant="labelLarge" style={styles.groupLabel}>BUDGET DETAILS</Text>
          <TextInput
            label="Regulation Code"
            placeholder="e.g., REG-2024-EDU"
            value={kodeRegulasi}
            onChangeText={setKodeRegulasi}
            style={styles.input}
            mode="outlined"
            outlineColor="#334155"
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="file-document-outline" />}
          />

          <View style={styles.dropdownWrapper}>
            <Dropdown
              label="Budget Amount (IDR)"
              placeholder="Select Amount"
              options={ANGGARAN_OPTIONS}
              value={anggaran}
              onSelect={setAnggaran}
              mode="outlined"
            />
          </View>

          <Button
            mode="contained"
            onPress={handleAnggaran}
            disabled={!kodeRegulasi || !anggaran || loading}
            loading={loading}
            style={styles.submitButton}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontWeight: 'bold' }}
          >
            Submit to Blockchain
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={{ color: process === 'Sukses' ? '#10B981' : '#EF4444' }}>
            {process === 'Sukses' ? 'Proposal Submitted' : 'Submission Failed'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge">{message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)} textColor={colors.primary}>CLOSE</Button>
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
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  groupLabel: {
    color: '#4CC9F0',
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#1E293B',
  },
  dropdownWrapper: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
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
