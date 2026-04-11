import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-paper-dropdown';
import { Dialog, Portal, Card, Button, Text, TextInput, useTheme } from 'react-native-paper';
import DrawerWithContent from '../../navigation/DrawerWithContent';
import { useEthereum } from '../../hooks/useWalletConnect';
import { getAnggaranUntukUKM, getUserDetails, getAnggaranUntukUKMById, validasiDana } from '../../utils/blockchain';
import { getPublicRpcProvider } from '../../utils/getPublicRpcProvider';

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
		try {
			const ids = await getAnggaranUntukUKM(address);
			const [roleUser, kodeUser, namaUser, kontakUser] = await getUserDetails(address);

			setKodeUKM(kodeUser);
			setIdOptions(ids);
			setId('');
		} catch (err) {
			console.error("Gagal ambil ID anggaran:", err);
		}
	};

	const handleSelectAnggaran = async (id) => {
		const data = await getAnggaranUntukUKMById(id, address);

		setIdPemerintah(data[0]);
		setKodeRegulasi(data[1]);
		setAnggaranPemerintah(data[2]);
		setKegiatan(data[4]);
		setIdMitraUKM(data[5]);
		setAnggaran(data[6]);
	};

	useEffect(() => {
		loadAnggaranUKM();
	}, []);


  const handleValidasiAnggaran = async () => {
		setLoading(true);

		try {
			const signer = await getSigner();
			if (!signer) {
				Alert.alert('Signer Error', 'Wallet belum tersedia.');
				return;
			}

			const txHash = await validasiDana(signer, id);
			console.log('📦 Transaksi berhasil dikirim dengan hash:', txHash);

			const chainId = 11155111;
			const ethersProvider = getPublicRpcProvider(chainId);
			const receipt = await ethersProvider.waitForTransaction(txHash);

			if (receipt.status === 1) {
				setId('');
				setIdPemerintah('');
				setKodeRegulasi('');
				setAnggaranPemerintah('');
				setKegiatan('');
				setIdMitraUKM('');
				setAnggaran('');

				setProcess('Sukses');
				setMessage('Anda berhasil validasi anggaran!');
				setVisible(true);
			} else {
				setProcess('Sukses');
				setMessage('Anda berhasil validasi anggaran');
				setVisible(true);
			}

		} catch (err) {
			console.error('Gagal transaksi:', err);
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
				<Text 
					variant="titleLarge"
					style={{marginBottom: 20, color: colors.inverseSurface }}
				>Form Validasi UKM</Text>
				
				<Dropdown
					label="ID Transaksi"
					placeholder="Pilih ID Anggaran"
					options={[{ label: '--- Pilih Transaksi ---', value: '' }, ...idOptions]} 
					value={id}
					onSelect={(selectedId) => {
						setId(selectedId);
						handleSelectAnggaran(selectedId);
					}}
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

				<Text
					label="Kode Kegiatan"
					value={kegiatan}
					style={styles.input}
					disabled
				/>

				<View style={styles.dividerContainer}>
					<View style={styles.line} />
					<Text style={[styles.text, { color: colors.inverseSurface }]}>Peserta Kegiatan</Text>
					<View style={styles.line} />
				</View>

				<View style={{marginBottom: 20}}>
					<TextInput
						label="Kode UKM"
						value={kodeUKM}
						style={styles.input}
						disabled
					/>

					<TextInput
						label="Anggaran"
						value={anggaran}
						style={styles.input}
						disabled
					/>
				</View>

				<Button
					mode="contained"
					onPress={handleValidasiAnggaran}
					disabled={
						(kodeRegulasi === '' || anggaranPemerintah === '' || loading)
					}
					loading={loading}
					style={{marginTop: 20}}
				>
						Validasi
				</Button>
			</ScrollView>
			<Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Validasi {process || '...'}</Dialog.Title>
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
