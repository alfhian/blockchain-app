import { PieChart } from 'react-native-chart-kit';
import { Dimensions, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 48;

const AnggaranPieChart = ({ stats }) => {
	const [role, setRole] = useState(null);
	const [data, setData] = useState(null);

	useEffect(() => {
		const getRoleAndData = async () => {
			const savedRole = await AsyncStorage.getItem('role');
			setRole(savedRole);

			let savedData;

			if (savedRole === 'PEMERINTAH') {
				savedData = [
					{
						name: 'Belum Dialokasikan',
						jumlah: stats?.belumDialokasikan || 0,
						color: '#ff7675',
						legendFontColor: '#333',
						legendFontSize: 12,
					},
					{
						name: 'Menunggu Validasi',
						jumlah: stats?.menungguValidasi || 0,
						color: '#ffeaa7',
						legendFontColor: '#333',
						legendFontSize: 12,
					},
					{
						name: 'Tervalidasi',
						jumlah: stats?.tervalidasi || 0,
						color: '#55efc4',
						legendFontColor: '#333',
						legendFontSize: 12,
					},
				];
			} else if (savedRole === 'UKM' || savedRole === 'MITRA') {
				savedData = [
					{
						name: 'Menunggu Validasi',
						jumlah: stats?.menungguValidasi || 0,
						color: '#ffeaa7',
						legendFontColor: '#333',
						legendFontSize: 12,
					},
					{
						name: 'Tervalidasi',
						jumlah: stats?.tervalidasi || 0,
						color: '#55efc4',
						legendFontColor: '#333',
						legendFontSize: 12,
					},
				];
			}

			setData(savedData);
		};

		getRoleAndData();
	}, [stats]);

	return (
		<View >
			<Text style={{ color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
				Status Anggaran
			</Text>

			{data ? (
					<PieChart
						data={data}
						width={180}
						height={180}
						center={[45, 0]}
						chartConfig={{
							backgroundColor: '#ffffff',
							backgroundGradientFrom: '#ffffff',
							backgroundGradientTo: '#ffffff',
							color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
						}}
						accessor="jumlah"
						backgroundColor="transparent"
						paddingLeft="0"
						hasLegend={false}
						absolute
						// style={{position: 'absolute', left: 50}}
					/>
			) : (
				<Text style={{ textAlign: 'center' }}>Memuat chart...</Text>
			)}
		</View>
	);
};

export default AnggaranPieChart;
