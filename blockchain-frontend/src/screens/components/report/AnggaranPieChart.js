import { PieChart } from 'react-native-chart-kit';
import { Dimensions, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

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
						name: 'Unallocated',
						jumlah: stats?.belumDialokasikan || 0,
						color: '#F59E0B', // Amber
						legendFontColor: '#CBD5E1',
						legendFontSize: 12,
					},
					{
						name: 'Pending',
						jumlah: stats?.menungguValidasi || 0,
						color: '#3B82F6', // Blue
						legendFontColor: '#CBD5E1',
						legendFontSize: 12,
					},
					{
						name: 'Validated',
						jumlah: stats?.tervalidasi || 0,
						color: '#10B981', // Emerald
						legendFontColor: '#CBD5E1',
						legendFontSize: 12,
					},
				];
			} else {
				savedData = [
					{
						name: 'Pending',
						jumlah: stats?.menungguValidasi || 0,
						color: '#3B82F6',
						legendFontColor: '#CBD5E1',
						legendFontSize: 12,
					},
					{
						name: 'Validated',
						jumlah: stats?.tervalidasi || 0,
						color: '#10B981',
						legendFontColor: '#CBD5E1',
						legendFontSize: 12,
					},
				];
			}

			setData(savedData);
		};

		getRoleAndData();
	}, [stats]);

	return (
		<View style={{ alignItems: 'center' }}>
			{data ? (
					<PieChart
						data={data}
						width={200}
						height={200}
						center={[50, 0]}
						chartConfig={{
							color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
						}}
						accessor="jumlah"
						backgroundColor="transparent"
						paddingLeft="0"
						hasLegend={false}
						absolute
					/>
			) : (
				<Text style={{ color: '#94A3B8' }}>Loading chart...</Text>
			)}
		</View>
	);
};

export default AnggaranPieChart;
