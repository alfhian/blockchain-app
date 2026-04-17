import React, { useEffect, useState } from "react";
import { View, Dimensions, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from "react-native-chart-kit";
import { Contract } from 'ethers';
import { useEthereum } from "../../../hooks/useWalletConnect";
import { getProvider } from "../../../utils/blockchain";
import AnggaranBantuanABI from '../../../abis/AnggaranBantuanABI.json';
import dayjs from "dayjs";
import "dayjs/locale/id";

dayjs.locale("id");

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x68a25bb8C9E7E1FF272023F948b2969793e09be7';

const LineChartAnggaran = () => {
  const [chartData, setChartData] = useState(null);
  const { address } = useEthereum();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!address) return;
        
        const roleUser = await AsyncStorage.getItem('role');
        const provider = getProvider();
        const contract = new Contract(CONTRACT_ADDRESS, AnggaranBantuanABI.abi, provider);
        
        // Use the actual contract function name if it exists, otherwise fallback safely
        let result = [];
        try {
          // Check if this exists in your contract
          result = await contract.getAllAnggaranRingkas();
        } catch (e) {
          console.warn("getAllAnggaranRingkas not found or failed", e);
        }

        const now = dayjs();
        const sixMonthsAgo = now.subtract(5, 'month').startOf('month');
        const monthlyTotals = {};

        for (let item of result) {
          // In the refactored contract, item might be a struct or we need getAnggaran
          const detail = await contract.getAnggaran(item.id);

          // detail index: [id, idPemerintah, kodePemerintah, kodeRegulasi, jumlahAnggaran, kegiatan, disetujui, mitraPengalokasi, ukmTerpilih, ...]
          if (roleUser === 'PEMERINTAH') {
            const idPemerintah = detail[1];
            if (idPemerintah.toLowerCase() !== address.toLowerCase()) continue;
          }

          if (roleUser === 'MITRA') {
            const idMitra = detail[7];
            if (!idMitra || idMitra.toLowerCase() !== address.toLowerCase()) continue;
          }

          if (roleUser === 'UKM') {
            const ukmList = detail[8]; 
            const isUKMTerpilih = Array.isArray(ukmList) && ukmList.some((addr) =>
              addr.toLowerCase() === address.toLowerCase()
            );
            if (!isUKMTerpilih) continue;
          }

          const timestamp = parseInt(item.submitTimestamp.toString()) * 1000;
          const date = dayjs(timestamp);
          if (date.isBefore(sixMonthsAgo)) continue;

          const label = date.format("MMM");
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
          data.push(inMillions || 0);
        }

        setChartData({
          labels,
          datasets: [{ data: data.length > 0 ? data : [0, 0, 0, 0, 0, 0] }]
        });

      } catch (error) {
        console.error("Gagal memuat data anggaran:", error);
      }
    };

    fetchData();
  }, [address]);

  if (!chartData) return <Text style={{ color: '#94A3B8', textAlign: 'center' }}>Syncing with blockchain...</Text>;

  const screenWidth = Dimensions.get("window").width;

  return (
    <View style={{ alignItems: 'center' }}>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: chartData.datasets,
        }}
        width={screenWidth - 80}
        height={200}
        chartConfig={{
          backgroundColor: "#1E293B",
          backgroundGradientFrom: "#1E293B",
          backgroundGradientTo: "#1E293B",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 201, 240, ${opacity})`, // primary color
          labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // slate-400
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#4CC9F0",
          },
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      <Text style={{ textAlign: 'center', color: '#64748B', fontSize: 11, marginTop: 4 }}>
        Values in Million IDR
      </Text>
    </View>
  );
};

export default LineChartAnggaran;
