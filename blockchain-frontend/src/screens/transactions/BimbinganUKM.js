import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import { Portal, Dialog, Card, Button, Text, TextInput, useTheme } from 'react-native-paper';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import {
	WalletConnectModal,
	useWalletConnectModal,
} from '@walletconnect/modal-react-native';
import { providerMetadata, connectWallet } from '../../config/walletConnect';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEthereum } from '../../hooks/useWalletConnect';
import { getAnggaranBelumDialokasikan, getUserDetails, getAllUkm, alokasikanAnggaran, getInfoAnggaran } from '../../utils/blockchain';
import { getPublicRpcProvider } from '../../utils/getPublicRpcProvider';

export default function BimbinganUKM({ navigation }) {
	const [data, setData] = useState('');
	const [user, setUser] = useState(null);
	const [nama, setNama] = useState(null);
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
	const { isConnected, openModal, getSigner, address } = useEthereum();
	const [message, setMessage] = useState(null);
	const [process, setProcess] = useState(null);
	const [loading, setLoading] = useState(false);
	const [visible, setVisible] = useState(false);

	const { colors } = useTheme();
	
	const UKM = [
		{ label: 'UKM 1', value: 'ukm1'},
		{ label: 'UKM 2', value: 'ukm2'},
	]

	const KEGIATAN = [
		{ label: 'Bimbingan', value: 'Bimbingan'},
		{ label: 'Pelatihan', value: 'Pelatihan'},
		{ label: 'Pendampingan', value: 'Pendampingan'},
	]

	const ANGGARAN = [
		{ label: '5.000.000', value: '5000000' },
		{ label: '10.000.000', value: '10000000' },
		{ label: '15.000.000', value: '15000000' },
		{ label: '20.000.000', value: '20000000' },
		{ label: '25.000.000', value: '25000000' },
		{ label: '30.000.000', value: '30000000' },
	];

	const loadAvailableAnggaran = async () => {
		try {
			const ids = await getAnggaranBelumDialokasikan();
			
			const [roleUser, kodeUser, namaUser, kontakUser] = await getUserDetails(address);
			
			setIdMitraUKM(kodeUser);
			setIdOptions(ids);
			setId('');
		} catch (err) {
			console.error("Gagal ambil ID anggaran:", err);
		}
	};

	const fetchAllUkm = async () => {
		try {
			const formatted = await getAllUkm();
			console.log(formatted);

			setUkmOptions(formatted);
		} catch (err) {
			console.error("Gagal ambil data UKM:", err);
		}
	};


	const handleSelectAnggaran = async (id) => {
		const data = await getInfoAnggaran(id);
		console.log(data);
		
		setIdPemerintah(data[0]);
		setKodeRegulasi(data[1]);
		setAnggaranPemerintah(data[2]);
		setRawAnggaranPemerintah(data[3]);
	};

	useEffect(() => {
		loadAvailableAnggaran();
		fetchAllUkm();
	}, []);

	const getFilteredOptions = (excludeList = []) => {
		if (!Array.isArray(ukmOptions)) return [];
		return ukmOptions.filter(option => !excludeList.includes(option.value));
	};

	const handleBimbinganUKM = async () => {
		if (!id || (!ukm1 && !ukm2 && !ukm3)) {
			Alert.alert('Validasi', 'ID dan minimal 1 UKM harus diisi');
			return;
		}

		const totalAnggaran =
			Number(anggaran1 || 0) +
			Number(anggaran2 || 0) +
			Number(anggaran3 || 0);

		const anggaranPemerintahNum = Number(
			anggaranPemerintah.toString().replace(/\./g, '')
		);

		if (totalAnggaran > rawAnggaranPemerintah) {
			Alert.alert('Validasi', 'Total alokasi anggaran lebih besar dari Anggaran Pemerintah');
			return;
		}

		if (totalAnggaran < rawAnggaranPemerintah) {
			Alert.alert('Validasi', 'Total alokasi anggaran lebih kecil dari Anggaran Pemerintah');
			return;
		}

		setLoading(true);

		try {
			const signer = await getSigner();
			if (!signer) {
				Alert.alert('Signer Error', 'Wallet belum tersedia.');
				return;
			}

			const ukmAddresses = [ukm1, ukm2, ukm3].filter(Boolean);
			const anggaranUkm = [anggaran1, anggaran2, anggaran3].filter(Boolean).map((a) => Number(a));
			
			const txHash = await alokasikanAnggaran(signer, id, kegiatan, ukmAddresses, anggaranUkm);
			console.log('Transaksi berhasil dikirim dengan hash:', txHash);

			const chainId = 11155111;
			const ethersProvider = getPublicRpcProvider(chainId);
			const receipt = await ethersProvider.waitForTransaction(txHash);

			if (receipt.status === 1) {
				setId('');
				setIdPemerintah('');
				setKodeRegulasi('');
				setAnggaranPemerintah('');
				setRawAnggaranPemerintah('');
				setKegiatan('');
				setUkm1('');
				setUkm2('');
				setUkm3('');
				setAnggaran1('');
				setAnggaran2('');
				setAnggaran3('');
				
				setProcess('Sukses');
				setMessage('Anda berhasil alokasi anggaran!');
				setVisible(true);
			} else {
				setProcess('Sukses');
				setMessage('Anda berhasil alokasi anggaran!');
				setVisible(true);
			}

		} catch (err) {
			console.error('Gagal transaksi:', err);
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
				<Text 
					variant="titleLarge"
					style={{marginBottom: 20, color: colors.inverseSurface }}
				>Form Transaksi Bimbingan UKM</Text>

				<Dropdown
					label="ID Transaksi"
					placeholder="Pilih ID Anggaran"
					options={[{ label: '--- Pilih Transaksi ---', value: '' }, ...idOptions]} 
					value={id}
					onSelect={(selectedId) => {
						setId(selectedId);
						handleSelectAnggaran(selectedId);
					}}
					style={styles.input}
				/>
			
				<TextInput
					label="ID Govern"
					value={idPemerintah}
					onChangeText={setIdPemerintah}
					style={styles.input}
					disabled
				/>

				<TextInput
					label="ID Mitra UKM"
					value={idMitraUKM}
					onChangeText={setIdMitraUKM}
					style={styles.input}
					disabled
				/>

				<TextInput
					label="ID Regulasi"
					value={kodeRegulasi}
					onChangeText={setKodeRegulasi}
					style={styles.input}
					disabled
				/>

				<TextInput
					label="Anggaran"
					value={anggaranPemerintah}
					style={styles.input}
					disabled
				/>

				<Dropdown
					label="Kode Kegiatan"
					placeholder="Pilih Kegiatan"
					options={KEGIATAN}
					value={kegiatan}
					onSelect={setKegiatan}
				/>

				<View style={styles.dividerContainer}>
					<View style={styles.line} />
					<Text style={styles.text}>Peserta Kegiatan</Text>
					<View style={styles.line} />
				</View>

				<View style={{marginBottom: 20}}>
					<Dropdown
						label="Kode UKM"
						placeholder="Pilih UKM"
						options={getFilteredOptions([ukm2, ukm3])}
						value={ukm1}
						onSelect={setUkm1}
						style={styles.input}
					/>

					<Dropdown
						label="Anggaran"
						placeholder="Pilih Anggaran"
						options={ANGGARAN}
						value={anggaran1}
						onSelect={setAnggaran1}
						style={styles.input}
					/>
				</View>

				<View style={{marginBottom: 20}}>
					<Dropdown
						label="Kode UKM"
						placeholder="Pilih UKM"
						options={getFilteredOptions([ukm1, ukm3])}
						value={ukm2}
						onSelect={setUkm2}
						style={styles.input}
					/>

					<Dropdown
						label="Anggaran"
						placeholder="Pilih Anggaran"
						options={ANGGARAN}
						value={anggaran2}
						onSelect={setAnggaran2}
						style={styles.input}
					/>
				</View>

				<View style={{marginBottom: 20}}>
					<Dropdown
						label="Kode UKM"
						placeholder="Pilih UKM"
						options={getFilteredOptions([ukm1, ukm2])}
						value={ukm3}
						onSelect={setUkm3}
						style={styles.input}
					/>

					<Dropdown
						label="Anggaran"
						placeholder="Pilih Anggaran"
						options={ANGGARAN}
						value={anggaran3}
						onSelect={setAnggaran3}
						style={styles.input}
					/>
				</View>

				<Button
					mode="contained"
					onPress={handleBimbinganUKM}
					disabled={
						(kodeRegulasi === '' || anggaranPemerintah === '' || loading)
					}
					loading={loading}
					style={{marginTop: 20}}
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
          <Dialog.Title>Alokasi Anggaran {process || '...'}</Dialog.Title>
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
		paddingBottom: 100,
  },
	input: {
		marginVertical: 10,
	},
	submit: {
		width: '100%',
		borderRadius: 0, // opsional: biar sudut bawah rata jika di bawah
	},
	buttonContainer: {
		width: '100%',
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 16
	},
	title: {
		marginBottom: 24,
		textAlign: 'center',
	},
	dividerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 20,
	},
	line: {
		flex: 1,
		height: 1,
		backgroundColor: '#ccc',
	},
	text: {
		marginHorizontal: 10,
		color: '#888',
		fontSize: 14,
	},
});
