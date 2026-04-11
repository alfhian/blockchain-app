import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dialog, Portal, Card, Button, Text, TextInput, useTheme } from 'react-native-paper';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import {
	WalletConnectModal,
	useWalletConnectModal,
} from '@walletconnect/modal-react-native';
import { providerMetadata, connectWallet } from '../../config/walletConnect';
import { useEthereum } from '../../hooks/useWalletConnect';
import { ajukanAnggaran } from '../../utils/blockchain';
import { getPublicRpcProvider } from '../../utils/getPublicRpcProvider';


export default function Anggaran({ navigation }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kodeRegulasi, setKodeRegulasi] = useState('');
  const [anggaran, setAnggaran] = useState('');
	const { isConnected, openModal, getSigner } = useEthereum();
	const [message, setMessage] = useState(null);
	const [process, setProcess] = useState(null);
	const [loading, setLoading] = useState(false);
	const [visible, setVisible] = useState(false);

	const { colors } = useTheme();

  const ANGGARAN = [
    { label: '10.000.000', value: '10000000' },
    { label: '20.000.000', value: '20000000' },
    { label: '30.000.000', value: '30000000' },
  ];

	const fetchUser = async () => {
    const roleUser = await AsyncStorage.getItem('role');
    const kodeUser = await AsyncStorage.getItem('userid');
    const namaUser = await AsyncStorage.getItem('nama');

    setRole(roleUser);
    setKode(kodeUser);
    setNama(namaUser);
  }

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
				Alert.alert('Signer Error', 'Wallet belum tersedia.');
				return;
			}

			const txHash = await ajukanAnggaran(signer, kodeRegulasi, anggaran);
			console.log('Transaksi berhasil dikirim dengan hash:', txHash);

			const chainId = 11155111; // ← hardcoded sementara, ganti sesuai jaringan aktif
			const ethersProvider = getPublicRpcProvider(chainId);

			const receipt = await ethersProvider.waitForTransaction(txHash);

			if (receipt.status === 1) {
				const block = await ethersProvider.getBlock(receipt.blockNumber);
				console.log('Transaksi sukses');
				console.log('TX Hash:', receipt.transactionHash);
				console.log('Block Hash:', receipt.blockHash);
				console.log('↩Previous Block Hash:', block.parentHash);

				setKodeRegulasi('');
				setAnggaran('');

				setProcess('Sukses');
				setMessage('Anda berhasil membuat anggaran!');
				setVisible(true);
			} else {
				setProcess('Sukses');
				setMessage('Anda berhasil membuat anggaran!');
				setVisible(true);
			}

		} catch (err) {
			console.error('Gagal transaksi:', err);
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
				<Text
					variant="titleLarge"
					style={{ marginBottom: 20, color: colors.inverseSurface }}
				>
					Form Transaksi Regulasi dan Anggaran Pemerintah
				</Text>

				<TextInput
					label="ID"
					value={kode}
					style={styles.input}
					disabled
				/>

				<TextInput
					label="Nama"
					value={nama}
					style={styles.input}
					disabled
				/>

				<TextInput
					label="Kode Regulasi"
					value={kodeRegulasi}
					onChangeText={setKodeRegulasi}
					style={styles.input}
				/>

				<View style={styles.input}>
					<Dropdown
						label="Anggaran"
						placeholder="Pilih Anggaran"
						options={ANGGARAN}
						value={anggaran}
						onSelect={setAnggaran}
					/>
				</View>

				<Button
					mode="contained"
					onPress={handleAnggaran}
					disabled={kodeRegulasi === '' || anggaran === '' || loading}
					loading={loading}
					style={styles.input}
				>
					Submit
				</Button>

				<WalletConnectModal
					explorerRecommendedWalletIds={[
						'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
					]}
					explorerExcludedWalletIds={'ALL'}
					projectId="1cce4f444c2ea269a7c1cd573eaf9f5c"
					providerMetadata={providerMetadata}
				/>
			</ScrollView>
			<Portal>
				<Dialog visible={visible} onDismiss={() => setVisible(false)}>
					<Dialog.Title>Anggaran {process || '...'}</Dialog.Title>
					<Dialog.Content>
						<Text>{message || '...'}</Text>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setVisible(false)}>OK</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>
		</DrawerWithContent>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
		marginTop: 50,
  },
	input: {
		marginVertical: 10,
	},
});
