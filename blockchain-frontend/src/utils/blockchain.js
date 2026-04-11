import { Web3Provider } from '@ethersproject/providers';
import contractABI from '../abis/AnggaranBantuanABI.json';
import { getPublicRpcProvider } from './getPublicRpcProvider';
import { Contract, Signer, ethers } from 'ethers';

const contractAddress = '0x68a25bb8C9E7E1FF272023F948b2969793e09be7'; 

const safeDecode = (val) => {
  try {
    return ethers.decodeBytes32String(val);
  } catch {
    return val; // fallback if not decodable
  }
};

export const getUserDetails = async (address) => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new Contract(contractAddress, contractABI.abi, provider);
  const userData = await contract.users(address);

  const role = typeof userData.role === 'string' ? userData.role : safeDecode(userData.role);
  const kode = safeDecode(userData.kode);
  const nama = safeDecode(userData.nama);

  return [role, kode, nama, userData.kontak];
};


export const registerUser = async (signer, roleText, kode, nama, kontak) => {
  if (!roleText || !kode) {
    throw new Error('Kode dan role wajib diisi untuk registrasi');
  }

  try {
    const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);

    const tx = await contract.registerUser(
      ethers.encodeBytes32String(kode),
      roleText.toUpperCase(),
      ethers.encodeBytes32String(nama),
      kontak
    );

    console.log('Transaksi dikirim! Hash:', tx.hash);

    return tx.hash;
  } catch (err) {
    console.error('Gagal registrasi user:', err);
    throw err;
  }
};


export const ajukanAnggaran = async (signer, kodeRegulasi, jumlahAnggaran) => {
  if (!kodeRegulasi || !jumlahAnggaran) {
    throw new Error('Semua field wajib diisi untuk ajukanAnggaran');
  }

  try {
    console.log('Memulai ajukanAnggaran...');
    const contract = new Contract(contractAddress, contractABI.abi, signer);
    const address = await signer.getAddress();

    console.log('Jumlah anggaran:', jumlahAnggaran);

    const encodedData = contract.interface.encodeFunctionData('ajukanAnggaran', [
      ethers.encodeBytes32String(kodeRegulasi),
      jumlahAnggaran.toString(),
    ]);

    const txParams = {
      from: address,
      to: contractAddress,
      data: encodedData,
    };

    console.log('Mengirim transaksi melalui provider...');
    const txHash = await signer.provider.send('eth_sendTransaction', [txParams]);
    console.log('Transaksi berhasil dikirim:', txHash);

    return txHash;
  } catch (err) {
    console.error('Gagal ajukan anggaran:', err);
    throw err;
  }
};


export const getAnggaranBelumDialokasikan = async () => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
  const ids = await contract.getAnggaranBelumDialokasikan();

  const parsedIds = ids.map(id => ({
    label: `Anggaran #${id.toString()}`,
    value: id.toString()
  }));

  return parsedIds;
}

export const getAllUkm = async () => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
  const [addresses, codes, names] = await contract.getAllUKMWithData();

  const kode = codes.map(safeDecode);
  const nama = names.map(safeDecode);
  
  const formatted = addresses.map((addr, i) => ({
    label: `${nama[i]} (${kode[i]})`,
    value: addr,
  }));

  return formatted;
}

export const getInfoAnggaran = async (id) => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
  const [kode, kodeRegulasi, jumlahAnggaran] = await contract.getInfoAnggaran(id);
  const anggaranNumber = Number(jumlahAnggaran.toString());
  const formatted = new Intl.NumberFormat("id-ID").format(anggaranNumber);

  const kodePemerintah = safeDecode(kode);
  const kodeReg = safeDecode(kodeRegulasi);

  const result = [
    kodePemerintah,
    kodeReg,
    formatted,
    jumlahAnggaran,
  ]

  return result;
}

export const alokasikanAnggaran = async (signer, id, kegiatan, ukmAddresses, anggaranUkm) => {
  if (!id || !Array.isArray(ukmAddresses) || ukmAddresses.length === 0 || ukmAddresses.length > 3) {
    throw new Error('ID dan 1-3 alamat UKM wajib diisi');
  }

  try {
    console.log('Memulai alokasikanAnggaran...');
    const contract = new Contract(contractAddress, contractABI.abi, signer);
    const address = await signer.getAddress();

    const encodedData = contract.interface.encodeFunctionData('alokasikanAnggaran', [
      id,
      ethers.encodeBytes32String(kegiatan),
      ukmAddresses,
      anggaranUkm,
    ]);

    const txParams = {
      from: address,
      to: contractAddress,
      data: encodedData,
    };

    const txHash = await signer.provider.send('eth_sendTransaction', [txParams]);
    console.log('Transaksi berhasil dikirim:', txHash);

    return txHash;
  } catch (err) {
    console.error('Gagal alokasikan anggaran:', err);
    throw err;
  }
};


export const getAnggaranUntukUKM = async (address) => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
  const data = await contract.getAnggaranUntukUKM(address);

  const parsedIds = data.map(anggaran => ({
    label: `Anggaran #${anggaran.id.toString()}`,
    value: anggaran.id.toString()
  }));

  return parsedIds;
}

export const getAnggaranUntukUKMById = async (id, address) => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);
  const [idAnggaran, idPemerintah, kode, kodeRegulasi, jumlahAnggaran, kegiatan, disetujui, mitraPengalokasi, ukmTerpilih, jumlahValidasi, semuaUKMSudahValidasi] = await contract.getAnggaran(id);
  const data = await contract.getAnggaranUntukUKMById(id, address);
  const anggaranNumber = Number(jumlahAnggaran.toString());
  const anggaranUKMNumber = Number(data[0][3].toString());
  const formatted = new Intl.NumberFormat("id-ID").format(anggaranNumber);
  const formattedAnggaran = new Intl.NumberFormat("id-ID").format(anggaranUKMNumber);
  
  const [roleUser, kodeUser, namaUser, kontakUser]  = await getUserDetails(mitraPengalokasi);

  const kodePemerintah = safeDecode(kode);
  const kodeReg = safeDecode(kodeRegulasi);
  const kegiatanText = safeDecode(kegiatan);

  const result = [
    kodePemerintah,
    kodeReg,
    formatted,
    jumlahAnggaran,
    kegiatanText,
    kodeUser,
    formattedAnggaran,
  ];

  return result;
}


export const validasiDana = async (signer, id) => {
  if (!id) {
    throw new Error('ID wajib diisi');
  }

  try {
    console.log('Memulai validasDana...');
    const contract = new Contract(contractAddress, contractABI.abi, signer);
    const address = await signer.getAddress();

    const encodedData = contract.interface.encodeFunctionData('validasiDana', [
      id,
    ]);

    const txParams = {
      from: address,
      to: contractAddress,
      data: encodedData,
    };

    const txHash = await signer.provider.send('eth_sendTransaction', [txParams]);
    console.log('Transaksi berhasil dikirim:', txHash);

    return txHash;
  } catch (err) {
    console.error('Gagal alokasikan anggaran:', err);
    throw err;
  }
};


export const pieChartAnggaran = async (role, address) => {
  const provider = getPublicRpcProvider(11155111);
  const contract = new ethers.Contract(contractAddress, contractABI.abi, provider);

  let result;

  if (role == 'PEMERINTAH') {
    stats = await contract.getStatistikAnggaran();
    console.log('stats dari blockchain ', stats);
    
    result = {
      belumDialokasikan: Number(stats[0]),
      menungguValidasi: Number(stats[1]),
      tervalidasi: Number(stats[2]),
    };
  }

  if (role == 'MITRA') {
    stats = await contract.getJumlahTransaksiAlokasiMitra(address);
    result = {
      menungguValidasi: Number(stats[0]),
      tervalidasi: Number(stats[1]),
    };
  }

  if (role == 'UKM') {
    stats = await contract.getStatistikAnggaranUntukUKM(address);
    result = {
      menungguValidasi: Number(stats[0]),
      tervalidasi: Number(stats[1]),
    };
  }

  return result;
}
