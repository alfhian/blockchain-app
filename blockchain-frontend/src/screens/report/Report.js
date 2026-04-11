import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from "ethers";
import DrawerWithContent from "../../navigation/DrawerWithContent";
import { useEthereum } from "../../hooks/useWalletConnect";
import { getPublicRpcProvider } from "../../utils/getPublicRpcProvider";
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

export default function AnggaranListByPemerintah({ navigation }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { address } = useEthereum();
  const { colors } = useTheme();
	const [role, setRole] = useState(null);
	const [kode, setKode] = useState(null);
	const [nama, setNama] = useState(null);

  useEffect(() => {
    const fetchAnggaran = async () => {
      try {
				const roleUser = await AsyncStorage.getItem('role');
				const kodeUser = await AsyncStorage.getItem('userid');
				const namaUser = await AsyncStorage.getItem('nama');

				setRole(roleUser);
				setKode(kodeUser);
				setNama(namaUser);

        const provider = getPublicRpcProvider(11155111);
				const contract = new ethers.Contract(CONTRACT_ADDRESS, AnggaranBantuanABI.abi, provider);

				const hashMap = {};

				console.log('mulai ambil block');
				
				const iface = new ethers.Interface(AnggaranBantuanABI.abi);
				const topic = iface.getEvent("AnggaranDiajukan").topicHash;

				const logs = await provider.getLogs({
					address: CONTRACT_ADDRESS,
					fromBlock: 0, // atau latestBlock - 5000 untuk performa
					toBlock: "latest",
					topics: [topic]
				});

				for (const log of logs) {
					const parsed = iface.parseLog(log);
					const txHash = log.transactionHash;
					const blockHash = log.blockHash;

					const block = await provider.getBlock(blockHash);

					hashMap[parsed.args.id.toString()] = {
						txHash,
						blockHash,
						previousBlockHash: block.parentHash,
					};
				}

        const ringkas = await contract.getAllAnggaranRingkas();
        const dataLengkap = [];

        for (let item of ringkas) {
          const detail = await contract.getAnggaran(item.id);

					const hashDetail = hashMap[item.id?.toString()] || {};

					if (!hashDetail) {
						console.warn(`Hash tidak ditemukan untuk ID: ${item.id}`);
					}

          if (roleUser === 'PEMERINTAH' && detail[1].toLowerCase() === address.toLowerCase()) {
            dataLengkap.push({
              id: item.id.toString(),
              kodePemerintah: detail[2],
              jumlahAnggaran: item.jumlahAnggaran.toString(),
              kegiatan: detail[5],
              submitTimestamp: item.submitTimestamp.toString(),
              validasiTimestamp: item.validasiTimestamp.toString(),
              sudahValidasi: item.sudahValidasi,
              sudahDialokasikan: item.sudahDialokasikan,
							txHash: hashDetail?.txHash || null,
							blockHash: hashDetail?.blockHash || null,
							previousBlockHash: hashDetail?.previousBlockHash || null,
            });
          }

					console.log('role ', role);
					console.log('pengalokasi', detail[7]);
					console.log('address', address);

					if (roleUser === 'MITRA' && detail[7].toLowerCase() === address.toLowerCase()) {
						dataLengkap.push({
              id: item.id.toString(),
              kodePemerintah: detail[2],
              jumlahAnggaran: item.jumlahAnggaran.toString(),
              kegiatan: detail[5],
              submitTimestamp: item.submitTimestamp.toString(),
              validasiTimestamp: item.validasiTimestamp.toString(),
              sudahValidasi: item.sudahValidasi,
							txHash: hashDetail?.txHash || null,
							blockHash: hashDetail?.blockHash || null,
							previousBlockHash: hashDetail?.previousBlockHash || null,
            });
					}

					const ukmList = detail[8]; // index ke-8 untuk ukmTerpilih
					const isUKMTerpilih = Array.isArray(ukmList) && ukmList.some((addr) =>
						addr.toLowerCase() === address.toLowerCase()
					);

					if (roleUser === 'UKM' && isUKMTerpilih) {
						dataLengkap.push({
							id: item.id.toString(),
							kodePemerintah: detail[2],
							jumlahAnggaran: item.jumlahAnggaran.toString(),
              kegiatan: detail[5],
							submitTimestamp: item.submitTimestamp.toString(),
							validasiTimestamp: item.validasiTimestamp.toString(),
							sudahValidasi: item.sudahValidasi,
							txHash: hashDetail?.txHash || null,
							blockHash: hashDetail?.blockHash || null,
							previousBlockHash: hashDetail?.previousBlockHash || null,
						});
					}
        }

        setItems(dataLengkap);
      } catch (error) {
        console.error("Gagal ambil data anggaran:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnggaran();
  }, []);

  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getStatusLabel = (item) => {
		if (role === 'PEMERINTAH') {
			if (!item.sudahDialokasikan) return "Belum Dialokasikan";
			if (!item.sudahValidasi) return "Menunggu Validasi";
			return "Tervalidasi";
		}

		if (role === 'MITRA' || role === 'UKM') {
			return item.sudahValidasi ? "Tervalidasi" : "Menunggu Validasi";
		}

		return "-";
  };

  const getStatusColor = (item) => {
		if (role === 'PEMERINTAH') {
			if (!item.sudahDialokasikan) return "#F44336";
			if (!item.sudahValidasi) return "#FF9800";
			return "#4CAF50";
		}

		if (role === 'MITRA' || role === 'UKM') {
			if (!item.sudahValidasi) return "#FF9800";
			return "#4CAF50";
		}

		return "#4CAF50";
  };

  return (
    <DrawerWithContent navigation={navigation}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.header}>Daftar Anggaran Pemerintah</Text>

        {isLoading ? (
          <Text style={styles.loading}>Memuat data anggaran...</Text>
        ) : items.length > 0 ? (
          <>
            {paginatedItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.title}>ID: {item.id}</Text>
                <Text style={styles.text}>
                  Kode Pemerintah:{' '}
                  {(() => {
                    try {
                      return ethers.decodeBytes32String(item.kodePemerintah);
                    } catch {
                      return "Tidak valid";
                    }
                  })()}
                </Text>
                <Text style={styles.text}>Jumlah: Rp. {formatToJuta(item.jumlahAnggaran)}</Text>
                <Text style={styles.text}>Kegiatan: {item.kegiatan ? ethers.decodeBytes32String(item.kegiatan) : '-'}</Text>
                <Text style={styles.text}>Submit: {formatDateTime(item.submitTimestamp)}</Text>
                <Text style={styles.text}>
                  Validasi:{' '}
                  {item.sudahValidasi ? formatDateTime(item.validasiTimestamp) : "-"}
                </Text>
                <Text
                  style={[styles.badge, { backgroundColor: getStatusColor(item) }]}
                >
                  {getStatusLabel(item)}
                </Text>
								{item.sudahValidasi && item.txHash && (
									<View style={{ marginTop: 8 }}>
										<Text style={styles.text}>Tx Hash: {item.txHash.slice(0, 10)}...{item.txHash?.slice(-6)}</Text>
										<Text style={styles.text}>Block Hash: {item.blockHash.slice(0, 10)}...{item.blockHash?.slice(-6)}</Text>
										<Text style={styles.text}>Prev Block: {item.previousBlockHash.slice(0, 10)}...{item.previousBlockHash?.slice(-6)}</Text>
									</View>
								)}
              </View>
            ))}

            <View style={styles.paginationContainer}>
							<TouchableOpacity
								onPress={() => setPage((p) => Math.max(p - 1, 1))}
								disabled={page === 1}
							>
								<Text style={[styles.iconButton, page === 1 && styles.disabledButton]}>
									◀
								</Text>
							</TouchableOpacity>

							<Text style={styles.pageInfo}>
								Halaman {page} dari {Math.ceil(items.length / ITEMS_PER_PAGE)}
							</Text>

							<TouchableOpacity
								onPress={() => setPage((p) =>
									Math.min(p + 1, Math.ceil(items.length / ITEMS_PER_PAGE))
								)}
								disabled={page * ITEMS_PER_PAGE >= items.length}
							>
								<Text
									style={[
										styles.iconButton,
										page * ITEMS_PER_PAGE >= items.length && styles.disabledButton,
									]}
								>
									▶
								</Text>
							</TouchableOpacity>
						</View>

          </>
        ) : (
          <Text style={styles.loading}>Belum ada data anggaran untuk address ini.</Text>
        )}
      </ScrollView>
    </DrawerWithContent>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
  },
  header: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#1F1F1F", // abu tua
		padding: 16,
		borderRadius: 12,
		marginBottom: 14,
		elevation: 3,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 2 },
		borderWidth: 1,
		borderColor: "#2A2A2A",
  },
  title: {
    fontWeight: "bold",
		marginBottom: 6,
		fontSize: 16,
		color: "#FFFFFF",
  },
	text: {
		color: "#DDD",
		marginBottom: 4,
		fontSize: 14,
	},
  loading: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
  badge: {
    marginTop: 12,
		alignSelf: "flex-start",
		backgroundColor: "#4CAF50", // akan diganti dinamis
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 20,
		fontSize: 13,
		color: "#fff",
		fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  pageButton: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  disabledButton: {
    color: "#ccc",
  },
  pageLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
	paginationContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
		gap: 24,
	},
	iconButton: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#007AFF",
	},
	disabledButton: {
		color: "#ccc",
	},
	pageInfo: {
		fontSize: 14,
		fontWeight: "600",
	},

});
