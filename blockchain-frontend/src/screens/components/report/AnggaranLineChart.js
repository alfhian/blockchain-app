import React, { useEffect, useState } from "react";
import { View, Dimensions, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from "react-native-chart-kit";
import { getPublicRpcProvider } from '../../../utils/getPublicRpcProvider';
import { ethers } from 'ethers';
import { useEthereum } from "../../../hooks/useWalletConnect";
import AnggaranBantuanABI from '../../../abis/AnggaranBantuanABI.json';
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const CONTRACT_ADDRESS = '0x68a25bb8C9E7E1FF272023F948b2969793e09be7';

const LineChartAnggaran = () => {
  const [chartData, setChartData] = useState(null);
  const { address } = useEthereum();

  useEffect(() => {
    const fetchData = async () => {
      try {
				const roleUser = await AsyncStorage.getItem('role');

        const provider = getPublicRpcProvider(11155111);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, AnggaranBantuanABI.abi, provider);
        const result = await contract.getAllAnggaranRingkas();

        const now = dayjs();
        const sixMonthsAgo = now.subtract(5, 'month').startOf('month');
        const monthlyTotals = {};

        for (let item of result) {
          const detail = await contract.getAnggaran(item.id);

          if (roleUser === 'PEMERINTAH') {
            const idPemerintah = detail[1];
            if (idPemerintah.toLowerCase() !== address.toLowerCase()) continue;
          }

          if (roleUser === 'MITRA') {
            const idMitra = detail[7];
            if (idMitra.toLowerCase() !== address.toLowerCase()) continue;
          }

          if (roleUser === 'UKM') {
            const ukmList = detail[8]; // index ke-8 untuk ukmTerpilih
            const isUKMTerpilih = Array.isArray(ukmList) && ukmList.some((addr) =>
              addr.toLowerCase() === address.toLowerCase()
            );
            if (!isUKMTerpilih) continue;
          }

          const timestamp = parseInt(item.submitTimestamp.toString()) * 1000;
          const date = dayjs(timestamp);
          if (date.isBefore(sixMonthsAgo)) continue;

          const label = date.format("MMM"); // Misal: 'Jul'
          if (!monthlyTotals[label]) monthlyTotals[label] = 0;
          monthlyTotals[label] += parseInt(item.jumlahAnggaran.toString());
        }

        const labels = [];
        const data = [];

        for (let i = 0; i < 6; i++) {
          const label = now.subtract(5 - i, 'month').format("MMM");
          labels.push(label);
          const rawValue = monthlyTotals[label] || 0;
          const inMillions = Math.floor(rawValue / 1_000_000);
          data.push(inMillions);
        }

        setChartData({
          labels,
          datasets: [{ data }]
        });

      } catch (error) {
        console.error("Gagal memuat data anggaran:", error);
      }
      };

    fetchData();
  }, []);

  if (!chartData) return <Text style={{ color: '#fff' }}>Memuat data...</Text>;

  return (
    <View>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: "center", marginBottom: 10 }}>
        Tren Total Anggaran
      </Text>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets,
        }}
        width={300}
        height={200}
        chartConfig={{
          fromZero: true,
          backgroundGradientFrom: "#1E2923",
          backgroundGradientTo: "#08130D",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => "#ffffff",
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#000",
          },
        }}
        bezier={false}
        style={{
          marginVertical: 8,
          borderRadius: 12,
          alignSelf: 'center'
        }}
      />
      <Text style={{ textAlign: 'center', color: '#fff', fontSize: 12 }}>
        *Nilai dalam jutaan rupiah
      </Text>
    </View>
  );
};

export default LineChartAnggaran;
